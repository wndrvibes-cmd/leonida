-- LEONIDA 0002 : actualites, publications communautaires, moments, medias

create type public.content_status as enum ('draft','scheduled','published','archived');
create type public.post_surface  as enum ('community','moment');
create type public.post_type     as enum (
  'discussion','tip','discovery','vehicle','mission','secret','question','screenshot','video','other'
);
create type public.media_kind    as enum ('image','video','video_link');
create type public.reliability   as enum ('official','reliable','community','rumor');

create table public.news_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  label      text not null,
  accent     text not null default 'surf',
  sort_order int  not null default 0,
  is_active  boolean not null default true
);

create table public.news_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title         text not null check (length(title) between 3 and 180),
  excerpt       text check (length(excerpt) <= 400),
  body          text,
  cover_url     text,
  category_id   uuid references public.news_categories(id) on delete set null,
  author_id     uuid references auth.users(id) on delete set null,
  source_name   text,
  source_url    text,
  reliability   public.reliability not null default 'community',
  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  tags          text[] not null default '{}',
  view_count    bigint not null default 0,
  allow_comments boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.news_articles.reliability is
  'Niveau de fiabilite affiche a l''utilisateur. Une rumeur ne doit jamais etre presentee comme un fait.';

create index news_published_idx on public.news_articles (published_at desc nulls last)
  where status = 'published';
create index news_category_idx  on public.news_articles (category_id);
create index news_tags_idx      on public.news_articles using gin (tags);
create index news_search_idx    on public.news_articles
  using gin (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(excerpt,'')));

create trigger news_set_updated_at before update on public.news_articles
  for each row execute function public.tg_set_updated_at();

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  surface     public.post_surface not null default 'community',
  post_type   public.post_type    not null default 'discussion',
  title       text check (length(title) <= 140),
  body        text check (length(body) <= 8000),
  tags        text[] not null default '{}',
  is_pinned   boolean not null default false,
  is_hidden   boolean not null default false,
  hidden_reason text,
  comment_count  int not null default 0,
  reaction_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint posts_has_content check (
    coalesce(length(trim(body)),0) > 0 or coalesce(length(trim(title)),0) > 0
  )
);

create index posts_feed_idx    on public.posts (surface, created_at desc) where is_hidden = false;
create index posts_author_idx  on public.posts (author_id, created_at desc);
create index posts_popular_idx on public.posts (surface, reaction_count desc, created_at desc)
  where is_hidden = false;
create index posts_tags_idx    on public.posts using gin (tags);
create index posts_search_idx  on public.posts
  using gin (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(body,'')));

create trigger posts_set_updated_at before update on public.posts
  for each row execute function public.tg_set_updated_at();

-- Empeche un membre de changer l'auteur, de s'epingler ou de se demasquer.
-- NOTE : cette fonction est REDEFINIE en 0003 pour laisser passer les
-- compteurs mis a jour par les declencheurs d'engagement.
create or replace function public.tg_protect_post_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.author_id  := old.author_id;
  new.created_at := old.created_at;
  if not public.is_staff() then
    new.is_pinned      := old.is_pinned;
    new.is_hidden      := old.is_hidden;
    new.hidden_reason  := old.hidden_reason;
    new.comment_count  := old.comment_count;
    new.reaction_count := old.reaction_count;
  end if;
  return new;
end $$;

create trigger posts_protect_fields before update on public.posts
  for each row execute function public.tg_protect_post_fields();

create table public.post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  kind       public.media_kind not null default 'image',
  url        text not null,
  caption    text check (length(caption) <= 240),
  width      int,
  height     int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index post_media_post_idx on public.post_media (post_id, sort_order);

create table public.news_media (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  kind       public.media_kind not null default 'image',
  url        text not null,
  caption    text check (length(caption) <= 240),
  credit     text,
  sort_order int not null default 0
);
create index news_media_article_idx on public.news_media (article_id, sort_order);

-- ================================= RLS ======================================
alter table public.news_categories enable row level security;
alter table public.news_articles   enable row level security;
alter table public.posts           enable row level security;
alter table public.post_media      enable row level security;
alter table public.news_media      enable row level security;

create policy "news_categories_read" on public.news_categories for select using (is_active or public.is_staff());
create policy "news_categories_admin" on public.news_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "news_read_published" on public.news_articles for select
  using (status = 'published' and (published_at is null or published_at <= now()));
create policy "news_staff_read_all" on public.news_articles for select to authenticated
  using (public.is_staff());
create policy "news_staff_write" on public.news_articles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "news_media_read" on public.news_media for select
  using (exists (
    select 1 from public.news_articles a
    where a.id = article_id and a.status = 'published'
  ) or public.is_staff());
create policy "news_media_staff" on public.news_media for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "posts_read_visible" on public.posts for select
  using (is_hidden = false);
create policy "posts_read_own" on public.posts for select to authenticated
  using ((select auth.uid()) = author_id or public.is_staff());

create policy "posts_insert_own" on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and not public.is_suspended()
  );

create policy "posts_update_own" on public.posts for update to authenticated
  using ((select auth.uid()) = author_id and not public.is_suspended())
  with check ((select auth.uid()) = author_id);

create policy "posts_delete_own" on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);

create policy "posts_staff_all" on public.posts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "post_media_read" on public.post_media for select
  using (exists (select 1 from public.posts p where p.id = post_id and p.is_hidden = false)
         or public.is_staff());

create policy "post_media_write_own" on public.post_media for all to authenticated
  using (exists (select 1 from public.posts p
                 where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p
                 where p.id = post_id and p.author_id = (select auth.uid())));

create policy "post_media_staff" on public.post_media for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

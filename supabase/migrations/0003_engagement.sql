-- LEONIDA 0003 : commentaires, reactions, favoris, signalements, notifications

create type public.target_type   as enum ('post','news','marker','comment','contest');
create type public.reaction_type as enum ('fire','love','wow','funny','useful');
create type public.report_reason as enum (
  'spam','harassment','hate','nsfw','misinformation','off_topic','stolen_content','other'
);
create type public.report_status as enum ('pending','reviewing','resolved','dismissed');
create type public.notification_type as enum (
  'comment_reply','post_comment','reaction','marker_approved','marker_rejected',
  'report_resolved','subscription','contest','news','system'
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  target_type public.target_type not null,
  target_id   uuid not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  body        text not null check (length(trim(body)) between 1 and 4000),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index comments_target_idx on public.comments (target_type, target_id, created_at);
create index comments_author_idx on public.comments (author_id, created_at desc);
create index comments_parent_idx on public.comments (parent_id);

create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.tg_set_updated_at();

create or replace function public.tg_protect_comment_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.author_id   := old.author_id;
  new.target_type := old.target_type;
  new.target_id   := old.target_id;
  new.parent_id   := old.parent_id;
  new.created_at  := old.created_at;
  if not public.is_staff() then
    new.is_hidden := old.is_hidden;
  end if;
  return new;
end $$;

create trigger comments_protect_fields before update on public.comments
  for each row execute function public.tg_protect_comment_fields();

-- Contrainte d'unicite : une seule reaction par membre et par contenu.
-- C'est la protection structurelle contre le gonflage artificiel des compteurs.
create table public.reactions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type public.target_type not null,
  target_id   uuid not null,
  reaction    public.reaction_type not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index reactions_target_idx on public.reactions (target_type, target_id);

create table public.favorites (
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type public.target_type not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index favorites_user_idx on public.favorites (user_id, created_at desc);

create table public.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references auth.users(id) on delete cascade,
  target_type    public.target_type not null,
  target_id      uuid not null,
  reason         public.report_reason not null,
  details        text check (length(details) <= 1000),
  status         public.report_status not null default 'pending',
  internal_note  text,
  resolved_by    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_status_idx on public.reports (status, created_at desc);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        public.notification_type not null,
  title       text not null,
  body        text,
  link        text,
  actor_id    uuid references auth.users(id) on delete set null,
  target_type public.target_type,
  target_id   uuid,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where is_read = false;

-- Compteurs denormalises. Un drapeau de session autorise ponctuellement
-- l'ecriture, sinon tg_protect_post_fields les restaurerait.
create or replace function public.tg_sync_post_counters()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  tid uuid;
  ttype public.target_type;
begin
  tid   := coalesce(new.target_id, old.target_id);
  ttype := coalesce(new.target_type, old.target_type);
  if ttype <> 'post' then return coalesce(new, old); end if;

  perform set_config('leonida.counter_update', '1', true);

  update public.posts p set
    comment_count = (select count(*) from public.comments c
                     where c.target_type='post' and c.target_id=p.id and c.is_hidden=false),
    reaction_count = (select count(*) from public.reactions r
                      where r.target_type='post' and r.target_id=p.id)
  where p.id = tid;

  perform set_config('leonida.counter_update', '0', true);
  return coalesce(new, old);
end $$;

create or replace function public.tg_protect_post_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.author_id  := old.author_id;
  new.created_at := old.created_at;
  if not public.is_staff()
     and coalesce(current_setting('leonida.counter_update', true), '0') <> '1' then
    new.is_pinned      := old.is_pinned;
    new.is_hidden      := old.is_hidden;
    new.hidden_reason  := old.hidden_reason;
    new.comment_count  := old.comment_count;
    new.reaction_count := old.reaction_count;
  end if;
  return new;
end $$;

create trigger comments_sync_counters
  after insert or update or delete on public.comments
  for each row execute function public.tg_sync_post_counters();

create trigger reactions_sync_counters
  after insert or update or delete on public.reactions
  for each row execute function public.tg_sync_post_counters();

create or replace function public.tg_notify_on_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recipient uuid;
  kind public.notification_type;
begin
  if new.parent_id is not null then
    select author_id into recipient from public.comments where id = new.parent_id;
    kind := 'comment_reply';
  elsif new.target_type = 'post' then
    select author_id into recipient from public.posts where id = new.target_id;
    kind := 'post_comment';
  end if;

  if recipient is null or recipient = new.author_id then
    return new;
  end if;

  if not exists (
    select 1 from public.user_settings s
    where s.user_id = recipient and s.notify_replies = true
  ) then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, actor_id, target_type, target_id)
  values (recipient, kind,
          case when kind = 'comment_reply' then 'Nouvelle reponse a votre commentaire'
               else 'Nouveau commentaire sur votre publication' end,
          left(new.body, 140), new.author_id, new.target_type, new.target_id);
  return new;
end $$;

create trigger comments_notify after insert on public.comments
  for each row execute function public.tg_notify_on_comment();

-- ================================= RLS ======================================
alter table public.comments      enable row level security;
alter table public.reactions     enable row level security;
alter table public.favorites     enable row level security;
alter table public.reports       enable row level security;
alter table public.notifications enable row level security;

create policy "comments_read" on public.comments for select using (is_hidden = false);
create policy "comments_read_own_staff" on public.comments for select to authenticated
  using ((select auth.uid()) = author_id or public.is_staff());
create policy "comments_insert_own" on public.comments for insert to authenticated
  with check ((select auth.uid()) = author_id and not public.is_suspended());
create policy "comments_update_own" on public.comments for update to authenticated
  using ((select auth.uid()) = author_id and not public.is_suspended())
  with check ((select auth.uid()) = author_id);
create policy "comments_delete_own" on public.comments for delete to authenticated
  using ((select auth.uid()) = author_id);
create policy "comments_staff_all" on public.comments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "reactions_read" on public.reactions for select using (true);
create policy "reactions_insert_own" on public.reactions for insert to authenticated
  with check ((select auth.uid()) = user_id and not public.is_suspended());
create policy "reactions_update_own" on public.reactions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reactions_delete_own" on public.reactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "favorites_own" on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "reports_insert_own" on public.reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id and not public.is_suspended());
create policy "reports_select_own" on public.reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
create policy "reports_staff_all" on public.reports for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Aucune policy INSERT -> impossible de se fabriquer de fausses notifications.
create policy "notifications_select_own" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notifications_delete_own" on public.notifications for delete to authenticated
  using ((select auth.uid()) = user_id);

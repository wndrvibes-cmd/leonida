-- LEONIDA 0005 : concours & cadeaux, Radar IA, assistant, mediatheque, reglages

create type public.radar_kind    as enum ('news','gifts');
create type public.radar_status  as enum ('running','success','partial','failed');
create type public.finding_status as enum ('new','drafted','published','rejected','duplicate');
create type public.ai_role       as enum ('system','user','assistant');

create table public.contests (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title        text not null check (length(title) between 3 and 180),
  description  text,
  conditions   text,
  image_url    text,
  category     text not null default 'contest'
                 check (category in ('contest','gift','reward','offer','event')),
  link_url     text,
  source_name  text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  status       public.content_status not null default 'draft',
  is_featured  boolean not null default false,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint contests_dates check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index contests_live_idx on public.contests (status, ends_at desc nulls last);

create trigger contests_set_updated_at before update on public.contests
  for each row execute function public.tg_set_updated_at();

create table public.radar_runs (
  id           uuid primary key default gen_random_uuid(),
  kind         public.radar_kind not null default 'news',
  status       public.radar_status not null default 'running',
  trigger      text not null default 'schedule' check (trigger in ('schedule','manual')),
  provider     text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  sources_checked int not null default 0,
  items_found  int not null default 0,
  items_new    int not null default 0,
  items_duplicate int not null default 0,
  error_message text,
  quota_note   text,
  metadata     jsonb not null default '{}'::jsonb
);
create index radar_runs_recent_idx on public.radar_runs (kind, started_at desc);

create table public.radar_findings (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid references public.radar_runs(id) on delete set null,
  kind          public.radar_kind not null default 'news',
  source_name   text not null,
  source_url    text not null,
  source_published_at timestamptz,
  title_original text,
  title_fr      text,
  summary_fr    text,
  body_draft    text,
  suggested_category text,
  suggested_tags text[] not null default '{}',
  reliability   public.reliability not null default 'community',
  image_url     text,
  image_usable  boolean not null default false,
  image_note    text,
  dedupe_hash   text not null unique,
  status        public.finding_status not null default 'new',
  reviewed_by   uuid references auth.users(id) on delete set null,
  linked_article_id uuid references public.news_articles(id) on delete set null,
  linked_contest_id uuid references public.contests(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index radar_findings_status_idx on public.radar_findings (status, created_at desc);
create index radar_findings_run_idx    on public.radar_findings (run_id);

comment on table public.radar_findings is
  'Brouillons produits par le Radar. Strictement prives (staff) tant qu''ils ne sont pas publies : aucune publication automatique.';

create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text check (length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);

create trigger ai_conversations_set_updated_at before update on public.ai_conversations
  for each row execute function public.tg_set_updated_at();

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role            public.ai_role not null,
  content         text not null,
  sources         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);
create index ai_messages_conv_idx on public.ai_messages (conversation_id, created_at);

create table public.ai_usage (
  user_id    uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  messages   int not null default 0,
  primary key (user_id, usage_date)
);

create table public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null,
  path        text not null,
  url         text not null,
  kind        public.media_kind not null default 'image',
  folder      text not null default 'general',
  alt         text,
  credit      text,
  width       int,
  height      int,
  size_bytes  bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (bucket, path)
);
create index media_assets_folder_idx on public.media_assets (folder, created_at desc);

create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Reglages pilotes depuis l''administration (banniere, sections d''accueil, carte, Radar). is_public = lisible sans authentification.';

create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.tg_set_updated_at();

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  reason      text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_recent_idx on public.audit_log (created_at desc);

-- ================================= RLS ======================================
alter table public.contests         enable row level security;
alter table public.radar_runs       enable row level security;
alter table public.radar_findings   enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages      enable row level security;
alter table public.ai_usage         enable row level security;
alter table public.media_assets     enable row level security;
alter table public.app_settings     enable row level security;
alter table public.audit_log        enable row level security;

create policy "contests_read_published" on public.contests for select
  using (status = 'published');
create policy "contests_staff_all" on public.contests for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "radar_runs_staff" on public.radar_runs for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "radar_findings_staff" on public.radar_findings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "ai_conversations_own" on public.ai_conversations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "ai_messages_own" on public.ai_messages for select to authenticated
  using (exists (select 1 from public.ai_conversations c
                 where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy "ai_messages_insert_own" on public.ai_messages for insert to authenticated
  with check (exists (select 1 from public.ai_conversations c
                      where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy "ai_messages_delete_own" on public.ai_messages for delete to authenticated
  using (exists (select 1 from public.ai_conversations c
                 where c.id = conversation_id and c.user_id = (select auth.uid())));

create policy "ai_usage_select_own" on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ai_usage_staff" on public.ai_usage for select to authenticated
  using (public.is_staff());

create policy "media_assets_staff" on public.media_assets for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "app_settings_read_public" on public.app_settings for select
  using (is_public = true);
create policy "app_settings_staff_read" on public.app_settings for select to authenticated
  using (public.is_staff());
create policy "app_settings_admin_write" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "audit_log_admin_read" on public.audit_log for select to authenticated
  using (public.is_admin());

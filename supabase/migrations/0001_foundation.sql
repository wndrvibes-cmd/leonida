-- =============================================================================
-- LEONIDA — 0001 : fondations (identite, roles, premium, preferences)
-- =============================================================================
-- Principes de securite appliques dans toute la base :
--   1. Le role N'EST PAS une colonne de `profiles`. Il vit dans `user_roles`,
--      table que l'utilisateur ne peut jamais ecrire -> pas d'auto-promotion.
--   2. Le statut Premium vit dans `subscriptions`, ecrivable uniquement par
--      `service_role` (webhook Stripe) -> pas d'auto-attribution du Premium.
--   3. Les fonctions de controle sont SECURITY DEFINER avec `search_path = ''`
--      (protection contre le detournement de search_path) et sont donc les
--      seules a pouvoir lire ces tables sans declencher de recursion RLS.
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "citext"   with schema extensions;

-- ---------------------------------------------------------------- ENUMS -----
create type public.app_role as enum ('member', 'moderator', 'admin');

create type public.subscription_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid', 'paused'
);

-- -------------------------------------------------- TRIGGER : updated_at ----
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------- PROFILES -----
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      extensions.citext not null unique
                  check (length(username) between 3 and 24
                         and username ~ '^[a-zA-Z0-9_]+$'),
  display_name  text check (length(display_name) <= 48),
  bio           text check (length(bio) <= 400),
  avatar_url    text,
  banner_url    text,
  location      text check (length(location) <= 64),
  is_suspended  boolean not null default false,
  suspended_at  timestamptz,
  suspension_reason text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Profil public d''un membre. Ne contient aucun role ni statut premium : voir user_roles et subscriptions.';

create index profiles_username_idx   on public.profiles (username);
create index profiles_created_at_idx on public.profiles (created_at desc);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ----------------------------------------------------------- USER_ROLES -----
create table public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Roles applicatifs. AUCUNE politique RLS ne permet a un utilisateur d''y ecrire : seul un admin (ou service_role) le peut.';

create index user_roles_user_idx on public.user_roles (user_id);

-- --------------------------------------------------- FONCTIONS DE ROLE ------
-- SECURITY DEFINER : contourne la RLS, ce qui evite la recursion infinie
-- (une policy sur user_roles qui interrogerait user_roles via RLS bouclerait).
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Un moderateur n'a PAS les droits admin ; un admin a les droits de moderation.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_suspended()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_suspended from public.profiles where id = (select auth.uid())),
    false
  );
$$;

-- ---------------------------------------------------------- ABONNEMENTS -----
create table public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  status                 public.subscription_status not null,
  plan_code              text not null default 'leonida_plus',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.subscriptions is
  'Source de verite du statut LEONIDA+. Ecriture reservee a service_role (webhook Stripe). Aucune policy insert/update/delete pour les utilisateurs.';

create index subscriptions_status_idx on public.subscriptions (status);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.tg_set_updated_at();

-- Statut premium : actif uniquement si l'abonnement court encore.
create or replace function public.is_premium(_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = coalesce(_user_id, (select auth.uid()))
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- ------------------------------------------------------ PREFERENCES ---------
create table public.user_settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  locale               text not null default 'fr' check (locale in ('fr', 'en')),
  reduce_motion        boolean not null default false,
  intro_seen_at        timestamptz,
  show_intro           boolean not null default true,
  -- personnalisation du fond d'application
  background_url       text,
  background_position  text not null default 'center' check (length(background_position) <= 32),
  background_scale     numeric(4,2) not null default 1.00 check (background_scale between 1 and 3),
  background_dim       numeric(3,2) not null default 0.55 check (background_dim between 0 and 0.95),
  background_enabled   boolean not null default false,
  -- notifications
  notify_replies       boolean not null default true,
  notify_reactions     boolean not null default true,
  notify_moderation    boolean not null default true,
  notify_news          boolean not null default true,
  notify_contests      boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.tg_set_updated_at();

-- -------------------------------------- CREATION AUTOMATIQUE DU PROFIL ------
-- Genere un pseudo unique et sans collision a partir de l'email / metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_name text;
  final_name text;
  suffix int := 0;
begin
  base_name := lower(regexp_replace(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1),
      'joueur'
    ),
    '[^a-zA-Z0-9_]', '', 'g'
  ));

  if length(base_name) < 3 then
    base_name := 'joueur' || base_name;
  end if;
  base_name := left(base_name, 20);
  final_name := base_name;

  while exists (select 1 from public.profiles where username = final_name) loop
    suffix := suffix + 1;
    final_name := left(base_name, 20) || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_name,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  );

  insert into public.user_roles (user_id, role) values (new.id, 'member');
  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================= RLS ======================================
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_settings enable row level security;

-- PROFILES : lisibles par tous (profil public), modifiables par leur seul
-- proprietaire. La suspension n'est modifiable que par le staff.
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Un membre ne peut pas lever sa propre suspension ni se renommer en masse :
-- le trigger restaure les champs reserves au staff. Plus robuste qu'un
-- WITH CHECK qui relirait la meme table pendant l'UPDATE.
create or replace function public.tg_protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    new.is_suspended      := old.is_suspended;
    new.suspended_at      := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
  end if;
  new.id         := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.tg_protect_profile_fields();

create policy "profiles_staff_update"
  on public.profiles for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Pas de policy INSERT : le profil est cree par le trigger (security definer).
-- Pas de policy DELETE : la suppression passe par la suppression du compte auth.

-- USER_ROLES : chacun voit ses roles, les admins voient et gerent tout.
create policy "user_roles_select_own"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_roles_admin_select"
  on public.user_roles for select
  to authenticated
  using (public.is_admin());

create policy "user_roles_admin_insert"
  on public.user_roles for insert
  to authenticated
  with check (public.is_admin());

create policy "user_roles_admin_update"
  on public.user_roles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Un admin ne peut pas se retirer lui-meme son propre role admin
-- (evite de se verrouiller hors de l'administration par accident).
create policy "user_roles_admin_delete"
  on public.user_roles for delete
  to authenticated
  using (
    public.is_admin()
    and not (user_id = (select auth.uid()) and role = 'admin')
  );

-- SUBSCRIPTIONS : lecture de son propre abonnement, lecture totale pour admin.
-- AUCUNE policy d'ecriture -> seul service_role (Edge Function Stripe) ecrit.
create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "subscriptions_admin_select"
  on public.subscriptions for select
  to authenticated
  using (public.is_admin());

-- USER_SETTINGS : strictement prive.
create policy "user_settings_select_own"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

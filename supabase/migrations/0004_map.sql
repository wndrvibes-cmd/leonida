-- LEONIDA 0004 : carte interactive, marqueurs, contributions LEONIDA+

create type public.marker_status as enum ('draft','pending','approved','rejected');

-- Distinction explicite : on ne pretend jamais qu'une decouverte a ete testee
-- par LEONIDA si personne ne l'a reellement verifiee.
create type public.verification_level as enum (
  'unverified', 'author_tested', 'community_confirmed', 'staff_verified'
);

create table public.map_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  label      text not null,
  icon       text not null default 'pin',
  accent     text not null default 'surf',
  sort_order int not null default 0,
  is_active  boolean not null default true
);

create table public.map_markers (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(title) between 3 and 120),
  category_id  uuid references public.map_categories(id) on delete set null,
  description  text check (length(description) <= 4000),
  instructions text check (length(instructions) <= 4000),
  image_url    text,
  -- COORDONNEES RELATIVES a l'image d'origine (0..1). Jamais de pixels d'ecran.
  x numeric(9,6) not null check (x >= 0 and x <= 1),
  y numeric(9,6) not null check (y >= 0 and y <= 1),
  author_id       uuid references auth.users(id) on delete set null,
  is_official     boolean not null default false,
  status          public.marker_status not null default 'pending',
  verification    public.verification_level not null default 'unverified',
  author_tested   boolean not null default false,
  estimated_reward text check (length(estimated_reward) <= 120),
  rejection_reason text check (length(rejection_reason) <= 500),
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  favorite_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.map_markers.x is 'Coordonnee relative 0..1 sur la largeur de l''image d''origine.';
comment on column public.map_markers.y is 'Coordonnee relative 0..1 sur la hauteur de l''image d''origine.';

create index map_markers_public_idx   on public.map_markers (category_id) where status = 'approved';
create index map_markers_status_idx   on public.map_markers (status, created_at desc);
create index map_markers_author_idx   on public.map_markers (author_id, created_at desc);
create index map_markers_position_idx on public.map_markers (x, y) where status = 'approved';
create index map_markers_search_idx   on public.map_markers
  using gin (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'')));

create trigger map_markers_set_updated_at before update on public.map_markers
  for each row execute function public.tg_set_updated_at();

-- VERROU : un membre ne valide jamais sa propre contribution. Meme si une
-- policy etait mal ecrite plus tard, ce declencheur tient.
create or replace function public.tg_protect_marker_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_staff() then
      new.status       := 'pending';
      new.is_official  := false;
      new.reviewed_by  := null;
      new.reviewed_at  := null;
      new.rejection_reason := null;
      new.verification := case when new.author_tested then 'author_tested'::public.verification_level
                               else 'unverified'::public.verification_level end;
      new.author_id    := (select auth.uid());
    end if;
    return new;
  end if;

  new.created_at := old.created_at;
  if not public.is_staff() then
    new.author_id    := old.author_id;
    new.status       := old.status;
    new.is_official  := old.is_official;
    new.reviewed_by  := old.reviewed_by;
    new.reviewed_at  := old.reviewed_at;
    new.rejection_reason := old.rejection_reason;
    new.favorite_count   := old.favorite_count;
    new.verification := case
      when old.verification in ('community_confirmed','staff_verified') then old.verification
      when new.author_tested then 'author_tested'::public.verification_level
      else 'unverified'::public.verification_level end;
  else
    if new.status is distinct from old.status then
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end $$;

create trigger map_markers_protect before insert or update on public.map_markers
  for each row execute function public.tg_protect_marker_fields();

create or replace function public.tg_notify_marker_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status or new.author_id is null then return new; end if;

  if new.status = 'approved' then
    insert into public.notifications (user_id, type, title, body, target_type, target_id)
    values (new.author_id, 'marker_approved',
            'Votre decouverte est publiee',
            new.title || ' apparait desormais sur la carte de Leonida.',
            'marker', new.id);
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, target_type, target_id)
    values (new.author_id, 'marker_rejected',
            'Votre decouverte n''a pas ete retenue',
            coalesce(new.rejection_reason, 'Aucun motif precise.'),
            'marker', new.id);
  end if;
  return new;
end $$;

create trigger map_markers_notify after update on public.map_markers
  for each row execute function public.tg_notify_marker_review();

-- ================================= RLS ======================================
alter table public.map_categories enable row level security;
alter table public.map_markers    enable row level security;

create policy "map_categories_read" on public.map_categories for select
  using (is_active or public.is_staff());
create policy "map_categories_admin" on public.map_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "map_markers_read_approved" on public.map_markers for select
  using (status = 'approved');

create policy "map_markers_read_own" on public.map_markers for select to authenticated
  using ((select auth.uid()) = author_id or public.is_staff());

-- CONTROLE PREMIUM COTE SERVEUR : is_premium() lit `subscriptions`, table
-- qu'aucun utilisateur ne peut ecrire. Masquer le bouton cote client ne
-- suffirait pas.
create policy "map_markers_insert_premium" on public.map_markers for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and public.is_premium()
    and not public.is_suspended()
  );

create policy "map_markers_update_own_pending" on public.map_markers for update to authenticated
  using (
    (select auth.uid()) = author_id
    and status in ('draft','pending','rejected')
    and not public.is_suspended()
  )
  with check ((select auth.uid()) = author_id);

create policy "map_markers_delete_own" on public.map_markers for delete to authenticated
  using ((select auth.uid()) = author_id and status in ('draft','pending','rejected'));

create policy "map_markers_staff_all" on public.map_markers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

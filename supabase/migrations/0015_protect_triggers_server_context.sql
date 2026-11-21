-- LEONIDA 0015 : les declencheurs de protection bloquaient aussi le SERVEUR.
--
-- Les quatre declencheurs `tg_protect_*` restaurent les champs reserves au
-- staff quand `is_staff()` est faux. Or en contexte serveur (service_role
-- dans une Edge Function, webhook, script d'administration), `auth.uid()`
-- vaut NULL : `is_staff()` renvoyait faux et le declencheur ANNULAIT
-- silencieusement l'ecriture. Une suspension de compte lancee cote serveur
-- ne prenait donc jamais effet, sans la moindre erreur.
--
-- Meme nature que le defaut corrige en 0011 pour `is_premium`.
--
-- POURQUOI C'EST SUR : les policies d'UPDATE de ces tables sont toutes
-- `TO authenticated`. Un appelant dont `auth.uid()` est NULL ne peut donc PAS
-- etre un visiteur anonyme — c'est necessairement service_role ou postgres.

create or replace function public.is_trusted_actor()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is null
      or exists (
           select 1 from public.user_roles
           where user_id = (select auth.uid()) and role in ('admin','moderator')
         );
$$;

comment on function public.is_trusted_actor() is
  'Vrai pour le staff ET pour le code serveur. A n''utiliser que dans les declencheurs de protection : les policies RLS doivent continuer a passer par is_staff().';

revoke all on function public.is_trusted_actor() from public, anon, authenticated;

create or replace function public.tg_protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_trusted_actor() then
    new.is_suspended      := old.is_suspended;
    new.suspended_at      := old.suspended_at;
    new.suspension_reason := old.suspension_reason;
  end if;
  new.id         := old.id;
  new.created_at := old.created_at;
  return new;
end $$;

create or replace function public.tg_protect_post_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.author_id  := old.author_id;
  new.created_at := old.created_at;
  if not public.is_trusted_actor()
     and coalesce(current_setting('leonida.counter_update', true), '0') <> '1' then
    new.is_pinned      := old.is_pinned;
    new.is_hidden      := old.is_hidden;
    new.hidden_reason  := old.hidden_reason;
    new.comment_count  := old.comment_count;
    new.reaction_count := old.reaction_count;
  end if;
  return new;
end $$;

create or replace function public.tg_protect_comment_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.author_id   := old.author_id;
  new.target_type := old.target_type;
  new.target_id   := old.target_id;
  new.parent_id   := old.parent_id;
  new.created_at  := old.created_at;
  if not public.is_trusted_actor() then
    new.is_hidden := old.is_hidden;
  end if;
  return new;
end $$;

-- Le verrou de fond reste identique : un MEMBRE ne peut toujours ni valider
-- sa contribution, ni la declarer officielle, ni s'auto-certifier.
create or replace function public.tg_protect_marker_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_trusted_actor() then
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
  if not public.is_trusted_actor() then
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
      new.reviewed_by := coalesce((select auth.uid()), new.reviewed_by);
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end $$;

revoke all on function public.tg_protect_profile_fields() from public, anon, authenticated;
revoke all on function public.tg_protect_post_fields()    from public, anon, authenticated;
revoke all on function public.tg_protect_comment_fields() from public, anon, authenticated;
revoke all on function public.tg_protect_marker_fields()  from public, anon, authenticated;

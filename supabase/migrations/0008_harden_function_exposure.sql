-- LEONIDA 0008 : durcissement suite a l'audit des advisors Supabase
--
-- Probleme 1 : tg_set_updated_at avait un search_path mutable.
-- Probleme 2 : les 13 fonctions SECURITY DEFINER etaient appelables par
--              n'importe qui via /rest/v1/rpc/<nom>. Les fonctions de
--              declencheur n'ont aucune raison d'etre exposees a l'API REST.
--
-- Rappel PostgreSQL : une fonction de declencheur est executee par le moteur
-- de declencheurs et ne requiert PAS le privilege EXECUTE de l'appelant.

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.tg_set_updated_at()          from public, anon, authenticated;
revoke all on function public.tg_protect_profile_fields()  from public, anon, authenticated;
revoke all on function public.tg_protect_post_fields()     from public, anon, authenticated;
revoke all on function public.tg_protect_comment_fields()  from public, anon, authenticated;
revoke all on function public.tg_protect_marker_fields()   from public, anon, authenticated;
revoke all on function public.tg_sync_post_counters()      from public, anon, authenticated;
revoke all on function public.tg_notify_on_comment()       from public, anon, authenticated;
revoke all on function public.tg_notify_marker_review()    from public, anon, authenticated;
revoke all on function public.handle_new_user()            from public, anon, authenticated;

-- `authenticated` doit conserver EXECUTE : les policies RLS les evaluent dans
-- le contexte du role appelant. `anon` n'en a aucun besoin.
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_admin()      from public, anon;
revoke all on function public.is_staff()      from public, anon;
revoke all on function public.is_suspended()  from public, anon;
revoke all on function public.is_premium(uuid) from public, anon;
revoke all on function public.storage_owns_path(text) from public, anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin()       to authenticated;
grant execute on function public.is_staff()       to authenticated;
grant execute on function public.is_suspended()   to authenticated;
grant execute on function public.is_premium(uuid) to authenticated;
grant execute on function public.storage_owns_path(text) to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon;

-- LEONIDA 0009 : empeche le sondage des roles et des statuts d'autrui.
--
-- `is_admin/is_staff/is_suspended` ne parlent que de l'appelant : les laisser
-- executables par `authenticated` est necessaire et sans risque.
-- En revanche `has_role(uuid, role)` et `is_premium(uuid)` acceptaient un
-- identifiant arbitraire : un membre pouvait enumerer les administrateurs ou
-- la liste des abonnes.

-- has_role n'est utilisee par AUCUNE policy : on la reserve au serveur.
revoke all on function public.has_role(uuid, public.app_role)
  from public, anon, authenticated;

-- is_premium conserve sa signature (des policies en dependent) mais ne repond
-- plus que sur l'appelant, sauf si celui-ci est membre du staff.
create or replace function public.is_premium(_user_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (
      case
        when _user_id is null                      then (select auth.uid())
        when _user_id = (select auth.uid())        then _user_id
        when exists (select 1 from public.user_roles ur
                     where ur.user_id = (select auth.uid())
                       and ur.role in ('admin','moderator'))
                                                   then _user_id
        else '00000000-0000-0000-0000-000000000000'::uuid
      end
    )
    and s.status in ('active', 'trialing')
    and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

revoke all on function public.is_premium(uuid) from public, anon;
grant execute on function public.is_premium(uuid) to authenticated;

comment on function public.is_premium(uuid) is
  'Statut LEONIDA+. Un membre ne peut interroger que son propre statut ; seul le staff peut interroger celui d''un autre compte.';

-- LEONIDA 0011 : correction d'un defaut introduit par la migration 0009.
--
-- 0009 limitait is_premium(uuid) a l'appelant lui-meme (sauf staff) pour
-- empecher un membre d'enumerer les abonnes. Effet de bord non voulu : en
-- contexte SERVEUR (service_role dans une Edge Function, ou le webhook
-- Stripe), auth.uid() vaut NULL -> la fonction renvoyait toujours false,
-- rendant impossible toute verification premium cote serveur.
--
-- Pourquoi la branche ajoutee est sure : `anon` n'a PAS le droit d'executer
-- cette fonction (revoque en 0008). Un appelant dont auth.uid() est NULL est
-- donc necessairement service_role ou postgres, c'est-a-dire du code serveur
-- de confiance -- jamais un visiteur.

create or replace function public.is_premium(_user_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (
      case
        when _user_id is null then (select auth.uid())
        when _user_id = (select auth.uid()) then _user_id
        when (select auth.uid()) is null then _user_id
        when exists (select 1 from public.user_roles ur
                     where ur.user_id = (select auth.uid())
                       and ur.role in ('admin','moderator')) then _user_id
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
  'Statut LEONIDA+. Un membre ne peut interroger que son propre statut ; le staff et le code serveur (service_role) peuvent interroger n''importe quel compte. anon n''a pas le droit d''executer cette fonction.';

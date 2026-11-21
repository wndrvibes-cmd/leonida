-- LEONIDA 0014 : accentuation des textes de notification produits par les
-- declencheurs.
--
-- Les passes d'accents precedentes couvraient le code TypeScript (21/11) puis
-- les libelles stockes en base (migration 0012). Restait une troisieme source
-- oubliee : les chaines ecrites EN DUR DANS LES DECLENCHEURS PL/pgSQL, qui
-- produisent le titre et le corps des notifications. Elles s'affichaient sans
-- accents dans le centre de notifications.
--
-- Seul le texte change ; la logique des declencheurs est identique.

create or replace function public.tg_notify_marker_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = old.status or new.author_id is null then return new; end if;

  if new.status = 'approved' then
    insert into public.notifications (user_id, type, title, body, target_type, target_id)
    values (new.author_id, 'marker_approved',
            'Votre découverte est publiée',
            new.title || ' apparaît désormais sur la carte de Leonida.',
            'marker', new.id);
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, target_type, target_id)
    values (new.author_id, 'marker_rejected',
            'Votre découverte n''a pas été retenue',
            coalesce(new.rejection_reason, 'Aucun motif précisé.'),
            'marker', new.id);
  end if;
  return new;
end $$;

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
          case when kind = 'comment_reply' then 'Nouvelle réponse à votre commentaire'
               else 'Nouveau commentaire sur votre publication' end,
          left(new.body, 140), new.author_id, new.target_type, new.target_id);
  return new;
end $$;

revoke all on function public.tg_notify_marker_review() from public, anon, authenticated;
revoke all on function public.tg_notify_on_comment()    from public, anon, authenticated;

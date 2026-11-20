-- LEONIDA 0006 : buckets de stockage et politiques d'acces
-- Limites de taille et types MIME imposes AU NIVEAU DU BUCKET : la contrainte
-- est appliquee par le serveur de stockage, pas par le navigateur.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',       'avatars',       true,  2 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('posts',         'posts',         true,  8 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('moments',       'moments',       true, 12 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('contributions', 'contributions', true,  8 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('backgrounds',   'backgrounds',   true,  8 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('news',          'news',          true, 10 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('map',           'map',           true, 25 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('contests',      'contests',      true, 10 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('banners',       'banners',       true, 12 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif']),
  ('media',         'media',         true, 15 * 1024 * 1024,  array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- Convention de nommage imposee : <bucket>/<user_id>/<fichier>
create or replace function public.storage_owns_path(_name text)
returns boolean language sql stable set search_path = '' as $$
  select (storage.foldername(_name))[1] = (select auth.uid())::text;
$$;

create policy "leonida_public_read" on storage.objects for select
  using (bucket_id in ('avatars','posts','moments','contributions','backgrounds',
                       'news','map','contests','banners','media'));

create policy "leonida_member_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars','posts','moments','contributions','backgrounds')
    and public.storage_owns_path(name)
    and not public.is_suspended()
  );

create policy "leonida_member_update" on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars','posts','moments','contributions','backgrounds')
    and public.storage_owns_path(name)
  )
  with check (
    bucket_id in ('avatars','posts','moments','contributions','backgrounds')
    and public.storage_owns_path(name)
  );

create policy "leonida_member_delete" on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars','posts','moments','contributions','backgrounds')
    and public.storage_owns_path(name)
  );

create policy "leonida_staff_write" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('news','map','contests','banners','media')
    and public.is_staff()
  );

create policy "leonida_staff_update" on storage.objects for update to authenticated
  using (bucket_id in ('news','map','contests','banners','media') and public.is_staff())
  with check (bucket_id in ('news','map','contests','banners','media') and public.is_staff());

create policy "leonida_staff_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('news','map','contests','banners','media') and public.is_staff());

create policy "leonida_staff_moderate_member_files" on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars','posts','moments','contributions','backgrounds')
    and public.is_staff()
  );

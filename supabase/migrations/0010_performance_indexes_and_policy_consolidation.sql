-- LEONIDA 0010 : corrections issues de l'advisor PERFORMANCE
--
-- A) 12 cles etrangeres sans index couvrant.
-- B) Policies permissives redondantes : PostgreSQL evalue CHAQUE policy
--    permissive. On les fusionne par role et par action.
--
-- SUBTILITE : `anon` n'a plus le droit d'executer is_staff() (migration 0008).
-- Une policy unique couvrant anon ET authenticated qui appellerait is_staff()
-- echouerait pour les visiteurs. On garde donc DEUX policies par action :
-- une simple pour anon, une complete pour authenticated.

-- ======================= A) INDEX SUR LES CLES ETRANGERES ==================
create index if not exists app_settings_updated_by_idx   on public.app_settings (updated_by);
create index if not exists audit_log_actor_idx           on public.audit_log (actor_id);
create index if not exists contests_created_by_idx       on public.contests (created_by);
create index if not exists map_markers_reviewed_by_idx   on public.map_markers (reviewed_by);
create index if not exists media_assets_uploaded_by_idx  on public.media_assets (uploaded_by);
create index if not exists news_articles_author_idx      on public.news_articles (author_id);
create index if not exists notifications_actor_idx       on public.notifications (actor_id);
create index if not exists radar_findings_article_idx    on public.radar_findings (linked_article_id);
create index if not exists radar_findings_contest_idx    on public.radar_findings (linked_contest_id);
create index if not exists radar_findings_reviewer_idx   on public.radar_findings (reviewed_by);
create index if not exists reports_resolved_by_idx       on public.reports (resolved_by);
create index if not exists user_roles_granted_by_idx     on public.user_roles (granted_by);

-- ============================ B) POSTS =====================================
drop policy if exists "posts_read_visible" on public.posts;
drop policy if exists "posts_read_own"     on public.posts;
drop policy if exists "posts_staff_all"    on public.posts;
drop policy if exists "posts_insert_own"   on public.posts;
drop policy if exists "posts_update_own"   on public.posts;
drop policy if exists "posts_delete_own"   on public.posts;

create policy "posts_select_anon" on public.posts for select to anon
  using (is_hidden = false);
create policy "posts_select_auth" on public.posts for select to authenticated
  using (is_hidden = false or author_id = (select auth.uid()) or public.is_staff());
create policy "posts_insert" on public.posts for insert to authenticated
  with check ((author_id = (select auth.uid()) and not public.is_suspended()) or public.is_staff());
create policy "posts_update" on public.posts for update to authenticated
  using ((author_id = (select auth.uid()) and not public.is_suspended()) or public.is_staff())
  with check (author_id = (select auth.uid()) or public.is_staff());
create policy "posts_delete" on public.posts for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_staff());

-- ============================ C) MAP_MARKERS ===============================
drop policy if exists "map_markers_read_approved"      on public.map_markers;
drop policy if exists "map_markers_read_own"           on public.map_markers;
drop policy if exists "map_markers_staff_all"          on public.map_markers;
drop policy if exists "map_markers_insert_premium"     on public.map_markers;
drop policy if exists "map_markers_update_own_pending" on public.map_markers;
drop policy if exists "map_markers_delete_own"         on public.map_markers;

create policy "map_markers_select_anon" on public.map_markers for select to anon
  using (status = 'approved');
create policy "map_markers_select_auth" on public.map_markers for select to authenticated
  using (status = 'approved' or author_id = (select auth.uid()) or public.is_staff());

-- CONTROLE PREMIUM COTE SERVEUR : un membre non abonne ne peut pas inserer.
-- tg_protect_marker_fields force en plus le statut 'pending'.
create policy "map_markers_insert" on public.map_markers for insert to authenticated
  with check (
    (author_id = (select auth.uid()) and public.is_premium() and not public.is_suspended())
    or public.is_staff()
  );
create policy "map_markers_update" on public.map_markers for update to authenticated
  using (
    (author_id = (select auth.uid()) and status in ('draft','pending','rejected')
     and not public.is_suspended())
    or public.is_staff()
  )
  with check (author_id = (select auth.uid()) or public.is_staff());
create policy "map_markers_delete" on public.map_markers for delete to authenticated
  using (
    (author_id = (select auth.uid()) and status in ('draft','pending','rejected'))
    or public.is_staff()
  );

-- ============================ D) COMMENTS ==================================
drop policy if exists "comments_read"           on public.comments;
drop policy if exists "comments_read_own_staff" on public.comments;
drop policy if exists "comments_staff_all"      on public.comments;
drop policy if exists "comments_insert_own"     on public.comments;
drop policy if exists "comments_update_own"     on public.comments;
drop policy if exists "comments_delete_own"     on public.comments;

create policy "comments_select_anon" on public.comments for select to anon
  using (is_hidden = false);
create policy "comments_select_auth" on public.comments for select to authenticated
  using (is_hidden = false or author_id = (select auth.uid()) or public.is_staff());
create policy "comments_insert" on public.comments for insert to authenticated
  with check ((author_id = (select auth.uid()) and not public.is_suspended()) or public.is_staff());
create policy "comments_update" on public.comments for update to authenticated
  using ((author_id = (select auth.uid()) and not public.is_suspended()) or public.is_staff())
  with check (author_id = (select auth.uid()) or public.is_staff());
create policy "comments_delete" on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_staff());

-- ============================ E) POST_MEDIA ================================
drop policy if exists "post_media_read"      on public.post_media;
drop policy if exists "post_media_write_own" on public.post_media;
drop policy if exists "post_media_staff"     on public.post_media;

create policy "post_media_select_anon" on public.post_media for select to anon
  using (exists (select 1 from public.posts p where p.id = post_id and p.is_hidden = false));
create policy "post_media_select_auth" on public.post_media for select to authenticated
  using (
    exists (select 1 from public.posts p
            where p.id = post_id
              and (p.is_hidden = false or p.author_id = (select auth.uid())))
    or public.is_staff()
  );
create policy "post_media_insert" on public.post_media for insert to authenticated
  with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or public.is_staff()
  );
create policy "post_media_update" on public.post_media for update to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or public.is_staff()
  )
  with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or public.is_staff()
  );
create policy "post_media_delete" on public.post_media for delete to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
    or public.is_staff()
  );

-- ============================ F) NEWS_ARTICLES =============================
drop policy if exists "news_read_published"  on public.news_articles;
drop policy if exists "news_staff_read_all"  on public.news_articles;
drop policy if exists "news_staff_write"     on public.news_articles;

create policy "news_select_anon" on public.news_articles for select to anon
  using (status = 'published' and (published_at is null or published_at <= now()));
create policy "news_select_auth" on public.news_articles for select to authenticated
  using ((status = 'published' and (published_at is null or published_at <= now()))
         or public.is_staff());
create policy "news_write_staff" on public.news_articles for insert to authenticated
  with check (public.is_staff());
create policy "news_update_staff" on public.news_articles for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "news_delete_staff" on public.news_articles for delete to authenticated
  using (public.is_staff());

-- ============================ G) FUSIONS SIMPLES ===========================
drop policy if exists "subscriptions_select_own"   on public.subscriptions;
drop policy if exists "subscriptions_admin_select" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "user_roles_select_own"   on public.user_roles;
drop policy if exists "user_roles_admin_select" on public.user_roles;
create policy "user_roles_select" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_staff_all"  on public.reports;
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_select" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_staff());
create policy "reports_insert" on public.reports for insert to authenticated
  with check ((reporter_id = (select auth.uid()) and not public.is_suspended()) or public.is_staff());
create policy "reports_update_staff" on public.reports for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "reports_delete_staff" on public.reports for delete to authenticated
  using (public.is_staff());

drop policy if exists "ai_usage_select_own" on public.ai_usage;
drop policy if exists "ai_usage_staff"      on public.ai_usage;
create policy "ai_usage_select" on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists "contests_read_published" on public.contests;
drop policy if exists "contests_staff_all"      on public.contests;
create policy "contests_select_anon" on public.contests for select to anon
  using (status = 'published');
create policy "contests_select_auth" on public.contests for select to authenticated
  using (status = 'published' or public.is_staff());
create policy "contests_insert_staff" on public.contests for insert to authenticated
  with check (public.is_staff());
create policy "contests_update_staff" on public.contests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "contests_delete_staff" on public.contests for delete to authenticated
  using (public.is_staff());

-- LEONIDA 0007 : donnees de REFERENCE uniquement (taxonomies + reglages).
-- Aucune actualite, aucune publication, aucune statistique inventee.

insert into public.news_categories (slug, label, accent, sort_order) values
  ('officiel',    'Actualites officielles', 'sunset', 10),
  ('rockstar',    'Rockstar Games',         'sunset', 20),
  ('gameplay',    'Gameplay',               'palm',   30),
  ('missions',    'Missions',               'palm',   40),
  ('vehicules',   'Vehicules',              'surf',   50),
  ('personnages', 'Personnages',            'surf',   60),
  ('carte',       'Carte',                  'surf',   70),
  ('decouvertes', 'Decouvertes',            'sand',   80),
  ('mises-a-jour','Mises a jour',           'palm',   90),
  ('communaute',  'Communaute',             'sand',  100),
  ('autres',      'Autres',                 'sand',  110)
on conflict (slug) do nothing;

insert into public.map_categories (slug, label, icon, accent, sort_order) values
  ('secrets',     'Secrets et easter eggs', 'sparkle',  'sunset', 10),
  ('vehicules',   'Vehicules rares',        'car',      'surf',   20),
  ('missions',    'Missions speciales',     'target',   'palm',   30),
  ('rentable',    'Activites rentables',    'coins',    'sand',   40),
  ('recompenses', 'Recompenses importantes','trophy',   'sunset', 50),
  ('collectibles','Collectibles',           'gem',      'surf',   60),
  ('lieux',       'Lieux caches',           'compass',  'palm',   70),
  ('activites',   'Activites',              'flag',     'sand',   80),
  ('autres',      'Autres decouvertes',     'pin',      'surf',   90)
on conflict (slug) do nothing;

insert into public.app_settings (key, value, is_public) values

('app.identity', jsonb_build_object(
   'name', 'LEONIDA',
   'tagline', 'La communaute GTA VI',
   'logo_url', null
 ), true),

('home.hero', jsonb_build_object(
   'enabled', true,
   'title', 'Bienvenue dans Leonida',
   'subtitle', 'Actualites, decouvertes et carte communautaire de GTA VI.',
   'image_url', null,
   'cta_label', 'Explorer la carte',
   'cta_link', '/carte',
   'align', 'left',
   'starts_at', null,
   'ends_at', null
 ), true),

('home.sections', jsonb_build_array(
   jsonb_build_object('key','news',       'label','Actualites recentes',   'enabled',true,  'order',10),
   jsonb_build_object('key','discoveries','label','Dernieres decouvertes', 'enabled',true,  'order',20),
   jsonb_build_object('key','community',  'label','La communaute',         'enabled',true,  'order',30),
   jsonb_build_object('key','moments',    'label','Moments populaires',    'enabled',true,  'order',40),
   jsonb_build_object('key','map',        'label','Explorer la carte',     'enabled',true,  'order',50),
   jsonb_build_object('key','contests',   'label','Concours et cadeaux',   'enabled',true,  'order',60),
   jsonb_build_object('key','ai',         'label','LEONIDA AI',            'enabled',true,  'order',70),
   jsonb_build_object('key','premium',    'label','LEONIDA+',              'enabled',true,  'order',80)
 ), true),

-- L'image de la carte est fournie par l'administrateur. Tant qu'aucune image
-- n'est televersee, l'interface affiche un etat vide explicite.
('map.config', jsonb_build_object(
   'image_url', null,
   'natural_width', null,
   'natural_height', null,
   'min_zoom', 1,
   'max_zoom', 8,
   'disclaimer', 'Carte communautaire. L''origine de ce visuel n''est pas officiellement confirmee par Rockstar Games.'
 ), true),

-- Radar desactive par defaut : aucune recherche ne tourne tant qu'un
-- fournisseur n'est pas configure et active explicitement.
('radar.config', jsonb_build_object(
   'enabled', false,
   'interval_hours', 10,
   'provider', null,
   'auto_publish', false,
   'max_items_per_run', 12,
   'note', 'Aucune publication automatique : le Radar ne produit que des brouillons.'
 ), false),

-- LEONIDA+ : tarif prepare, aucun paiement reel active.
('premium.config', jsonb_build_object(
   'price_eur', 5.99,
   'currency', 'EUR',
   'interval', 'month',
   'stripe_mode', 'test',
   'stripe_enabled', false,
   'benefits', jsonb_build_array(
     'Proposer vos decouvertes sur la carte de Leonida',
     'Badge LEONIDA+ sur votre profil et vos publications',
     'Personnalisation avancee du profil',
     'Quota etendu pour LEONIDA AI',
     'Acces anticipe aux nouvelles fonctionnalites'
   )
 ), true),

('ai.config', jsonb_build_object(
   'enabled', false,
   'provider', null,
   'daily_messages_free', 10,
   'daily_messages_premium', 60,
   'note', 'Desactive tant qu''aucune cle fournisseur n''est configuree cote serveur.'
 ), true),

('moderation.config', jsonb_build_object(
   'require_approval_for_markers', true,
   'auto_hide_reported_threshold', 5
 ), false)

on conflict (key) do nothing;

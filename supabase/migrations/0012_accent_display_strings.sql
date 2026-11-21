-- LEONIDA 0012 : accentuation des TEXTES AFFICHES stockes en base.
--
-- La passe d'accents du 21/11 ne couvrait que le code source. Les libelles
-- venant de `app_settings`, `news_categories` et `map_categories` etaient
-- restes sans accents et s'affichaient tels quels dans l'interface
-- (« Actualites recentes » sur l'accueil, par exemple).
--
-- Regle : on ne touche QUE les valeurs affichees. Les `slug`, les cles JSON
-- et les cles de section restent en ASCII — elles servent d'identifiants.

update public.news_categories set label = 'Actualités officielles' where slug = 'officiel';
update public.news_categories set label = 'Véhicules'              where slug = 'vehicules';
update public.news_categories set label = 'Découvertes'            where slug = 'decouvertes';
update public.news_categories set label = 'Mises à jour'           where slug = 'mises-a-jour';
update public.news_categories set label = 'Communauté'             where slug = 'communaute';

update public.map_categories set label = 'Véhicules rares'         where slug = 'vehicules';
update public.map_categories set label = 'Missions spéciales'      where slug = 'missions';
update public.map_categories set label = 'Activités rentables'     where slug = 'rentable';
update public.map_categories set label = 'Récompenses importantes' where slug = 'recompenses';
update public.map_categories set label = 'Lieux cachés'            where slug = 'lieux';
update public.map_categories set label = 'Activités'               where slug = 'activites';
update public.map_categories set label = 'Autres découvertes'      where slug = 'autres';

update public.app_settings
   set value = jsonb_set(value, '{tagline}', '"La communauté GTA VI"')
 where key = 'app.identity';

update public.app_settings
   set value = jsonb_set(value, '{subtitle}',
         '"Actualités, découvertes et carte communautaire de GTA VI."')
 where key = 'home.hero';

-- Les `key` de section (news, discoveries...) restent en ASCII : seuls les
-- `label` affiches sont accentues.
update public.app_settings
   set value = '[
     {"key":"news",        "label":"Actualités récentes",   "order":10, "enabled":true},
     {"key":"discoveries", "label":"Dernières découvertes", "order":20, "enabled":true},
     {"key":"community",   "label":"La communauté",         "order":30, "enabled":true},
     {"key":"moments",     "label":"Moments populaires",    "order":40, "enabled":true},
     {"key":"map",         "label":"Explorer la carte",     "order":50, "enabled":true},
     {"key":"contests",    "label":"Concours et cadeaux",   "order":60, "enabled":true},
     {"key":"ai",          "label":"LEONIDA AI",            "order":70, "enabled":true},
     {"key":"premium",     "label":"LEONIDA+",              "order":80, "enabled":true}
   ]'::jsonb
 where key = 'home.sections';

update public.app_settings
   set value = jsonb_set(value, '{disclaimer}',
         '"Carte communautaire. L''origine de ce visuel n''est pas officiellement confirmée par Rockstar Games."')
 where key = 'map.config';

update public.app_settings
   set value = jsonb_set(value, '{note}',
         '"Désactivé tant qu''aucune clé fournisseur n''est configurée côté serveur."')
 where key = 'ai.config';

update public.app_settings
   set value = jsonb_set(value, '{benefits}', '[
         "Proposer vos découvertes sur la carte de Leonida",
         "Badge LEONIDA+ sur votre profil et vos publications",
         "Personnalisation avancée du profil",
         "Quota étendu pour LEONIDA AI",
         "Accès anticipé aux nouvelles fonctionnalités"
       ]'::jsonb)
 where key = 'premium.config';

update public.app_settings
   set value = jsonb_set(value, '{note}',
         '"Aucune publication automatique : le Radar ne produit que des brouillons."')
 where key = 'radar.config';

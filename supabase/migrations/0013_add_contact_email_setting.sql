-- LEONIDA 0013 : adresse de contact de l'administration.
--
-- L'ecran « Supprimer mon compte » renvoyait vers une adresse ecrite en dur
-- dans le code (contact@leonida.app) qui n'existe pas. Une adresse plausible
-- mais fausse est pire qu'une absence d'adresse : le membre ecrit dans le
-- vide. Elle devient donc un reglage, nul par defaut, et l'interface adapte
-- son texte tant qu'il n'est pas renseigne.

update public.app_settings
   set value = value || jsonb_build_object('contact_email', null)
 where key = 'app.identity';

# LEONIDA — suivi de projet

Document de reprise. Mis a jour a chaque etape importante.
**Derniere mise a jour : 21 novembre 2026** — fin de l'audit, avant refonte.

---

## 1. Ou en est le projet

| | |
|---|---|
| Depot | [wndrvibes-cmd/leonida](https://github.com/wndrvibes-cmd/leonida) |
| Supabase | projet `pwnusnklfpprrtgnijcy` (eu-central-1) — **ne pas confondre** avec `ihtgwqzqvjxrhuxhnkwd`, qui heberge CREWUP et ne doit pas etre touche |
| Compilation | `tsc --noEmit` → **0 erreur** (verifie le 21/11/2026) |
| Serveur de dev | fonctionnel sur `http://localhost:5173` |
| Fichiers source | ~250 dans `src/` |

### Environnement — limitation importante

**Node n'est pas installe sur la machine.** Le serveur de dev tourne grace au
Node embarque dans `ChatGPT.app`, avec deux contournements :

- plusieurs paquets npm avaient ete tronques par une installation interrompue
  (esbuild faisait 1,3 Mo au lieu de 9,8) — l'arbre a ete refait ;
- `rollup` est remplace par `@rollup/wasm-node` car ce Node tourne en
  *hardened runtime* et refuse de charger tout module natif tiers.

**Consequence : `npm run build` ne fonctionne pas.** Seul le mode dev marche.
Correctif definitif : installer Node LTS depuis nodejs.org (.pkg macOS),
puis `rm -rf node_modules && npm install`.

---

## 2. Audit du 21 novembre 2026

### Ce qui est sain et doit etre conserve

**La base de donnees.** 11 migrations appliquees et reellement testees a
l'attaque (comptes de test, tentatives d'escalade). Toutes bloquees :
auto-promotion admin, auto-attribution LEONIDA+, contribution carte sans
abonnement, auto-validation d'une contribution, modification du contenu
d'autrui, gonflage de compteurs, fausses notifications, lecture des brouillons
du Radar, ecriture d'un reglage admin. Les 25 tables publiques ont la RLS
active et au moins une policy. Advisors securite : 27 alertes → 5, les 5
restantes etant les verificateurs de role, necessairement executables par
`authenticated` puisque les policies RLS les evaluent.

**Le design system.** `src/styles/tokens.css` + CSS Modules partout.
**0 couleur en dur** sur l'ensemble des fichiers `.module.css` : la discipline
a tenu. C'est la fondation de la refonte visuelle, elle n'est pas a refaire.

**Qualite du code.** 0 `any`, 0 `@ts-ignore`, 0 `TODO` oublie, 0 bouton mort
(aucun `onClick={() => {}}`). 21 primitives d'interface, 15 services, 14 hooks.

**Modules termines** : socle UI, navigation, authentification (4 ecrans),
engagement partage, carte, accueil, actualites, communaute.

### Ce qui doit etre corrige

| Probleme | Ampleur | Gravite |
|---|---|---|
| **Accents francais manquants** dans les textes d'interface | 323 occurrences, 65 fichiers | elevee — tres visible |
| Composants homonymes `NewsCard` et `PostCard` (version compacte accueil / version complete liste) | 4 fichiers | moyenne — piege de maintenance |
| Dossiers vides laissses par les modules non construits | 8 | faible |
| `LEONIDA_PROGRESS.md` inexistant | — | corrige par ce fichier |

L'origine des accents manquants est identifiee : les consignes de construction
avaient ete redigees sans accents pour eviter des problemes d'encodage, et ce
style s'est propage aux textes visibles. La correction doit etre ciblee : seuls
les textes d'interface sont concernes, **jamais** les identifiants, chemins de
route, slugs ou noms de classes, qui doivent rester en ASCII.

### Ce qui n'existe pas encore

- **Espace administrateur** : quasi inexistant (1 fichier dans `src/pages/admin/`).
- **Espace membre** : profil et notifications ecrits, parametres encore en attente.
- **Pages en fichier d'attente** : `AiPage`, `ContestsPage`, `ContestPage`,
  `MomentsPage`, `PremiumPage`, `SearchPage`, `SettingsPage`, `AdminRoutes`.
- **Decouvertes** : pas de section dediee (les donnees existent dans `map_markers`).
- **Edge Functions** : dossier vide — Stripe, Radar et LEONIDA AI non ecrits.
- **Documentation** : seul le README existe.

### Contraintes a assumer, pas a contourner

**Les images GTA VI.** Je n'ai aucune image de GTA VI dont les droits
permettent l'integration, et je ne peux pas en fabriquer : une image generee
qui pretendrait montrer le jeu serait un mensonge. La seule voie honnete est
que l'administrateur televerse ses propres visuels — c'est precisement ce que
la mediatheque et les buckets Storage permettent. En attendant, l'interface
utilise des etats visuels temporaires (degrades, compositions typographiques)
qui ne pretendent jamais representer le jeu.

**Le fond de carte.** `map.config.image_url` est nul : la page carte affiche un
etat d'attente explicite. Aucune carte de substitution n'est dessinee.

**Stripe, Radar, LEONIDA AI.** Desactives par reglage (`stripe_enabled`,
`radar.config.enabled`, `ai.config.enabled` a `false`). Les interfaces le
disent explicitement et ne simulent aucune reponse.

---

## 3. Plan de refonte

Travail sequentiel, verifie et commite a chaque etape. Pas de vagues d'agents.

| # | Etape | Etat |
|---|---|---|
| 0 | Audit et correction de la compilation | **termine** |
| 1 | Hygiene : accents (**fait**), fusion des composants homonymes, dossiers vides (**fait**) | partiel |
| 2 | Direction artistique : jetons d'elevation, scene d'accueil, profondeur des sections | **termine** |
| 3 | Navigation : transitions de page, indicateur actif anime | **termine** |
| 4 | Espace membre complet (profil, parametres, favoris, notifications) | **termine** |
| 5 | Espace administrateur | a faire |
| 6 | Moments et Decouvertes | a faire |
| 7 | Cadeaux, LEONIDA+, LEONIDA AI, recherche | a faire |
| 8 | Edge Functions (Stripe test, Radar, IA) | a faire |
| 9 | Verification finale : responsive, permissions, performances | a faire |

### Etape 1 — ce qui a ete fait le 21/11

**Accents : ~470 lignes corrigees dans ~80 fichiers.** Approche en 5 passes
successives, de la plus sure a la plus large :
1. texte JSX sur une ligne ;
2. chaines contenant une espace (une chaine avec espace n'est jamais une route,
   un slug ni une classe CSS — c'est le discriminant qui a rendu la passe sure) ;
3. vocabulaire complete apres extraction des 1070 mots distincts des textes
   affiches ;
4. valeurs de props d'affichage (liste blanche de cles) + texte JSX multi-lignes ;
5. valeurs d'objets dont la cle n'est pas technique (liste noire : `icon`, `to`,
   `key`, `value`, `type`, `slug`...).

**Trois regressions introduites, toutes rattrapees par `tsc` et corrigees :**
la cle d'icone `video` devenue `vidéo`, la valeur de tabulation `recentes`
devenue `récentes` alors qu'elle type une union, et le discriminant `equipe` de
`AccessDenied`. Lecon : les litteraux servant de valeurs d'union ou de cles
d'enregistrement doivent rester en ASCII ; seul le texte affiche est traduit.

**Volontairement non traites** : `affiche`, `teste`, `supprime`, `propose`,
`expose`, `configure`, `personnalise`. Selon le contexte ce sont des verbes
conjugues (« il affiche ») ou des participes (« affiché ») ; un remplacement
automatique introduirait des fautes. A reprendre a la main si besoin.

**Verifications** : `tsc --noEmit` → 0 erreur ; routes, slugs et cles d'union
controles intacts ; rendu verifie dans le navigateur.

### Etape 2 — ce qui a ete fait le 21/11

**Libelles en base (migration 0012).** La passe d'accents ne couvrait que le
code ; `app_settings`, `news_categories` et `map_categories` affichaient encore
« Actualites recentes ». Seules les valeurs sont accentuees : slugs et cles
JSON restent en ASCII.

**Scene d'accueil reecrite.** Deux bugs reels :
- `preserveAspectRatio="none"` etirait le SVG des palmiers sur toute la
  largeur — les palmes se reduisaient a des formes d'etoile. Chaque palmier a
  maintenant son propre SVG, proportions preservees ;
- le degrade de ciel mettait l'orange le plus vif tout en bas, sous la mer, au
  lieu de le concentrer a l'horizon.

Composition : halo separe du disque solaire (un calque unique se lisait comme
une tache floue), soleil couchant DANS l'eau, brume d'horizon plutot qu'un
trait net, chemin de lumiere en trapeze qui s'elargit au premier plan, grain
leger contre les paliers de degrade.

Les palmiers sont dimensionnes en `vw` et non en `vh` : en hauteur de fenetre,
un iPhone en portrait les rendait enormes et ils se percutaient au centre.

**Systeme d'elevation** (`tokens.css`) : `--edge` / `--edge-strong` (arete
lumineuse sur le bord superieur, ce qui fait lire une surface comme du verre),
`--shadow-lift` / `--shadow-float`, `--band` / `--band-edge` pour le rythme
vertical, `--halo-surf` / `--halo-sunset` pour l'ambiance.
Applique aux cartes et aux sections d'accueil (alternance une section sur deux).

**Barre du haut** : la recherche ne s'ouvre qu'a 1100px ; en dessous les
onglets n'avaient plus la place et defilaient discretement, « Cadeaux » etait
coupe.

**Verifie** : `tsc --noEmit` → 0 erreur ; rendu controle en 1240px, 390px et
375x812.

### Etape 3 — ce qui a ete fait le 21/11

**Transitions de page** (`src/app/PageTransition.tsx`). Choix explicite :
seule l'ENTREE est animee. Avec `AnimatePresence mode="wait"`, la page
sortante doit finir son animation avant que l'entrante commence — la
navigation parait deux fois plus lente, et le probleme empire sur les routes
chargees en `lazy` ou l'attente reseau s'ajoute a l'attente d'animation.
Ici la cle `pathname` force le remontage : l'animation d'entree se declenche
sans retard ajoute. Deplacement court (10px) pour que l'oeil lise la page
plutot que de suivre le mouvement. Neutralisee si mouvement reduit.

**Indicateur actif de la navigation desktop** : pastille partagee via
`layoutId`, comme la barre d'onglets mobile. Il a fallu retirer le
`background` de `.link.active` : un fond statique sautait d'un onglet a
l'autre pendant que la pastille, elle, glissait. Le bouton Premium garde son
fond statique — il n'appartient pas au groupe a pastille partagee, il n'y a
rien a faire glisser vers lui.

**Accents, suite** : locutions figees (`a jour`, `jusqu'a`, `a partir`...),
formes verbales oubliees, et desambiguisation par le contexte des participes
ecartes a l'etape 1 (`est simule` -> `est simulé`, `sera configure` ->
`sera configuré`, `des qu'` -> `dès qu'`).

**Une regression introduite et corrigee** : la regex de participes ajoutait
« é » au lieu de remplacer le « e » final, produisant « configureé ».
5 occurrences, toutes reparees ; controle `grep 'eé'` desormais a zero.

### Limite de verification a connaitre

Le volet navigateur de l'outil passe en `visibilityState: "hidden"`. Le
navigateur suspend alors le rendu et l'IntersectionObserver : les sections
basses de l'accueil restent a `opacity: 0` dans mes captures. **Ce n'est pas
un defaut de l'application** (verifie : aucun verrou de defilement, aucun
`overflow` bloquant, la page mesure bien 4110px pour 568px de fenetre), mais
cela signifie que je n'ai pas pu voir les sections basses animees. A controler
visuellement dans un vrai navigateur.

### Etape 4 — ce qui a ete fait le 21/11

Les briques de reglages existaient (profil, apparence, notifications) mais
**rien ne les assemblait** : `SettingsPage` etait un fichier d'attente.

**Trois panneaux ecrits** :
- `AccessibilitySettings` : reduction des animations (cumulee avec
  `prefers-reduced-motion` du systeme, qu'elle ne peut pas annuler) et
  relecture de l'introduction.
- `SubscriptionSettings` : statut LEONIDA+ reel, lu dans `subscriptions` —
  table qu'aucun utilisateur ne peut ecrire. Affiche l'etat serveur, pas une
  supposition du navigateur. Dit explicitement qu'aucun paiement n'est
  possible tant que `stripe_enabled` est faux.
- `AccountSettings` : e-mail, date d'inscription, changement de mot de passe
  via `supabase.auth.updateUser`, deconnexion avec confirmation, et section
  de suppression de compte.

**`SettingsScreen`** assemble les six onglets. L'onglet actif vit dans l'URL
(`?onglet=`) et non dans un etat local : un lien vers un reglage precis reste
partageable, le bouton Retour fonctionne, un rechargement ne ramene pas au
premier onglet. Barre d'onglets collante sous la barre du haut.

**Deux defauts corriges en cours de route** :
- j'avais ecrit la cle `sessionStorage` de l'intro de memoire
  (`leonida.intro.seen`) alors qu'elle vaut `leonida.intro.vue`. Elle est
  desormais **exportee depuis `Intro.tsx`** : une seule source, pas de derive.
- j'avais invente une adresse de contact (`contact@leonida.app`) pour la
  suppression de compte. Une adresse plausible mais fausse est pire qu'aucune
  adresse : le membre ecrit dans le vide. Elle devient le reglage
  `app.identity.contact_email` (migration 0013), nul par defaut, et le texte
  s'adapte tant qu'il n'est pas renseigne.

**Suppression de compte** : volontairement NON automatisee. L'operation exige
la cle `service_role`, donc une Edge Function qui n'existe pas encore. Plutot
qu'un bouton qui echouerait — ou pire, qui ferait croire a une suppression —
l'ecran explique la procedure reelle et ce qui serait efface.

**Verification reelle** : compte de test cree, connexion effectuee, les six
onglets parcourus dans le navigateur, liens profonds `?onglet=` controles,
requetes Supabase validees une a une (profiles, user_settings, subscriptions,
app_settings, rpc is_premium, notifications : toutes OK). Compte supprime
ensuite — la base est revenue a 0 compte.

### Prochaine tache

Fusionner `NewsCard` / `PostCard` (reliquat de l'etape 1), puis **etape 5** :
l'espace administrateur, qui reste le plus gros manque du projet.

---

## 4. Journal des decisions

- **20/11** — LEONIDA separe de PassLoyal : dossier, depot et projet Supabase
  dedies. CREWUP (`ihtgwqzqvjxrhuxhnkwd`) laisse intact.
- **20/11** — Roles hors table `profiles` (table `user_roles` dediee) et statut
  premium ecrit uniquement par `service_role` : l'auto-attribution devient
  structurellement impossible, pas seulement interdite par convention.
- **20/11** — Coordonnees de marqueurs relatives (0..1) a l'image d'origine
  plutot qu'en pixels : les reperes restent exacts a tout zoom et sur tout ecran.
- **20/11** — Moteur de carte ecrit a la main plutot que Leaflet : controle total
  du placement tactile et du flux de contribution, sans dependance de 145 Ko.
- **21/11** — `src/services/query.ts` reprend le type `PostgrestSingleResponse`
  de postgrest-js au lieu d'en redeclarer un equivalent. La redeclaration
  faisait echouer l'inference de TypeScript, qui retombait sur `never` et
  cassait 14 fichiers.

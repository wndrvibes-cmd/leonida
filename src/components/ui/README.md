# `src/components/ui` — primitives LEONIDA

Bibliothèque de composants partagés. Tous les autres modules composent **ces**
primitives : aucune page ne redéfinit un bouton, une carte ou un dialogue.

```ts
import { Button, Card, Badge, Icon, useToast } from '@/components/ui'
```

## Règles respectées par tous les fichiers de ce dossier

| Règle | Mise en œuvre |
| --- | --- |
| CSS Modules | un `<Nom>.module.css` par composant, importé en `import s from './<Nom>.module.css'` |
| Jetons uniquement | aucune couleur, rayon, ombre, durée ou courbe d'accélération en dur : tout vient de `src/styles/tokens.css` |
| Mobile d'abord | cibles tactiles ≥ 44px, `var(--safe-bottom)` dans les barres d'action, aucun débordement horizontal (`.scroll-x`) |
| Animations | `transform` / `opacity` seulement ; les durées proviennent de `--dur-*`, donc le réglage « réduire les animations » du membre les annule |
| Honnêteté | aucune donnée de démonstration ; `EmptyState` et `ErrorState` existent pour dire explicitement qu'il n'y a rien à afficher |
| Accessibilité | labels reliés (`aria-describedby`), `role=switch`, `role=dialog` + piège de focus, `role=tablist` navigable aux flèches |

---

## Actions

### `Button`

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'premium'` | `'primary'` | `primary` = dégradé turquoise `--grad-surf`, `premium` = dégradé couchant `--grad-sunset` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | hauteurs 40 / 46 / 54px ; `sm` passe à 44px sur écran tactile |
| `as` | `'button' \| 'link' \| 'a'` | `'button'` | `'link'` rend un `<Link>` react-router (prop `to`), `'a'` un lien sortant (prop `href`) |
| `loading` | `boolean` | `false` | remplace l'icône de gauche par un `Spinner`, pose `aria-busy`, neutralise les clics |
| `disabled` | `boolean` | `false` | un lien désactivé devient un `<span role="link" aria-disabled>` |
| `iconLeft` / `iconRight` | `ReactNode` | — | typiquement `<Icon name="plus" size={18} />` |
| `iconOnly` | `boolean` | `false` | bouton carré : `aria-label` devient obligatoire |
| `fullWidth` | `boolean` | `false` | largeur 100% (formulaires mobiles) |

Micro-interaction : `translateY(-1px)` au survol (pointeur fin uniquement),
`scale(0.98)` à l'appui, lueur `--shadow-glow` sur `primary`.

### `Switch`

| Prop | Type | Rôle |
| --- | --- | --- |
| `checked` | `boolean` | état courant (toujours contrôlé) |
| `onChange` | `(checked: boolean) => void` | appelé avec la valeur **cible** |
| `label` / `description` | `ReactNode` | rangée de réglage ; sans eux, l'interrupteur est rendu seul |
| `disabled` / `busy` | `boolean` | `busy` pose `aria-busy` pendant l'enregistrement |

Rendu `role="switch"` + `aria-checked` ; la piste mesure 32px mais sa zone
tactile est étendue à 44px.

---

## Surfaces et identité

### `Card` + `CardHeader`

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `variant` | `'flat' \| 'raised' \| 'interactive'` | `'flat'` | surface translucide (`--surface` + `--blur-panel`) ; `interactive` lève la carte au survol |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | `lg` s'élargit au-delà de 768px |
| `as` | `'div' \| 'article' \| 'section' \| 'li' \| 'aside'` | `'div'` | balise sémantique |
| `to` / `onClick` | `To` / handler | — | rend un `<Link>` ou un `<button>` et bascule en `interactive` |

`CardHeader` : `title`, `subtitle`, `action`.

### `Badge`

| Prop | Type | Défaut |
| --- | --- | --- |
| `tone` | `'neutral' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'premium'` | `'neutral'` |
| `size` | `'sm' \| 'md'` | `'md'` |
| `icon` | `ReactNode` | — |
| `dot` | `boolean` | `false` |

`asBadgeTone(tone)` convertit sans risque le `tone: string` de
`RELIABILITY_LABELS` / `VERIFICATION_LABELS` vers `BadgeTone`.

### `Avatar`

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `src` | `string \| null` | — | `profiles.avatar_url` ; en cas d'erreur de chargement, repli automatique |
| `name` | `string \| null` | — | sert aux initiales (2 lettres max) et au texte alternatif |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 24 / 32 / 44 / 64 / 96px |
| `isPremium` | `boolean` | `false` | anneau dégradé couchant |

### `Icon`

`<Icon name="map" size={20} />` — `name` est typé (`IconName`), `size` en pixels
(20 par défaut), `strokeWidth` ajustable, `filled` pour un tracé plein (cœur
aimé, favori posé), `title` pour rendre l'icône accessible (sinon elle est
`aria-hidden`).

Jeu disponible : `home`, `news`, `community`, `users`, `moments`, `map`, `gift`,
`sparkles`, `user`, `settings`, `bell`, `search`, `plus`, `close`, `check`,
`chevron-left`, `chevron-right`, `chevron-down`, `chevron-up`, `arrow-left`,
`arrow-right`, `heart`, `fire`, `comment`, `bookmark`, `share`, `flag`,
`flag-2`, `shield`, `trash`, `edit`, `image`, `upload`, `download`, `external`,
`filter`, `menu`, `logout`, `crown`, `pin`, `car`, `target`, `coins`, `trophy`,
`gem`, `compass`, `eye`, `clock`, `alert`, `info`, `zoom-in`, `zoom-out`,
`locate`, `send`, `loader`, `refresh`, `star`, `lock`, `mail`, `camera`, `play`,
`more`, `calendar`, `video`.

---

## Formulaires

`Input`, `Textarea` et `Select` partagent `Field` : label relié par `htmlFor`,
aide et erreur reliées par `aria-describedby`, `aria-invalid` posé en cas
d'erreur, astérisque visuelle sur les champs requis.

| Composant | Props propres | Reste |
| --- | --- | --- |
| `Input` | `label`, `hint`, `error`, `iconLeft`, `addonRight`, `fieldClassName` | tous les attributs de `<input>` ; `ref` transmise |
| `Textarea` | `label`, `hint`, `error`, `showCount`, `fieldClassName` | `showCount` + `maxLength` affiche « 120 / 500 », en sable à 90% de la limite |
| `Select` | `label`, `hint`, `error`, `options`, `placeholder` | `options: {value,label,disabled}[]` ou des `<option>` en enfants |

`Field` est exporté pour les champs composés : `fieldIds(baseId, { hint, error })`
renvoie `{ inputId, hintId, errorId, describedBy }`.

### `ImageUploader`

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `bucket` | `BucketName` | — | bucket Supabase ; impose la limite de poids affichée |
| `userId` | `string \| null \| undefined` | — | premier segment du chemin `<userId>/<uuid>.<ext>` ; absent, la zone est verrouillée avec une explication |
| `multiple` | `boolean` | `false` | envoi groupé séquentiel |
| `maxFiles` | `number` | `multiple ? 4 : 1` | compteur affiché `n / max` |
| `onUploaded` | `(images: UploadedImage[]) => void` | — | liste **complète** à jour après chaque envoi ou suppression |
| `existing` | `UploadedImage[]` | `[]` | images déjà attachées (édition) |
| `label` / `hint` / `disabled` | — | — | — |

Appelle réellement `uploadImage` / `uploadImages` / `deleteUpload` /
`validateImageFile` de `@/lib/upload`. Deux entrées de fichier distinctes sur
mobile : **Photothèque** (`accept="image/*"`) et **Fichiers**
(`accept={ACCEPTED_IMAGE_ACCEPT}`). Dépôt par glisser-déposer, prévisualisation
en grille, barre de progression, suppression par vignette (bouton de 44px),
erreurs traduites par `readableError`.

---

## Calques

### `Modal`

| Prop | Type | Défaut |
| --- | --- | --- |
| `open` / `onClose` | `boolean` / `() => void` | — |
| `title` / `description` | `string` | — |
| `ariaLabel` | `string` | — (nom accessible quand il n'y a pas de titre visible) |
| `footer` | `ReactNode` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` (26 / 36 / 54rem sur desktop) |
| `hideCloseButton` | `boolean` | `false` |
| `disableBackdropClose` | `boolean` | `false` |

Dialogue centré au-delà de 768px, **feuille montante** en dessous (avec
poignée). `createPortal` vers `document.body`, piège de focus, fermeture Échap
et clic sur le fond, défilement du corps verrouillé, barre d'actions au-dessus
de `--safe-bottom`.

### `Sheet`

Mêmes garanties que `Modal`. `side: 'right' | 'left'` sur desktop (panneau de
26rem pleine hauteur), feuille montante à 88% de hauteur sur mobile. Conçu pour
les filtres : le pied de page étire ses boutons sur toute la largeur.

### `ConfirmDialog`

| Prop | Type | Défaut |
| --- | --- | --- |
| `open`, `title`, `message` | — | — |
| `confirmLabel` / `cancelLabel` | `string` | `'Confirmer'` / `'Annuler'` |
| `tone` | `'danger' \| 'accent'` | `'danger'` |
| `loading` | `boolean` | `false` (verrouille les deux boutons et le fond) |
| `onConfirm` / `onCancel` | `() => void` | — |

### `Toast` + `ToastProvider`

Placer `<ToastProvider>` autour de l'application, puis :

```ts
const { toast, success, error, info, dismiss } = useToast()
success('Découverte envoyée', 'Elle passe en file de validation.')
error("Envoi impossible", readableError(err))
const id = toast({ title: 'Brouillon enregistré', duration: 0 })  // 0 = persistant
```

File d'attente de 3 notifications au maximum, fermeture automatique (4s succès,
4,5s info, 7s erreur), action facultative `{ label, onClick }`. Empilement en
haut à droite sur desktop, **en bas sur mobile au-dessus de la barre d'onglets**
(`--tabbar-total`) et de la zone de sécurité.

---

## États d'écran

| Composant | Props |
| --- | --- |
| `Skeleton` | `width`, `height`, `radius: 'sm'\|'md'\|'lg'\|'full'`, `lines` (dernière ligne raccourcie), `className` ; `SkeletonAvatar({ size })` |
| `EmptyState` | `title`, `description`, `illustration` (défaut : horizon SVG sobre), `action`, `compact` |
| `ErrorState` | `error` (traduit par `readableError`), `title`, `description`, `onRetry`, `retryLabel`, `compact` |
| `Spinner` | `size: 'sm'\|'md'\|'lg'`, `label`, `silent` |

Les quatre états attendus par écran se composent ainsi : `Skeleton` au
chargement, `EmptyState` quand la requête ne renvoie rien, `ErrorState` avec
« Réessayer » en cas d'échec, contenu réel sinon.

> `Spinner` tourne via framer-motion, et non via les jetons `--dur-*` : un
> indicateur figé mentirait sur l'état réel du chargement, y compris quand le
> membre a demandé la réduction des animations. Tous les autres mouvements, eux,
> s'annulent bien avec ce réglage.

---

## Navigation

### `Tabs`

| Prop | Type | Défaut |
| --- | --- | --- |
| `items` | `TabItem[]` (`value`, `label`, `icon?`, `badge?`, `disabled?`, `panelId?`) | — |
| `value` / `onChange` | `string` / `(v: string) => void` | mode contrôlé |
| `defaultValue` | `string` | premier onglet |
| `size` | `'sm' \| 'md'` | `'md'` |
| `fullWidth` | `boolean` | `false` |
| `ariaLabel` | `string` | — |

Indicateur animé par `layoutId` framer-motion (identifiant dérivé de `useId`,
donc deux groupes d'onglets ne se volent pas la pastille). `role="tablist"`,
flèches / `Home` / `End` au clavier, rangée dans un conteneur `.scroll-x`.

---

## Aides internes exportées

| Export | Rôle |
| --- | --- |
| `cx(...)` | concatène des classes en ignorant les valeurs vides |
| `useMediaQuery(q)`, `useIsMobile()`, `MOBILE_QUERY` | point de rupture mobile unique (`max-width: 767px`) |
| `useBodyScrollLock(active)` | verrou de défilement avec compteur partagé (calques imbriqués) |
| `useFocusTrap(active, ref)` | piège de focus et restitution du focus d'origine |
| `useEscapeKey(active, fn)` | fermeture au clavier |

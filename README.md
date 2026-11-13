# La Bringue — Festival

Site web du festival **La Bringue**, organisé par l'association du même nom. Un festival de musique en plein air, pensé comme une extension du travail de l'association : offrir aux femmes un espace pour sortir, profiter et se sentir en sécurité.

---

## Sommaire

- [La Bringue — Festival](#la-bringue--festival)
  - [Sommaire](#sommaire)
  - [Le festival](#le-festival)
  - [Sitemap](#sitemap)
  - [Stack technique](#stack-technique)
  - [Architecture du code](#architecture-du-code)
  - [Back-office](#back-office)
  - [Design system](#design-system)
  - [Démarrage](#démarrage)
  - [Variables d'environnement](#variables-denvironnement)
  - [Base de données et Storage (Supabase)](#base-de-données-et-storage-supabase)
  - [Tests](#tests)
  - [Déploiement](#déploiement)
  - [Structure du contenu](#structure-du-contenu)

---

## Le festival

Le festival est le prolongement de cette mission à l'échelle d'un événement en plein air, sur plusieurs jours.

**Mission — pourquoi il existe**
- Rassembler des femmes venues de villes différentes
- Étendre les styles musicaux représentés
- Profiter de l'été pour organiser un événement en plein air

**Action — ce qu'il propose**
- Un festival de musique avec plusieurs scènes, chacune associée à un style musical et une identité visuelle propre (Chrome, Summer, 2000's, Soft Y2K)
- Des stands (tatouage, photobooth, marché d'artistes indépendants, restauration)
- Un espace conférences avec des invitées, autour de discussions féministes

**Valeurs**
- Écologique
- Respectueux des régimes alimentaires (*friendly*)
- No men, no problem

**Personnalité**
- Bienveillant, féministe, safe, inclusif

> Cette identité n'est pas qu'un texte sur une page "About us" : elle doit se ressentir dans le ton, les couleurs et l'expérience du site dans son ensemble — en particulier via l'accessibilité numérique (inclusivité) et le choix des mots (voir `backlog-la-bringue.md`, annexe "Bonnes pratiques de développement").

---

## Sitemap

```
/                       Home (hero, édito → About us, 4 scènes, carrousels d'accès rapide, sponsors)
/programmation          Programmation musicale (liste filtrable : jour, scène)
/exposants              Exposants — tatouage, restauration, artisanat (liste filtrable : catégorie)
/conferences            Conférences (liste filtrable : jour)
/:type/fiche/:id        Fiche détail — template unique, type = artiste | conference | exposant (id numérique)
/mon-programme          Mon programme (connecté uniquement)
/profil                 Profil (connecté uniquement)
/a-propos               À propos (nos valeurs)
/actualites             Liste des actualités
/actualites/:id         Détail d'une actualité
/infos-pratiques        Infos pratiques (accès, horaires, camping, parking, cashless, PMR, règlement, contact)
/billetterie            Billetterie (formules, promotions, achat via Shotgun)
/admin/…                Back-office (réservé aux admins) — voir « Back-office »
```

**Accès depuis la navigation**

| Élément | Contenu |
|---|---|
| Navbar (desktop) | Logo → Home · Programmation · Billetterie · icône Mon programme · icône Profil/Connexion · menu burger |
| Navbar (mobile) | Logo → Home · icône Mon programme · icône Profil/Connexion · menu burger |
| Menu burger (desktop) | Exposants · Conférences · À propos · Nous contacter · Infos pratiques |
| Menu burger (mobile) | Programmation · Billetterie · Exposants · Conférences · À propos · Nous contacter · Infos pratiques |
| Footer | Newsletter · Accéder au festival (adresse) · À propos · Contact · Mentions légales |

## Stack technique

| Domaine | Choix |
|---|---|
| Framework front | [Vue.js](https://vuejs.org/) |
| Routage | [Vue Router](https://router.vuejs.org/) (`src/router/index.ts`) |
| Authentification & données | [Supabase](https://supabase.com/) (Auth + base Postgres, accédée via les *handlers* de `src/handlers/`) |
| Fichiers | Supabase Storage : bucket public `images` (contenu du site), bucket privé `profilepictures` (photos de profil) |
| Notifications | [vue-sonner](https://vue-sonner.vercel.app/) (toasts, ex. « Ajouté à Mon programme ») |
| Tests | [Vitest](https://vitest.dev/) + Vue Test Utils + happy-dom |
| Déploiement | Build statique dans `docs/` (GitHub Pages, `base: '/la-bringue/'`) |

Le contenu du site (programmation, exposants, conférences, formules, infos pratiques, actualités…) et les likes sont lus dans Supabase — voir [Structure du contenu](#structure-du-contenu). Il est modifié depuis le [back-office](#back-office). Les images du contenu sont envoyées par le back-office dans le bucket `images` ; les anciennes images d'artistes de `public/programmation/` restent servies telles quelles.

---

## Architecture du code

```
src/
├── assets/
│   ├── icons/                               # SVG exportés de Figma, lazy-loadés par <Icon>
│   └── card/, carrousel-tile/, conferenciere/, footer/, hero/, loader/, logo/, scenes/, sponsor/  # images/illustrations
├── components/
│   ├── ui/                                  # un dossier par composant (Composant/Composant.vue + .test.ts)
│   │   ├── Icon, Button, Select, Tag
│   │   ├── Like                             # <Like v-model=... label=... />
│   │   ├── ContentCard                      # carte partagée des listes
│   │   ├── FilterableList                   # recherche + filtres (côté serveur) + slot #item
│   │   ├── SearchBar                        # champ de recherche avec bouton « effacer », partagé site + back-office
│   │   ├── Checkbox, DatePicker             # case à cocher ; sélecteur date / heure / date + heure
│   │   ├── FileUpload                       # zone de dépôt d'un fichier (glisser-déposer, aperçu, validation)
│   │   ├── Carousel, CarouselTile           # carrousels d'accès rapide de la Home
│   │   ├── HighlightedText                  # texte avec surlignage des occurrences d'une recherche
│   │   ├── Loader                           # étoile du logo animée, suit le thème
│   │   └── PasswordInput                    # champ mot de passe avec afficher/masquer
│   ├── layout/
│   │   ├── Navbar, Footer, Hero, Breadcrumb
│   │   ├── Modal                            # <Modal :open=... title=... @close=...> générique
│   │   ├── Drawer                           # panneau latéral (menu burger), focus piégé
│   │   ├── SupportSection                   # « Ils nous soutiennent » (sponsors), masquable par route
│   │   └── AdminLayout                      # coque du back-office : menu latéral des sections
│   ├── admin/                               # briques du back-office (voir « Back-office »)
│   │   ├── AdminPage                        # titre, lien retour, largeur « liste » ou « formulaire »
│   │   ├── AdminTable                       # tableau paginé : recherche, scroll infini, actions par ligne
│   │   ├── AdminForm                        # formulaire piloté par une liste de champs
│   │   ├── AdminLinks                       # édition d'une liste de liens (réseaux sociaux…)
│   │   └── ConcertLineup                    # artistes d'un concert (ajout / retrait / annoncée)
│   ├── home/
│   │   ├── ProgrammationSection.vue         # programmation par jour sur la Home
│   │   └── ProgrammationDay.vue             # un jour : headliner + line-up
│   ├── billetterie/
│   │   └── BilletterieCard.vue              # carte d'une formule (dates, prix, promotion, places restantes)
│   ├── fiche/
│   │   ├── FichePresentation.vue            # bloc commun artiste / conférence / exposant (photo, stickers par scène, tags)
│   │   └── IntervenanteProfil.vue           # mini-profil d'une conférencière (fiche conférence)
│   └── auth/
│       ├── LoginForm.vue
│       └── SignUpForm.vue
├── views/                                   # une vue par route
│   ├── HomeView, ProgrammationView, ExposantsView, ConferencesView
│   ├── FicheDetail                          # gabarit unique des fiches, blocs spécifiques selon le type
│   ├── MonProgrammeView, ProfileView
│   ├── AProposView, BilletterieView, InfosPratiquesView
│   ├── ActualitesView, ActualiteDetailView  # liste des actualités + page article
│   └── admin/                               # une vue « liste » et une vue « formulaire » par section du back-office
├── router/
│   └── index.ts                             # routes, scroll en haut de page, meta `hideSupport`, routes /admin générées
├── handlers/                                # accès Supabase, un handler par table
│   ├── crud.ts                              # createCrudHandler (getAll/getById/create/update/delete), pagination (`getPage`), HandlerError, unwrap
│   ├── actualite, artiste, concert, concert-artiste, conference, conferenciere,
│   │   exposant, formule, info-pratique, like, participation, profil, promotion, scene
│   └── index.ts                             # point d'entrée unique
├── composables/
│   ├── usePaginatedList.ts                  # liste paginée côté serveur : recherche (anti-rebond), page suivante, erreurs
│   ├── useInfiniteScroll.ts                 # déclenche « page suivante » quand un repère entre dans l'écran
│   ├── useAdminList.ts                      # liste du back-office : pagination + suppression d'une ligne
│   ├── useAdminLinks.ts                     # état d'une liste de liens éditable
│   ├── useFloatingPanel.ts                  # panneau flottant (Select, DatePicker) : position, retournement, clic extérieur
│   ├── useProfilePicture.ts                 # photo de profil de l'utilisatrice (URL signée rafraîchie)
│   ├── useBreadcrumbTitle.ts                # titre dynamique du fil d'Ariane
│   ├── useAuth.ts                           # utilisatrice courante (session Supabase)
│   ├── useAuthModal.ts                      # modale d'auth + like en attente pendant la connexion
│   ├── useLikes.ts                          # état partagé des likes + toast de confirmation
│   ├── useTextSearch.ts                     # recherche « Ctrl+F » dans une zone : compteur, résultat actif, navigation (page Infos pratiques)
│   ├── useListSearch.ts                     # recherche d'une FilterableList partagée aux ContentCard pour surligner leur nom
│   ├── useFocusTrap.ts                      # piège de focus clavier réutilisable
│   └── useTheme.ts                          # thème clair/sombre/système (voir Design system)
├── types/
│   ├── database/                            # une interface par table Supabase
│   └── ui/                                  # props/noms valides des composants et cartes (IconName, ButtonColor, Fiche, ArtisteCard, ...)
├── styles/
│   ├── tokens/                              # design tokens générés depuis Figma (voir Design system)
│   └── utilities.css
├── lib/
│   │                                        # un dossier par module, avec son test (ex. lib/cards/cards.ts)
│   ├── auth-validation, auth-errors         # validation email/mot de passe ; erreurs Supabase Auth en messages FR
│   ├── with-timeout                         # détection d'un Supabase injoignable/en timeout
│   ├── cards                                # données Supabase → cartes (Programmation, Conférences, Exposants, Actualités)
│   ├── fiche                                # construction d'une fiche + suggestions
│   ├── highlight                            # splitMatches() : découpe un texte selon une recherche (sans accents ni casse)
│   ├── billetterie                          # formules → cartes : dates, promotion (urgente ≤ 7 jours), places restantes (< 20)
│   ├── mon-programme                        # likes → items de « Mon programme », regroupés par jour
│   ├── anchor                               # sectionAnchor() : ancre d'une section à partir de son titre
│   ├── photo                                # photoUrl() : URL d'une image ; dossiers de Storage (STORAGE_FOLDERS)
│   ├── image/to-webp                        # conversion WebP côté navigateur + contrôle de poids (voir Back-office)
│   ├── date-picker                          # découpe/formatage des valeurs date, heure, date + heure
│   ├── publication                          # isPublished() : règle de visibilité des actualités
│   ├── promotion                            # promotionStatus() (en cours / à venir / terminée), formatPeriode()
│   ├── admin-sections                       # sections du back-office : source unique des routes et du menu
│   ├── links, options, socials, concert-checks  # helpers des formulaires du back-office
├── supabase.js                              # client Supabase (config lue depuis .env.local)
├── App.vue
├── main.ts
└── style.css                               # importe les tokens, pont vers les variables globales
```

Chaque composant/fichier logique a ses tests co-localisés (ex. `LoginForm.test.ts` à côté de `LoginForm.vue`) — voir [Tests](#tests).

---

## Back-office

Interface d'administration du contenu, sous `/admin` (route `requiresAdmin` : réservée aux profils dont `Profil.role = 'admin'`). La sécurité réelle est côté Supabase (RLS, voir [Base de données et Storage](#base-de-données-et-storage-supabase)) ; la route ne fait que masquer l'interface.

### Sections

Le menu latéral et les routes viennent d'une seule liste, `ADMIN_SECTIONS` (`lib/admin-sections`).

| Section | URL | Ce qu'on y gère |
|---|---|---|
| Artistes | `/admin/artistes` | Nom, photo, catégorie, description, liens |
| Concerts | `/admin/concerts` | Jour, horaires, scène, line-up (artistes, « annoncée » ou non) |
| Conférences | `/admin/conferences` | Titre, jour, horaires, thème, intervenantes |
| Intervenantes | `/admin/intervenantes` | Conférencières : nom, photo, bio, liens |
| Exposants | `/admin/exposants` | Nom, photo, catégorie, description |
| Actualités | `/admin/actualites` | Titre, photo, description, date de publication |
| Billetterie | `/admin/billetterie` | Formules : dates, prix, lien Shotgun, places, présence en page d'accueil |
| Promotions | `/admin/promotions` | Réduction en % sur une formule, sur une période |

Chaque section a une **liste** (`/admin/<section>`) et un **formulaire** de création (`/nouveau` ou `/nouvelle`) / modification (`/:id`).

### Comment c'est construit

Une section = deux vues dans `src/views/admin/` + une entrée dans `CRUD_SECTIONS` (`router/index.ts`) :

- **Vue liste** — un `AdminPage` contenant un `AdminTable` alimenté par `useAdminList`. Colonnes déclarées dans la vue ; contenu d'une cellule personnalisable via le slot `cell-<clé>`, boutons de ligne via `row-actions` (ex. « Publier maintenant »).
- **Vue formulaire** — un `AdminForm` et la liste de ses champs (`AdminFormField`). Le formulaire gère seul le chargement (`getById`), l'envoi (`create` / `update`), les messages d'erreur et le toast de confirmation. Une page peut y ajouter des **règles** (`rules`, ex. « fin après début ») et du contenu propre via son slot.
- **Suppression** — toujours précédée d'une fenêtre de confirmation qui indique ce qui sera impacté (ex. « 3 concerts utilisent cet artiste »).

**Types de champs d'`AdminForm`** : `text`, `textarea`, `select`, `number` (bornes `min`/`max`), `checkbox`, `date`, `time`, `datetime`, `image`. Un champ `required` affiche un `*` et bloque l'envoi s'il est vide ; un champ vidé est envoyé à `null`.

### Listes : filtrage et pagination côté serveur

Rien n'est filtré ni trié dans le navigateur. Chaque handler expose une méthode `getPage({ offset, search, pageSize, … })` qui interroge Supabase (`ilike`, `order`, `range`) et lit **une ligne de trop** pour savoir s'il reste une page, sans requête de comptage.

- **Back-office** : pages de 20 lignes (`ADMIN_PAGE_SIZE`), recherche avec anti-rebond de 300 ms, **scroll infini** (repère en bas du tableau) avec repli « Voir plus » / « Réessayer ». Le tableau défile horizontalement sur petit écran.
- **Site public** : `FilterableList` suit le même principe (pages de 5, `PAGE_SIZE`) ; la prop `serverSide` n'existe plus, tout passe par le serveur.
- La saisie de recherche est échappée (`%`, `_`, `\`) avant d'être envoyée.

### Images

Toute image envoyée passe par `toWebp()` (`lib/image/to-webp`) **dans le navigateur** avant d'aller dans Storage :

1. formats acceptés : JPEG, PNG, WebP (30 Mo max avant conversion) ;
2. redimensionnée à 1600 px de large max, convertie en WebP (qualité 0,85, abaissée si besoin) ;
3. refusée si le résultat dépasse **5 Mo** (`MAX_WEBP_BYTES`) ;
4. nommée `<nom-de-l-entité>-<uuid8>.webp` (ex. `angele-3f9c1a2b.webp`) dans un dossier par type (`programmation/`, `actualites/`…) : un nom lisible pour le SEO, un suffixe unique pour éviter les collisions.

Le composant `FileUpload` (glisser-déposer, aperçu, bouton retirer) affiche ces limites. Le champ `photo` ne stocke que le chemin (`/programmation/angele-3f9c1a2b.webp`), résolu par `photoUrl()`.

### Règles métier

**Actualités — publication par date.** Pas de colonne « publiée » : une actualité est visible sur le site si et seulement si `date_publication <= maintenant` (`isPublished()`). Sans date, elle n'est jamais visible. La règle est appliquée **deux fois** : dans les requêtes du handler *et* dans la RLS. Dans la liste admin, un tag **En attente** / **Publiée** indique l'état, et **Publier maintenant** met la date à aujourd'hui.

**Billetterie.** Une formule a des dates (fin ≥ début), un prix, un nombre de places total et restantes (restantes ≤ total) et peut être mise en avant sur l'accueil. La suppression d'une formule rappelle le nombre de promotions liées.

**Promotions.** Réduction de 1 à 100 %, début et fin obligatoires (fin après début). Statut calculé à partir des dates (`promotionStatus`) : **En cours**, **À venir** ou **Terminée**. Le site public ne montre que les promotions en cours.

### Photos de profil

Chaque utilisatrice peut ajouter une photo dans `/profil` (même conversion WebP, 512 px, 1 Mo max). Elle est stockée dans le bucket **privé** `profilepictures`, son chemin dans `Profil.pp`, et lue via une URL signée (rafraîchie toutes les 50 min par `useProfilePicture`). Quand elle existe, la Navbar l'affiche à la place de l'icône utilisateur.

---

## Design system

Le design system vient de Figma (Variables + composants `Button`/`Icon`) et vit dans le code à trois endroits :

**1. Design tokens — `src/styles/tokens/`**

`primitives.css`, `sizes.css`, `typography.css` et l'essentiel de `theme.css` sont générés depuis un export Figma Variables (format W3C Design Tokens) par `scripts/generate-design-tokens.cjs` :

```bash
npm run tokens:generate
```

| Fichier | Contenu |
|---|---|
| `primitives.css` | Échelles de couleurs brutes (`--color-blue-500`, ...) |
| `sizes.css` | Échelle d'espacement (`--space-4`, ...) |
| `typography.css` | Polices, tailles, interlignage (valeurs "Desktop" de Figma uniquement — voir plus bas) |
| `theme.css` | Tokens sémantiques clair/sombre (boutons, cartes, tags, hero, ...) |

Toutes les tailles générées (`--space-*`, `--font-size-*`, `--line-height-*`, rayons, paddings dans `theme.css`, ...) sont en **rem**, pas en px — ça respecte le zoom/la taille de police du navigateur. Figma exportait aussi une variante "Phone" pour la typographie, mais ses valeurs ne sont pas une simple réduction proportionnelle des valeurs "Desktop" (le Hero perd 43 % en Phone, le texte Medium seulement 25 %) : plutôt que maintenir deux échelles, seule "Desktop" est gardée, et elle rétrécit déjà automatiquement sur petit écran grâce au `rem` (la taille de police de la racine change elle-même via une media query dans `style.css`).

`theme.css` contient aussi quelques blocs **écrits à la main**, absents de l'export Figma (pas de composant Figma correspondant), mais gardés dans ce même fichier plutôt qu'à part — voir le commentaire au-dessus de chacun :
- `--button-danger-*` (bouton "Danger", construit depuis la vraie échelle "red")
- `--select-*` (composant `Select`, pas de composant Figma "Select" du tout — construit depuis les primitives pink-bright/violet)
- `--alert-danger-*` (encadrés de message d'erreur, construit depuis la vraie échelle "red")

Ces blocs sont automatiquement réinjectés à chaque `npm run tokens:generate`, donc une régénération depuis Figma ne les efface pas.

Pour mettre à jour après un changement dans Figma : exporter les 4 collections dans un dossier `Collections/` à la racine (voir le commentaire en tête de `scripts/generate-design-tokens.cjs` pour le détail), relancer `npm run tokens:generate`, puis supprimer `Collections/`.

`src/style.css` importe ces tokens et fait le pont avec les variables déjà utilisées par les composants existants (`--text`, `--bg`, `--accent`, ...).

**2. Thème clair/sombre — `useTheme()`**

```ts
import { useTheme } from './composables/useTheme' // chemin relatif au fichier appelant

const { preference, resolvedTheme, setPreference } = useTheme()
```

Par défaut, le thème suit la préférence de l'appareil (`prefers-color-scheme`). Un choix explicite (`setPreference('light' | 'dark' | 'system')`) est mémorisé dans `localStorage` et posé sur `<html data-theme="...">`. Le sélecteur clair/sombre/défaut de la Navbar en est la seule interface pour l'instant.

**3. Composants `ui/` — `src/components/ui/`**

Un dossier par composant (`Composant/Composant.vue` + son test). Ils ne connaissent ni Supabase ni les handlers : tout passe par les props, `v-model` et slots.

| Composant | Rôle | Props / usage à retenir |
|---|---|---|
| `Icon` | Icône SVG | `name`, `size`. Chargée à la demande (un chunk par icône), hérite la couleur du texte |
| `Button` | Bouton | `color` (`primary` `secondary` `info` `danger`), `variant` (`full` `outlined` `ghost`), `size` (`medium` `large`), `icon-left`, slot `icon-right` |
| `Select` | Liste déroulante | `v-model`, `options`, `size`. Liste ouverte dans `<body>`, accessible au clavier |
| `Tag` | Étiquette courte | `label`, `variant` (`pink` `pink-bright` `violet` `blue`) |
| `Like` | Cœur « Mon programme » | `v-model` |
| `ContentCard` | Carte des listes | `nom` et `photo` obligatoires ; `date`, `scene`, `categorie` si renseignés ; `likable` |
| `FilterableList` | Recherche + filtres | `items`, `filters`, `v-model:selected`, slot `#item` |
| `SearchBar` | Champ de recherche | `v-model`, bouton effacer, `placeholder` |
| `Checkbox` | Case à cocher | `v-model`, `label` |
| `DatePicker` | Date, heure ou les deux | `v-model`, `mode` (`date` `time` `datetime`), `clearable` |
| `FileUpload` | Dépôt de fichier | `accept`, `max-size`, `hint`, aperçu, glisser-déposer |
| `Carousel`, `CarouselTile` | Accès rapide de la Home | Flèches désactivées aux extrémités |
| `Loader` | Étoile animée | `label` (« Chargement… » par défaut) |
| `PasswordInput` | Mot de passe | Bouton afficher/masquer |

```vue
<Button color="primary" variant="outlined" icon-left="search">Rechercher</Button>

<Select v-model="theme" :options="[{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]" />

<DatePicker v-model="debut" mode="datetime" clearable />

<FilterableList :items="artistes" :filters="filtres" v-model:selected="filtresActifs">
  <template #item="{ item }">
    <ContentCard :nom="item.nom" :photo="item.photo" likable />
  </template>
</FilterableList>
```

*Boutons et tags.* Chaque combinaison pointe vers les tokens `--button-{color}-{variant}-{state}-*` ou `--tag-{variant}-*` : aucune règle CSS par variante.

*Select et DatePicker.* Leur liste est téléportée dans `<body>` (jamais coupée par un parent) via `useFloatingPanel`, qui la repositionne et la retourne vers le haut si elle manque de place. Le `Select` n'est pas le `<select>` natif (dont la liste ne se style pas) ; il lit ses propres tokens `--select-*`. Le `DatePicker` commence la semaine le lundi et règle l'heure avec des flèches, par pas de 5 minutes.

*ContentCard et likes.* Un clic sur le cœur like, un second retire le like, sans jamais déclencher le clic de la carte. L'état est partagé par `useLikes` (toast « Ajouté à Mon programme »). Déconnectée, le clic ouvre la modale de connexion et mémorise le like, appliqué après la connexion (`useAuthModal`).

*FilterableList.* La liste ne filtre rien elle-même : la page recharge `items` quand la recherche ou un filtre change (voir [Back-office](#listes--filtrage-et-pagination-côté-serveur)).
- Un filtre = `{ key, label, allLabel, options }` : une rangée de boutons, l'option active en `primary`, précédée d'un bouton `allLabel` (« Tous les jours ») qui le retire.
- Les filtres se combinent en ET ; un bouton « Réinitialiser » et un message « aucun résultat » sont fournis.
- Les éléments ont au minimum un `id` et un `nom` ; `v-model:selected` permet de pré-appliquer un jour ou une scène depuis l'accueil.


**4. Fiches détail — `FicheDetail` + `src/components/fiche/`**

Une seule vue (`/:type/fiche/:id`) sert les trois types de fiche. `lib/fiche.ts` construit les données (`FicheData`, types dans `types/ui/fiche.ts`) depuis les handlers ; `FichePresentation` rend le bloc commun (photo avec stickers selon la scène, tags, like) et seuls les champs renseignés sont affichés. Chaque type ajoute son bloc spécifique (ex. `IntervenanteProfil` pour les conférencières) et la page se termine par « Ça peut aussi vous intéresser » (`SUGGESTIONS_COUNT` = 3 cartes). Un `Loader` est affiché pendant le chargement.

---

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production (vue-tsc + vite, sortie dans docs/ pour GitHub Pages)
npm run build

# Prévisualiser le build
npm run preview
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` à la racine du projet, puis renseigner les vraies valeurs (Project Settings → API sur supabase.com) :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxx
```

Ces clés sont utilisées uniquement par `supabase.js` (authentification, contenu et likes). `.env.local` est ignoré par git (`*.local`) — sans lui, `supabase.js` lève une erreur au chargement et la page reste blanche.

## Base de données et Storage (Supabase)

Le script [`supabase/admin_rls.sql`](supabase/admin_rls.sql) décrit la configuration de sécurité. Il est **idempotent** : on peut le rejouer tel quel dans le SQL Editor de Supabase, et il faut le rejouer après toute modification.

| Élément | Règle |
|---|---|
| `is_admin()` | Fonction `security definer` : vrai si `Profil.role = 'admin'` |
| Tables de contenu | Policy « Gestion admin » (`ALL`) : seuls les admins écrivent, et lisent tout |
| Lecture publique | Tout le monde lit les tables de contenu… |
| …sauf `Actualite` | Lecture publique limitée aux lignes où `date_publication <= now()` |
| …sauf `Promotion` | Lecture publique limitée aux promotions en cours |
| …sauf `ConcertArtiste` | Les artistes non « annoncées » restent cachées |
| `Profil` | Chaque utilisatrice lit son profil ; seuls les admins lisent tous les profils et changent un rôle |
| Bucket `images` (public) | Envoi réservé aux admins |

**Photos de profil** : le script de `profilepictures` (bucket privé, policies Storage, fonction `set_my_pp` qui enregistre `Profil.pp`) a été exécuté directement dans Supabase et n'est **pas** versionné dans le dépôt. Le bucket s'appelle bien `profilepictures` (avec un *s*).

À créer à la main côté Supabase : les buckets `images` et `profilepictures`, et la colonne `Profil.pp` (texte). Les actualités existantes **sans `date_publication`** disparaissent du site public tant qu'on ne leur en donne pas une.

## Tests

Les tests sont écrits avec **Vitest**.

```bash
# Lancer tous les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch

# Couverture
npm run test:coverage
```

## Déploiement

Le site est déployé sur GitHub Pages par le workflow [`deploy.yml`](.github/workflows/deploy.yml).

- **Push sur `main`** : tests, build puis déploiement automatiques. Si un test ou le build échoue, rien n'est publié.
- **Pull request** : seuls les tests tournent.
- **Relance manuelle** : onglet *Actions* → *Déploiement* → *Run workflow*.
- **Secrets requis** (Settings → Secrets and variables → Actions) : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Pages** : Settings → Pages → Source : *GitHub Actions*.
- Le build sort dans `dist/` (non versionné). `404.html` est une copie d'`index.html` pour que les routes de la SPA fonctionnent au rechargement.

URL : https://maeliglmr.github.io/la-bringue/

## Structure du contenu

Le contenu vit dans Supabase et est lu via les handlers de `src/handlers/` (un par table, construits sur `createCrudHandler`). Les composants ne parlent jamais directement à Supabase : ils appellent un handler, qui renvoie les données ou lève une `HandlerError`.

| Handler | Données |
|---|---|
| `artisteHandler`, `concertHandler`, `concertArtisteHandler`, `sceneHandler` | Artistes, concerts (jour, horaire, scène), line-up par jour (`DayLineup`) |
| `conferenceHandler`, `conferenciereHandler` | Conférences et leurs intervenantes (`ConferenceDetail`) |
| `exposantHandler` | Stands (catégorie, horaires d'ouverture) |
| `formuleHandler`, `promotionHandler` | Billetterie : formules et promotions (`FormuleAvecPromotions`) |
| `infoPratiqueHandler` | Infos pratiques |
| `actualiteHandler` | Actualités publiées (`getLatest`, `getPublishedById`) ; `getPage({ includeUnpublished })` pour le back-office |
| `likeHandler`, `participationHandler` | Likes de l'utilisatrice (« Mon programme », `LikeDetail`) et participations |
| `profilHandler` | Profil de l'utilisatrice, photo de profil (`getPpUrl`, `changePp`) |

Tous les handlers de contenu exposent `getPage` (pagination serveur) en plus du CRUD de base. Les types des lignes sont dans `src/types/database/`, un fichier par table. Les photos sont des chemins (champ `photo`) résolus par `photoUrl()` : fichiers du bucket `images` pour ce qui est envoyé depuis le back-office, `public/programmation/` pour les images historiques. Les sponsors sont des images locales (`src/assets/sponsor/`) affichées par `SupportSection`.

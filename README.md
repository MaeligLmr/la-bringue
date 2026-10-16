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
  - [Design system](#design-system)
  - [Démarrage](#démarrage)
  - [Variables d'environnement](#variables-denvironnement)
  - [Tests](#tests)
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
| Notifications | [vue-sonner](https://vue-sonner.vercel.app/) (toasts, ex. « Ajouté à Mon programme ») |
| Tests | [Vitest](https://vitest.dev/) + Vue Test Utils + happy-dom |
| Déploiement | Build statique dans `docs/` (GitHub Pages, `base: '/la-bringue/'`) |

Le contenu du site (programmation, exposants, conférences, formules, infos pratiques, actualités…) et les likes sont lus dans Supabase — voir [Structure du contenu](#structure-du-contenu). Les images des artistes vivent dans `public/programmation/`.

---

## Architecture du code

```
src/
├── assets/
│   ├── icons/                               # SVG exportés de Figma, lazy-loadés par <Icon>
│   └── card/, carrousel-tile/, conferenciere/, footer/, hero/, loader/, logo/, scenes/, sponsor/  # images/illustrations
├── components/
│   ├── ui/
│   │   ├── Icon.vue, Button.vue, Select.vue, Tag.vue
│   │   ├── Like.vue                         # <Like v-model=... label=... />
│   │   ├── ContentCard.vue                  # carte partagée des listes
│   │   ├── FilterableList.vue               # recherche + filtres + slot #item
│   │   ├── Carousel.vue, CarouselTile.vue   # carrousels d'accès rapide de la Home
│   │   ├── Loader.vue                       # étoile du logo animée, suit le thème
│   │   └── PasswordInput.vue                # champ mot de passe avec afficher/masquer
│   ├── layout/
│   │   ├── Navbar.vue, Footer.vue, Hero.vue
│   │   ├── Modal.vue                        # <Modal :open=... title=... @close=...> générique
│   │   ├── Drawer.vue                       # panneau latéral (menu burger), focus piégé
│   │   └── SupportSection.vue               # « Ils nous soutiennent » (sponsors), masquable par route
│   ├── home/
│   │   ├── ProgrammationSection.vue         # programmation par jour sur la Home
│   │   └── ProgrammationDay.vue             # un jour : headliner + line-up
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
│   └── AProposView, ActualitesView, BilletterieView, InfosPratiquesView
├── router/
│   └── index.ts                             # routes, scroll en haut de page, meta `hideSupport`
├── handlers/                                # accès Supabase, un handler par table
│   ├── crud.ts                              # createCrudHandler (getAll/getById/create/update/delete), HandlerError, unwrap
│   ├── actualite, artiste, concert, concert-artiste, conference, conferenciere,
│   │   exposant, formule, info-pratique, like, participation, promotion, scene
│   └── index.ts                             # point d'entrée unique
├── composables/
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
│   ├── auth-validation.ts                   # validation des champs email/mot de passe
│   ├── auth-errors.ts                       # traduction des erreurs Supabase Auth en messages FR
│   ├── with-timeout.ts                      # détection d'un Supabase injoignable/en timeout
│   ├── cards.ts                             # données Supabase → cartes (Programmation, Conférences, Exposants)
│   ├── fiche.ts                             # construction d'une fiche + suggestions
│   ├── highlight.ts                         # splitMatches() : découpe un texte selon une recherche (sans accents ni casse), sans dépendance à Vue
│   ├── anchor.ts                            # sectionAnchor() : ancre d'une section à partir de son titre
│   └── photo.ts                             # photoUrl() : préfixe BASE_URL, URL complètes inchangées
├── supabase.js                              # client Supabase (config lue depuis .env.local)
├── App.vue
├── main.ts
└── style.css                               # importe les tokens, pont vers les variables globales
```

Chaque composant/fichier logique a ses tests co-localisés (ex. `LoginForm.test.ts` à côté de `LoginForm.vue`) — voir [Tests](#tests).

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

const { preference, resolvedTheme, setPreference, toggleTheme } = useTheme()
```

Par défaut, le thème suit la préférence de l'appareil (`prefers-color-scheme`). Un choix explicite (`setPreference('light' | 'dark' | 'system')`) est mémorisé dans `localStorage` et posé sur `<html data-theme="...">`. Le sélecteur clair/sombre/défaut de la Navbar en est la seule interface pour l'instant.

**3. Composants `ui/` : `Icon`, `Button`, `Select`, `Tag`, `Like`, `ContentCard`, `FilterableList`, `Carousel`, `Loader`, `PasswordInput` — `src/components/ui/`**

```vue
<Icon name="heart-filled" size="large" />

<Button color="primary" variant="outlined" size="medium" icon-left="search">
  Rechercher
</Button>

<Select
  v-model="theme"
  :options="[{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]"
  size="large"
/>

<Tag label="Restauration" variant="blue" />

<ContentCard
  nom="Aya Nakamura"
  :photo="photoUrl"
  scene="Chrome"
  date="Samedi - 21h"
  categorie="Pop"
  likable
  v-model:is-liked="isLiked"
  @click="goToFiche"
/>

<FilterableList :items="artistes" :filters="filtres" v-model:selected="filtresActifs">
  <template #item="{ item }">
    <ContentCard :nom="item.nom" :photo="item.photo" likable />
  </template>
</FilterableList>
```

`Icon` charge à la demande (un chunk par icône, `import.meta.glob(..., { query: '?raw' })`) les SVG exportés de Figma (`src/assets/icons/`, `fill="currentColor"` pour hériter la couleur ambiante) — rien n'est chargé pour les icônes qu'une page n'utilise pas. `Button` couvre `color` (`primary` / `secondary` / `info` / `danger`), `variant` (`full` / `outlined` / `ghost`) et `size` (`medium` / `large`) — chaque instance pointe simplement vers les tokens `--button-{color}-{variant}-{state}-*` correspondants, sans règle CSS dédiée par combinaison. `Select` est un dropdown entièrement personnalisé (pas le `<select>` natif, dont la liste d'options ne peut pas être stylée), accessible au clavier, et calé sur le même `size` que `Button` pour rester à la même hauteur quand ils sont côte à côte (ex. la Navbar). `Tag` affiche un libellé court (scène, catégorie d'exposant, thème de conférence) ; sa `variant` (`pink` par défaut / `pink-bright` / `violet` / `blue`) ne change que la couleur, via les tokens `--tag-{variant}-*`. `ContentCard` est la carte partagée des listes Programmation, Exposants et Conférences (voir Figma "card listing") : `nom` et `photo` sont obligatoires, `date`, `scene` et `categorie` (rendue en `Tag`) ne s'affichent que si elles sont renseignées — la carte n'a pas de variante par scène. `likable` (`false` par défaut, donc pour les exposants) affiche le bouton `Like` ; un clic like, un second clic retire le like, sans jamais déclencher le `onClick` de la carte (exécuté au clic ou à Entrée sur le reste de la carte). Le like est un état `isLiked` que la page lit/fixe via `v-model:is-liked` (état partagé par `useLikes`, qui affiche le toast « Ajouté à Mon programme »). Déconnectée, un clic sur le cœur ouvre la modale de connexion en mémorisant le like (`useAuthModal`) ; il est appliqué automatiquement une fois la connexion réussie. `FilterableList` est la liste partagée par ces trois pages : une recherche par nom en temps réel (insensible à la casse et aux accents), une rangée de `Button` par filtre passé dans `filters` (`{ key, label, allLabel, options }` — l'option active en `primary`, les autres en `secondary`, précédées du bouton `allLabel` qui retire le filtre, ex. "Tous les jours" ; `key` est le champ comparé sur chaque élément), sous la recherche, le tout combiné en logique ET, un bouton "Réinitialiser les filtres" et un message quand rien ne correspond. Les éléments doivent avoir au moins un `id` et un `nom` ; leur rendu est laissé à la page via le slot `#item`, et les filtres actifs sont exposés en `v-model:selected` (pour pré-appliquer un jour ou une scène depuis l'accueil). `Carousel` / `CarouselTile` forment les carrousels d'accès rapide de la Home (flèches précédent/suivant désactivées aux extrémités). `Loader` affiche l'étoile du logo en rotation avec un libellé (`label`, « Chargement… » par défaut) et suit le thème. `PasswordInput` est le champ mot de passe avec bouton afficher/masquer des formulaires d'auth.

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

## Structure du contenu

Le contenu vit dans Supabase et est lu via les handlers de `src/handlers/` (un par table, construits sur `createCrudHandler`). Les composants ne parlent jamais directement à Supabase : ils appellent un handler, qui renvoie les données ou lève une `HandlerError`.

| Handler | Données |
|---|---|
| `artisteHandler`, `concertHandler`, `concertArtisteHandler`, `sceneHandler` | Artistes, concerts (jour, horaire, scène), line-up par jour (`DayLineup`) |
| `conferenceHandler`, `conferenciereHandler` | Conférences et leurs intervenantes (`ConferenceDetail`) |
| `exposantHandler` | Stands (catégorie, horaires d'ouverture) |
| `formuleHandler`, `promotionHandler` | Billetterie : formules et promotions (`FormuleAvecPromotions`) |
| `infoPratiqueHandler` | Infos pratiques |
| `actualiteHandler` | Actualités |
| `likeHandler`, `participationHandler` | Likes de l'utilisatrice (« Mon programme », `LikeDetail`) et participations |

Les types des lignes sont dans `src/types/database/`, un fichier par table. Les photos d'artistes sont des fichiers statiques de `public/programmation/` (champ `photo` = chemin, résolu par `photoUrl()`). Les sponsors sont des images locales (`src/assets/sponsor/`) affichées par `SupportSection`.

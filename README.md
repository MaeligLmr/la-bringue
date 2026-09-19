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
/fiche/:id              Fiche détail — template unique (artiste / conférence / exposant)
/mon-programme          Mon programme (connecté uniquement)
/profil                 Profil (connecté uniquement)
/about                  About us (nos valeurs)
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
| Authentification & données utilisateur | [Supabase](https://supabase.com/) (table `users`, `likes`, `contact_messages`) |
| Contenu (programmation, exposants, conférences, billetterie, infos pratiques, actualités, about) | Fichiers JSON statiques (pas de backend pour ces données en V1) |
| Tests | [Vitest](https://vitest.dev/) |

Seules l'authentification et les likes passent par Supabase pour l'instant. Tout le reste du contenu du site est lu depuis des fichiers JSON versionnés dans le projet — voir [Structure du contenu](#structure-du-contenu).

---

## Architecture du code

```
src/
├── assets/
│   ├── icons/                               # SVG exportés de Figma, lazy-loadés par <Icon>
│   └── card/, footer/, hero/, logo/, scenes/  # autres images/illustrations exportées de Figma
├── components/
│   ├── ui/
│   │   ├── Icon.vue                         # <Icon name="..." size="small|medium|large" />
│   │   ├── Button.vue                       # <Button color=... variant=... size=... />
│   │   └── Select.vue                       # <Select v-model=... :options=... size=... />
│   ├── layout/
│   │   └── Navbar.vue
│   └── auth/
│       ├── LoginForm.vue
│       ├── SignUpForm.vue
│       └── ModaleConnexionInscription.vue  # modale portant les deux formulaires
├── composables/
│   ├── useAuthModal.ts                     # état de la modale (ouverte/fermée, vue active)
│   ├── useFocusTrap.ts                     # piège de focus clavier réutilisable
│   └── useTheme.ts                         # thème clair/sombre/système (voir Design system)
├── types/
│   ├── icon.ts, button.ts, select.ts       # noms/props valides des composants ui/ (IconName, ButtonColor, ...)
├── styles/
│   └── tokens/                             # design tokens générés depuis Figma (voir Design system)
├── lib/
│   ├── auth-validation.ts                  # validation des champs email/mot de passe
│   ├── auth-errors.ts                      # traduction des erreurs Supabase Auth en messages FR
│   └── with-timeout.ts                     # détection d'un Supabase injoignable/en timeout
├── supabase.js                             # client Supabase (config lue depuis .env.local)
├── App.vue
├── main.ts
└── style.css                               # importe les tokens, pont vers les variables globales
scripts/
└── generate-design-tokens.cjs              # régénère src/styles/tokens/ depuis un export Figma
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

**3. Composants `Icon`, `Button` et `Select` — `src/components/ui/`**

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
```

`Icon` charge à la demande (un chunk par icône, `import.meta.glob(..., { query: '?raw' })`) les SVG exportés de Figma (`src/assets/icons/`, `fill="currentColor"` pour hériter la couleur ambiante) — rien n'est chargé pour les icônes qu'une page n'utilise pas. `Button` couvre `color` (`primary` / `secondary` / `info` / `danger`), `variant` (`full` / `outlined` / `ghost`) et `size` (`medium` / `large`) — chaque instance pointe simplement vers les tokens `--button-{color}-{variant}-{state}-*` correspondants, sans règle CSS dédiée par combinaison. `Select` est un dropdown entièrement personnalisé (pas le `<select>` natif, dont la liste d'options ne peut pas être stylée), accessible au clavier, et calé sur le même `size` que `Button` pour rester à la même hauteur quand ils sont côte à côte (ex. la Navbar).

---

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` à la racine du projet, puis renseigner les vraies valeurs (Project Settings → API sur supabase.com) :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxx
```

Ces clés sont utilisées uniquement par `supabase.js` pour l'authentification et la gestion des likes. `.env.local` est ignoré par git (`*.local`) — sans lui, `supabase.js` lève une erreur au chargement et la page reste blanche.

## Tests

Les tests sont écrits avec **Vitest**.

```bash
# Lancer tous les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch
```

## Structure du contenu

Le contenu du site (hors authentification et likes) vit dans des fichiers JSON, pensés pour être facilement remplacés par une vraie API plus tard sans changer les composants qui les consomment :

```
/data
  ├── programmation.json     # artistes musicaux (nom, photo, date, scène)
  ├── exposants.json         # stands (nom, photo, catégorie, horaires d'ouverture)
  ├── conferences.json       # conférences (titre, photo, date, thème, conférenciers)
  ├── billetterie.json       # formules, tarifs, promotions, statut
  ├── infos-pratiques.json   # accès, horaires, camping, parking, cashless, PMR, règlement
  ├── about.json             # manifeste, association, éditions précédentes
  ├── actualites.json        # actualités (titre, image, résumé, date, contenu)
  └── sponsors.json          # sponsors (nom, logo, lien, niveau)
```

# La Bringue — Festival

Site web du festival **La Bringue**, organisé par l'association du même nom. Un festival de musique en plein air, pensé comme une extension du travail de l'association : offrir aux femmes un espace pour sortir, profiter et se sentir en sécurité.

---

## Sommaire

- [Le festival](#le-festival)
- [Sitemap](#sitemap)
- [Stack technique](#stack-technique)
- [Démarrage](#démarrage)
- [Variables d'environnement](#variables-denvironnement)
- [Tests](#tests)
- [Structure du contenu](#structure-du-contenu)
- [Documentation produit](#documentation-produit)

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

Créer un fichier `.env` à la racine du projet :

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxx
```

Ces clés sont utilisées uniquement par `supabase.js` pour l'authentification et la gestion des likes.

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

## Documentation produit

Le détail des epics, features, user stories et critères d'acceptation vit dans [`backlog-la-bringue.md`](./backlog-la-bringue.md). Ce README ne couvre que le contexte projet et la mise en route technique.
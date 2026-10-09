import { artisteHandler } from '../handlers/artiste'
import { concertHandler } from '../handlers/concert'
import { conferenceHandler } from '../handlers/conference'
import { exposantHandler } from '../handlers/exposant'
import type { FicheData, FicheSuggestion, FicheTag, FicheType } from '../types/ui/fiche'
import { JOURS, SCENES, type ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'
import type { ExposantCard } from '../types/ui/exposants'
import { formatHeure, labelOf, sceneValue, toArtisteCards, toConferenceCards, toExposantCards } from './cards'

// Nombre de cartes « Ça peut aussi vous intéresser ».
export const SUGGESTIONS_COUNT = 3

function ficheRoute(type: FicheType, id: number) {
  return { name: 'fiche', params: { type, id } }
}

function jourTag(page: string, jour: string): FicheTag[] {
  return jour ? [{ label: labelOf(JOURS, jour), to: { name: page, query: { date: jour } } }] : []
}

function artisteSuggestion(card: ArtisteCard): FicheSuggestion {
  return {
    id: card.idArtiste,
    nom: card.nom,
    photo: card.photo,
    scene: labelOf(SCENES, card.scene),
    date: `${labelOf(JOURS, card.date)} - ${card.heure}`,
    categorie: card.categorie,
    target: { id: card.idArtiste, type: 'artiste' },
    to: ficheRoute('artiste', card.idArtiste),
  }
}

function conferenceSuggestion(card: ConferenceCard): FicheSuggestion {
  return {
    id: card.id,
    nom: card.nom,
    photo: card.photo,
    scene: card.conferencieres,
    date: `${labelOf(JOURS, card.date)} - ${card.heure}`,
    categorie: card.theme,
    target: { id: card.id, type: 'conference' },
    to: ficheRoute('conference', card.id),
  }
}

function exposantSuggestion(card: ExposantCard): FicheSuggestion {
  return { id: card.id, nom: card.nom, photo: card.photo, categorie: card.categorie, to: ficheRoute('exposant', card.id) }
}

// Artistes de la même scène (via Supabase), une seule carte par artiste : un
// artiste peut y jouer plusieurs fois, et les featurings n'ont pas de carte.
async function artistesDeLaScene(idScene: number, id: number): Promise<FicheSuggestion[]> {
  const cards = toArtisteCards(await concertHandler.getDetailedByScene(idScene))
  return cards
    .filter((card, index) => card.idArtiste !== id && cards.findIndex((c) => c.idArtiste === card.idArtiste) === index)
    .slice(0, SUGGESTIONS_COUNT)
    .map(artisteSuggestion)
}

// Sans concert, les cartes n'ont ni date ni scène.
async function artistesDeLaCategorie(categorie: string, id: number): Promise<FicheSuggestion[]> {
  return (await artisteHandler.getByCategorie(categorie))
    .filter((artiste) => artiste.id_artiste !== id)
    .slice(0, SUGGESTIONS_COUNT)
    .map((artiste) => ({
      id: artiste.id_artiste,
      nom: artiste.nom ?? '',
      photo: artiste.photo,
      categorie: artiste.categorie ?? '',
      target: { id: artiste.id_artiste, type: 'artiste' },
      to: ficheRoute('artiste', artiste.id_artiste),
    }))
}

// Artiste : son concert (en tant qu'artiste principal de préférence) donne
// date, heure et scène ; les suggestions sont les autres artistes de la même
// scène. Un artiste sans concert (pas encore programmé) est suggéré par
// catégorie à la place.
async function loadArtiste(id: number): Promise<FicheData | null> {
  const artiste = await artisteHandler.getDetailById(id)
  if (!artiste) return null

  const liens = artiste.ConcertArtiste.filter((lien) => lien.Concert)
  const concert = (liens.find((lien) => !lien.featuring) ?? liens[0])?.Concert ?? null
  const jour = concert?.jour ?? ''
  const scene = sceneValue(concert?.Scene?.nom)

  let suggestions: FicheSuggestion[] = []
  if (concert?.id_scene) suggestions = await artistesDeLaScene(concert.id_scene, id)
  else if (artiste.categorie) suggestions = await artistesDeLaCategorie(artiste.categorie, id)

  return {
    fiche: {
      nom: artiste.nom ?? '',
      photo: artiste.photo,
      description: artiste.description,
      jour: jour || undefined,
      heure: formatHeure(concert?.heure_debut ?? null) || undefined,
      scene: scene || undefined,
      categorie: artiste.categorie ? { label: artiste.categorie } : undefined,
      tags: [
        ...jourTag('programmation', jour),
        ...(scene ? [{ label: labelOf(SCENES, scene), to: { name: 'programmation', query: { scene } } }] : []),
      ],
      likeTarget: { id, type: 'artiste' },
    },
    intervenantes: [],
    suggestions,
  }
}

// Conférence : suggestions par thème.
async function loadConference(id: number): Promise<FicheData | null> {
  const conference = await conferenceHandler.getDetailById(id)
  if (!conference) return null

  const voisines = conference.theme ? await conferenceHandler.getByTheme(conference.theme) : []
  const suggestions = toConferenceCards(voisines)
    .filter((card) => card.id !== id)
    .slice(0, SUGGESTIONS_COUNT)
    .map(conferenceSuggestion)

  return {
    fiche: {
      nom: conference.titre ?? '',
      photo: conference.photo,
      description: conference.description,
      jour: conference.jour ?? undefined,
      heure: formatHeure(conference.heure_debut) || undefined,
      categorie: conference.theme
        ? { label: conference.theme, to: { name: 'conferences', query: { theme: conference.theme } } }
        : undefined,
      tags: jourTag('conferences', conference.jour ?? ''),
      likeTarget: { id, type: 'conference' },
    },
    intervenantes: conference.Participation.flatMap(({ Conferenciere }) =>
      Conferenciere
        ? [{ id: Conferenciere.id_conferenciere, nom: Conferenciere.nom ?? '', description: Conferenciere.description }]
        : []
    ),
    suggestions,
  }
}

// Exposant : présent tous les jours, sans scène ni like ; suggestions par catégorie.
async function loadExposant(id: number): Promise<FicheData | null> {
  const exposant = await exposantHandler.getById(id)
  if (!exposant) return null

  const voisins = exposant.categorie ? await exposantHandler.getByCategorie(exposant.categorie) : []
  const suggestions = toExposantCards(voisins)
    .filter((card) => card.id !== id)
    .slice(0, SUGGESTIONS_COUNT)
    .map(exposantSuggestion)

  return {
    fiche: {
      nom: exposant.nom ?? '',
      photo: exposant.photo,
      description: exposant.description,
      categorie: exposant.categorie
        ? { label: exposant.categorie, to: { name: 'exposants', query: { categorie: exposant.categorie } } }
        : undefined,
      tags: [],
    },
    intervenantes: [],
    suggestions,
  }
}

const LOADERS: Record<FicheType, (id: number) => Promise<FicheData | null>> = {
  artiste: loadArtiste,
  conference: loadConference,
  exposant: loadExposant,
}

// Contenu d'une fiche et ses suggestions ; null si l'identifiant n'existe pas.
export function loadFiche(type: FicheType, id: number): Promise<FicheData | null> {
  return LOADERS[type](id)
}

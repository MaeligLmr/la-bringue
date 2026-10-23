import type { ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'
import type { ProgrammeItem, ProgrammeJour } from '../types/ui/mon-programme'
import { JOURS, SCENES } from '../types/ui/programmation'
import { labelOf } from './cards'

export const DATE_A_CONFIRMER = 'Date à confirmer'
export const EMPTY_MESSAGE = "Vous n'avez encore rien liké"

function fromArtiste(card: ArtisteCard): ProgrammeItem & { jour: string } {
  return {
    key: `artiste-${card.id}`,
    target: { id: card.idArtiste, type: 'artiste' },
    nom: card.nom,
    photo: card.photo,
    heure: card.heure,
    lieu: labelOf(SCENES, card.scene),
    categorie: card.categorie,
    jour: card.date,
  }
}

function fromConference(card: ConferenceCard): ProgrammeItem & { jour: string } {
  return {
    key: `conference-${card.id}`,
    target: { id: card.id, type: 'conference' },
    nom: card.nom,
    photo: card.photo,
    heure: card.heure,
    lieu: card.conferencieres,
    categorie: card.theme,
    jour: card.date,
  }
}

// Regroupe artistes et conférences par jour (dans l'ordre du festival), puis
// par horaire. Les jours sans contenu sont omis, les dates inconnues en dernier.
export function groupProgrammeByJour(artistes: ArtisteCard[], conferences: ConferenceCard[]): ProgrammeJour[] {
  const byJour = new Map<string, ProgrammeItem[]>()
  for (const { jour, ...item } of [...artistes.map(fromArtiste), ...conferences.map(fromConference)]) {
    byJour.set(jour, [...(byJour.get(jour) ?? []), item])
  }

  const ordre = (jour: string) => {
    const index = JOURS.findIndex((option) => option.value === jour)
    return index === -1 ? JOURS.length : index
  }

  return [...byJour.entries()]
    .sort(([a], [b]) => ordre(a) - ordre(b) || a.localeCompare(b))
    .map(([jour, items]) => ({
      jour,
      label: jour ? labelOf(JOURS, jour) : DATE_A_CONFIRMER,
      // "HHhMM" : l'ordre alphabétique est aussi l'ordre chronologique.
      // Sans horaire, le contenu passe en fin de journée.
      items: items.sort((a, b) => Number(!a.heure) - Number(!b.heure) || a.heure.localeCompare(b.heure)),
    }))
}

import type { ConcertDetail } from '../handlers/concert'
import type { ConferenceDetail } from '../handlers/conference'
import type { Exposant } from '../types/database/exposant'
import type { SelectOption } from '../types/ui/select'
import type { ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'
import type { ExposantCard } from '../types/ui/exposants'

// Mise en forme des données Supabase en cartes, partagée par les pages liste
// (Programmation, Conférences, Exposants) et les suggestions des fiches.

// "Chrome" ou "2000’" en base → "chrome" / "2000", les `value` de SCENES.
export function sceneValue(nom: string | null | undefined) {
  return (nom ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// "22:15:00" → "22h15"
export function formatHeure(heure: string | null) {
  return heure ? heure.slice(0, 5).replace(':', 'h') : ''
}

export function labelOf(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

// Une carte par artiste principal : les featurings ne figurent pas à l'affiche.
export function toArtisteCards(concerts: ConcertDetail[]): ArtisteCard[] {
  return concerts.flatMap((concert) =>
    concert.ConcertArtiste.flatMap(({ featuring, Artiste: artiste }) =>
      featuring || !artiste
        ? []
        : [
            {
              id: `${concert.id_concert}-${artiste.id_artiste}`,
              idArtiste: artiste.id_artiste,
              nom: artiste.nom ?? '',
              photo: artiste.photo,
              date: concert.jour ?? '',
              heure: formatHeure(concert.heure_debut),
              scene: sceneValue(concert.Scene?.nom),
              categorie: artiste.categorie ?? '',
            },
          ]
    )
  )
}

export function toConferenceCards(conferences: ConferenceDetail[]): ConferenceCard[] {
  return conferences.map((conference) => ({
    id: conference.id_conference,
    nom: conference.titre ?? '',
    photo: conference.photo,
    date: conference.jour ?? '',
    heure: formatHeure(conference.heure_debut),
    conferencieres: conference.Participation.flatMap(({ Conferenciere }) =>
      Conferenciere?.nom ? [Conferenciere.nom] : []
    ).join(', '),
    theme: conference.theme ?? '',
  }))
}

export function toExposantCards(exposants: Exposant[]): ExposantCard[] {
  return exposants.map((exposant) => ({
    id: exposant.id_exposant,
    nom: exposant.nom ?? '',
    photo: exposant.photo,
    categorie: exposant.categorie ?? '',
  }))
}

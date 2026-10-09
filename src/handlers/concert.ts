import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import type { Scene } from '../types/database/scene'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Concert'

// Scène dont le dernier concert du jour fait office de tête d'affiche.
const HEADLINER_SCENE = 'chrome'

export interface ConcertDetail extends Concert {
  Scene: Scene | null
  ConcertArtiste: (ConcertArtiste & { Artiste: Artiste | null })[]
}

// Concert + sa scène + ses artistes, en une seule requête via les clés étrangères.
const DETAIL_SELECT = '*, Scene(*), ConcertArtiste(*, Artiste(*))'

export interface DayLineup {
  headliner?: Artiste
  others: Artiste[]
}

// Artistes principaux d'un concert : les featurings ne figurent pas à l'affiche.
function mainArtistes(concert: ConcertDetail): Artiste[] {
  return concert.ConcertArtiste.filter((lien) => !lien.featuring).flatMap((lien) => (lien.Artiste ? [lien.Artiste] : []))
}

export const concertHandler = {
  ...createCrudHandler<Concert, 'id_concert'>(TABLE, 'id_concert'),

  async getAllDetailed(): Promise<ConcertDetail[]> {
    return unwrap<ConcertDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).order('jour').order('heure_debut')
    )
  },

  async getDetailById(id: number): Promise<ConcertDetail | null> {
    return unwrap<ConcertDetail | null>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('id_concert', id).maybeSingle()
    )
  },

  // `jour` au format ISO "YYYY-MM-DD".
  async getByJour(jour: string): Promise<ConcertDetail[]> {
    return unwrap<ConcertDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('jour', jour).order('heure_debut')
    )
  },

  async getByScene(idScene: number): Promise<Concert[]> {
    return unwrap<Concert[]>(
      TABLE,
      await supabase.from(TABLE).select('*').eq('id_scene', idScene).order('jour').order('heure_debut')
    )
  },

  async getDetailedByScene(idScene: number): Promise<ConcertDetail[]> {
    return unwrap<ConcertDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('id_scene', idScene).order('jour').order('heure_debut')
    )
  },
  // Affiche d'un jour pour la home (même principe que rockenseine.com) : la
  // tête d'affiche est le dernier concert de la scène Chrome, suivie des
  // `count` autres artistes les plus tardifs du jour. Un seul appel Supabase
  // filtre les concerts du jour et les récupère déjà triés du plus tardif au
  // plus tôt, avec leur scène et leurs artistes.
  async getDayLineup(jour: string, count = 4): Promise<DayLineup> {
    const concerts = unwrap<ConcertDetail[]>(
      TABLE,
      await supabase
        .from(TABLE)
        .select(DETAIL_SELECT)
        .eq('jour', jour)
        .order('heure_debut', { ascending: false, nullsFirst: false })
    )

    const headlinerConcert = concerts.find((concert) => concert.Scene?.nom?.toLowerCase() === HEADLINER_SCENE)
    const headliner = headlinerConcert ? mainArtistes(headlinerConcert)[0] : undefined
    const others = concerts
      .flatMap(mainArtistes)
      .filter((artiste) => artiste.id_artiste !== headliner?.id_artiste)
      .slice(0, count)

    return { headliner, others }
  },
}

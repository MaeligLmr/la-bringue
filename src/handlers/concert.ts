import { supabase } from '../supabase.js'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import type { Scene } from '../types/database/scene'
import type { ArtisteNom, ArtisteResume } from './artiste'
import { containsPattern, createCrudHandler, pageRange, PAGE_SIZE, toPage, unwrap, type Page } from './crud'

const TABLE = 'Concert'

// Scène dont le dernier concert du jour fait office de tête d'affiche.
const HEADLINER_SCENE = 'chrome'

export interface ConcertDetail extends Concert {
  Scene: Scene | null
  ConcertArtiste: (ConcertArtiste & { Artiste: ArtisteResume | null })[]
}

// Concert + sa scène + ses artistes, en une seule requête via les clés étrangères.
const DETAIL_SELECT = 'id_concert, id_scene, jour, heure_debut, heure_fin, Scene(id_scene, nom), ConcertArtiste(id_artiste, id_concert, artiste_annonce, featuring, Artiste(id_artiste, nom, photo, categorie))'

// Affiche de la home : seuls la scène et les noms d'artistes sont utiles.
const LINEUP_SELECT = 'Scene(nom), ConcertArtiste(featuring, Artiste(id_artiste, nom))'

export interface DayLineup {
  headliner?: ArtisteNom
  others: ArtisteNom[]
}

export interface LineupConcert {
  Scene: Pick<Scene, 'nom'> | null
  ConcertArtiste: (Pick<ConcertArtiste, 'featuring'> & { Artiste: ArtisteNom | null })[]
}

// Artistes principaux d'un concert : les featurings ne figurent pas à l'affiche.
function mainArtistes(concert: LineupConcert): ArtisteNom[] {
  return concert.ConcertArtiste.filter((lien) => !lien.featuring).flatMap((lien) => (lien.Artiste ? [lien.Artiste] : []))
}

export const concertHandler = {
  ...createCrudHandler<Concert, 'id_concert'>(TABLE, 'id_concert', 'id_concert, id_scene, jour, heure_debut, heure_fin'),

  // Concerts où joue au moins un des artistes donnés (Mon programme). !inner
  // exclut les autres concerts et ne garde dans chacun que ces artistes.
  async getByArtistes(idsArtistes: number[]): Promise<ConcertDetail[]> {
    if (idsArtistes.length === 0) return []
    const columns = DETAIL_SELECT.replace('ConcertArtiste(', 'ConcertArtiste!inner(')
    return unwrap<ConcertDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(columns).in('ConcertArtiste.id_artiste', idsArtistes).order('jour').order('heure_debut')
    )
  },

  async getAllDetailed(): Promise<ConcertDetail[]> {
    return unwrap<ConcertDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).order('jour').order('heure_debut')
    )
  },

  // Une page de la programmation (page Programmation), par jour puis heure : la
  // page compte des concerts, chacun avec ses artistes. `jour` (ISO
  // "YYYY-MM-DD") filtre sur la colonne, `scene` sur le début du nom de la
  // scène (« chrome », « soft »...), `search` sur le nom des artistes — dans ce
  // cas seuls les artistes qui correspondent restent dans chaque concert.
  async getPage({
    offset,
    search = '',
    jour = '',
    scene = '',
    pageSize = PAGE_SIZE,
  }: {
    offset: number
    search?: string
    jour?: string
    scene?: string
    pageSize?: number
  }): Promise<Page<ConcertDetail>> {
    // !inner : un concert sans scène ou sans artiste correspondant est exclu,
    // au lieu d'être renvoyé avec une jointure vide.
    let columns = DETAIL_SELECT
    if (scene) columns = columns.replace('Scene(', 'Scene!inner(')
    if (search.trim()) columns = columns.replace('ConcertArtiste(', 'ConcertArtiste!inner(').replace('Artiste(', 'Artiste!inner(')

    let query = supabase.from(TABLE).select(columns)
    if (jour) query = query.eq('jour', jour)
    if (scene) query = query.ilike('Scene.nom', `${scene}%`)
    if (search.trim()) query = query.ilike('ConcertArtiste.Artiste.nom', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('jour').order('heure_debut').order('id_concert').range(...pageRange(offset, pageSize))
    return toPage(unwrap<ConcertDetail[]>(TABLE, await query), pageSize)
  },

  // `limit` : les suggestions n'ont besoin que de quelques concerts.
  async getDetailedByScene(idScene: number, limit?: number): Promise<ConcertDetail[]> {
    let query = supabase.from(TABLE).select(DETAIL_SELECT).eq('id_scene', idScene).order('jour').order('heure_debut')
    if (limit) query = query.limit(limit)
    return unwrap<ConcertDetail[]>(TABLE, await query)
  },
  // Affiche d'un jour pour la home (même principe que rockenseine.com) : la
  // tête d'affiche est le dernier concert de la scène Chrome, suivie des
  // `count` autres artistes les plus tardifs du jour. Un seul appel Supabase
  // filtre les concerts du jour et les récupère déjà triés du plus tardif au
  // plus tôt, avec leur scène et leurs artistes.
  async getDayLineup(jour: string, count = 4): Promise<DayLineup> {
    const concerts = unwrap<LineupConcert[]>(
      TABLE,
      await supabase
        .from(TABLE)
        .select(LINEUP_SELECT)
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

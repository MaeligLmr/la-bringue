import { supabase } from '../supabase.js'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import type { ArtisteResume } from './artiste'
import { unwrap } from './crud'

const TABLE = 'ConcertArtiste'

type ConcertArtisteValues = Partial<Pick<ConcertArtiste, 'artiste_annonce' | 'featuring'>>

// Table de liaison à clé primaire composite (id_artiste, id_concert) : pas de
// createCrudHandler, chaque opération cible le couple d'identifiants.
export const concertArtisteHandler = {
  async getAll(): Promise<ConcertArtiste[]> {
    return unwrap<ConcertArtiste[]>(TABLE, await supabase.from(TABLE).select('id_artiste, id_concert, artiste_annonce, featuring'))
  },

  async getArtistesByConcert(idConcert: number): Promise<(ConcertArtiste & { Artiste: ArtisteResume | null })[]> {
    return unwrap(
      TABLE,
      await supabase
        .from(TABLE)
        .select('id_artiste, id_concert, artiste_annonce, featuring, Artiste(id_artiste, nom, photo, categorie)')
        .eq('id_concert', idConcert)
    )
  },

  async getConcertsByArtiste(idArtiste: number): Promise<(ConcertArtiste & { Concert: Concert | null })[]> {
    return unwrap(
      TABLE,
      await supabase
        .from(TABLE)
        .select('id_artiste, id_concert, artiste_annonce, featuring, Concert(id_concert, id_scene, jour, heure_debut, heure_fin)')
        .eq('id_artiste', idArtiste)
    )
  },

  async create(idArtiste: number, idConcert: number, values: ConcertArtisteValues = {}): Promise<ConcertArtiste> {
    return unwrap<ConcertArtiste>(
      TABLE,
      await supabase
        .from(TABLE)
        .insert({ id_artiste: idArtiste, id_concert: idConcert, ...values })
        .select('id_artiste, id_concert, artiste_annonce, featuring')
        .single()
    )
  },

  async update(idArtiste: number, idConcert: number, values: ConcertArtisteValues): Promise<ConcertArtiste> {
    return unwrap<ConcertArtiste>(
      TABLE,
      await supabase
        .from(TABLE)
        .update(values)
        .eq('id_artiste', idArtiste)
        .eq('id_concert', idConcert)
        .select('id_artiste, id_concert, artiste_annonce, featuring')
        .single()
    )
  },

  async remove(idArtiste: number, idConcert: number): Promise<void> {
    unwrap(TABLE, await supabase.from(TABLE).delete().eq('id_artiste', idArtiste).eq('id_concert', idConcert))
  },
}

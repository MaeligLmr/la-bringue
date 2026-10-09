import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import { unwrap } from './crud'

const TABLE = 'ConcertArtiste'

type ConcertArtisteValues = Partial<Pick<ConcertArtiste, 'artiste_annonce' | 'featuring'>>

// Table de liaison à clé primaire composite (id_artiste, id_concert) : pas de
// createCrudHandler, chaque opération cible le couple d'identifiants.
export const concertArtisteHandler = {
  async getAll(): Promise<ConcertArtiste[]> {
    return unwrap<ConcertArtiste[]>(TABLE, await supabase.from(TABLE).select('*'))
  },

  async getArtistesByConcert(idConcert: number): Promise<(ConcertArtiste & { Artiste: Artiste | null })[]> {
    return unwrap(TABLE, await supabase.from(TABLE).select('*, Artiste(*)').eq('id_concert', idConcert))
  },

  async getConcertsByArtiste(idArtiste: number): Promise<(ConcertArtiste & { Concert: Concert | null })[]> {
    return unwrap(TABLE, await supabase.from(TABLE).select('*, Concert(*)').eq('id_artiste', idArtiste))
  },

  async create(idArtiste: number, idConcert: number, values: ConcertArtisteValues = {}): Promise<ConcertArtiste> {
    return unwrap<ConcertArtiste>(
      TABLE,
      await supabase
        .from(TABLE)
        .insert({ id_artiste: idArtiste, id_concert: idConcert, ...values })
        .select()
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
        .select()
        .single()
    )
  },

  async remove(idArtiste: number, idConcert: number): Promise<void> {
    unwrap(TABLE, await supabase.from(TABLE).delete().eq('id_artiste', idArtiste).eq('id_concert', idConcert))
  },
}

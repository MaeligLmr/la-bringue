import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import type { Conference } from '../types/database/conference'
import type { Like } from '../types/database/like'
import { unwrap } from './crud'

const TABLE = 'Like'

export interface LikeDetail extends Like {
  Artiste: Artiste | null
  Conference: Conference | null
}

// id_utilisatrice vaut auth.uid() par défaut côté base : on ne l'envoie jamais
// à l'insertion, la RLS garantit qu'on ne like que pour soi-même.
export const likeHandler = {
  async getByUtilisatrice(idUtilisatrice: string): Promise<LikeDetail[]> {
    return unwrap<LikeDetail[]>(
      TABLE,
      await supabase
        .from(TABLE)
        .select('*, Artiste(*), Conference(*)')
        .eq('id_utilisatrice', idUtilisatrice)
        .order('created_at', { ascending: false })
    )
  },

  async likeArtiste(idArtiste: number): Promise<Like> {
    return unwrap<Like>(TABLE, await supabase.from(TABLE).insert({ id_artiste: idArtiste }).select().single())
  },

  async likeConference(idConference: number): Promise<Like> {
    return unwrap<Like>(TABLE, await supabase.from(TABLE).insert({ id_conference: idConference }).select().single())
  },

  async unlikeArtiste(idUtilisatrice: string, idArtiste: number): Promise<void> {
    unwrap(
      TABLE,
      await supabase.from(TABLE).delete().eq('id_utilisatrice', idUtilisatrice).eq('id_artiste', idArtiste)
    )
  },

  async unlikeConference(idUtilisatrice: string, idConference: number): Promise<void> {
    unwrap(
      TABLE,
      await supabase.from(TABLE).delete().eq('id_utilisatrice', idUtilisatrice).eq('id_conference', idConference)
    )
  },

  async remove(idLike: number): Promise<void> {
    unwrap(TABLE, await supabase.from(TABLE).delete().eq('id_like', idLike))
  },

  async countByArtiste(idArtiste: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('id_artiste', idArtiste)
    unwrap(TABLE, { data: null, error })
    return count ?? 0
  },

  async countByConference(idConference: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('id_conference', idConference)
    unwrap(TABLE, { data: null, error })
    return count ?? 0
  },
}

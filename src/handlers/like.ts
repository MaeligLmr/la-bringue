import { supabase } from '../supabase.js'
import type { Like } from '../types/database/like'
import type { LikeTarget } from '../types/ui/like'
import type { ArtisteResume } from './artiste'
import type { ConferenceResume } from './conference'
import { unwrap } from './crud'

const TABLE = 'Like'

export interface LikeDetail extends Like {
  Artiste: ArtisteResume | null
  Conference: ConferenceResume | null
}

// Les écritures et la lecture des likes de l'utilisatrice connectée passent
// par les fonctions Postgres set_like / get_my_likes : elles utilisent
// auth.uid() côté base, on n'envoie donc jamais l'id de l'utilisatrice.
export const likeHandler = {
  async getByUtilisatrice(idUtilisatrice: string): Promise<LikeDetail[]> {
    return unwrap<LikeDetail[]>(
      TABLE,
      await supabase
        .from(TABLE)
        .select('id_like, id_utilisatrice, id_conference, id_artiste, Artiste(id_artiste, nom, photo, categorie), Conference(id_conference, titre, photo, theme, jour, heure_debut, heure_fin)')
        .eq('id_utilisatrice', idUtilisatrice)
        .order('created_at', { ascending: false })
    )
  },

  async getMine(): Promise<LikeTarget[]> {
    const targets = unwrap<unknown>('get_my_likes', await supabase.rpc('get_my_likes'))
    // Une fonction mal déclarée en base (retour void par exemple) renvoie null :
    // on le signale plutôt que de faire croire que l'utilisatrice n'a aucun like.
    if (!Array.isArray(targets)) {
      throw new Error(`[get_my_likes] réponse inattendue : ${JSON.stringify(targets)}, la fonction doit renvoyer jsonb`)
    }
    return targets as LikeTarget[]
  },

  async setLike(target: LikeTarget, liked: boolean): Promise<void> {
    unwrap(
      'set_like',
      await supabase.rpc('set_like', { p_type: target.type, p_id: target.id, p_liked: liked })
    )
  },

  async countByArtiste(idArtiste: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id_like', { count: 'exact', head: true })
      .eq('id_artiste', idArtiste)
    unwrap(TABLE, { data: null, error })
    return count ?? 0
  },

  async countByConference(idConference: number): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id_like', { count: 'exact', head: true })
      .eq('id_conference', idConference)
    unwrap(TABLE, { data: null, error })
    return count ?? 0
  },
}

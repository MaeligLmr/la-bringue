import { supabase } from '../supabase.js'
import type { LikeTarget } from '../types/ui/like'
import { HandlerError, unwrap } from './crud'

const TABLE = 'Like'

// Les écritures et la lecture des likes de l'utilisatrice connectée passent
// par les fonctions Postgres set_like / get_my_likes : elles utilisent
// auth.uid() côté base, on n'envoie donc jamais l'id de l'utilisatrice.
export const likeHandler = {
  async getMine(): Promise<LikeTarget[]> {
    const targets = unwrap<unknown>('get_my_likes', await supabase.rpc('get_my_likes'))
    // Une fonction mal déclarée en base (retour void par exemple) renvoie null :
    // on le signale plutôt que de faire croire que l'utilisatrice n'a aucun like.
    if (!Array.isArray(targets)) {
      throw new Error(`[get_my_likes] réponse inattendue : ${JSON.stringify(targets)}, la fonction doit renvoyer jsonb`)
    }
    return targets as LikeTarget[]
  },

  // Nombre de personnes ayant liké un artiste ou une conférence (impact
  // affiché avant une suppression dans le back office). head : on ne
  // récupère que le total, pas les lignes.
  async countFor(target: LikeTarget): Promise<number> {
    const column = target.type === 'artiste' ? 'id_artiste' : 'id_conference'
    const { count, error } = await supabase
      .from(TABLE)
      .select('id_like', { count: 'exact', head: true })
      .eq(column, target.id)
    if (error) throw new HandlerError(TABLE, error)
    return count ?? 0
  },

  async setLike(target: LikeTarget, liked: boolean): Promise<void> {
    unwrap(
      'set_like',
      await supabase.rpc('set_like', { p_type: target.type, p_id: target.id, p_liked: liked })
    )
  },
}

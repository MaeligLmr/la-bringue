import { supabase } from '../supabase.js'
import type { Promotion } from '../types/database/promotion'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Promotion'

export const promotionHandler = {
  ...createCrudHandler<Promotion, 'id_promotion'>(TABLE, 'id_promotion'),

  async getByFormule(idFormule: number): Promise<Promotion[]> {
    return unwrap<Promotion[]>(TABLE, await supabase.from(TABLE).select('*').eq('id_formule', idFormule))
  },

  // Promotions en cours à l'instant `now` (date_debut <= now <= date_fin).
  // Les colonnes sont en `timestamp without time zone` : on compare en ISO sans fuseau.
  async getActives(now: Date = new Date()): Promise<Promotion[]> {
    const iso = now.toISOString().slice(0, 19)
    return unwrap<Promotion[]>(
      TABLE,
      await supabase.from(TABLE).select('*').lte('date_debut', iso).gte('date_fin', iso)
    )
  },
}

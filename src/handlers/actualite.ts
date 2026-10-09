import { supabase } from '../supabase.js'
import type { Actualite } from '../types/database/actualite'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Actualite'

export const actualiteHandler = {
  ...createCrudHandler<Actualite, 'id_actualite'>(TABLE, 'id_actualite'),

  // Les plus récentes d'abord ; `limit` pour les blocs « dernières actus ».
  async getLatest(limit?: number): Promise<Actualite[]> {
    let query = supabase.from(TABLE).select('*').order('date_publication', { ascending: false })
    if (limit) query = query.limit(limit)
    return unwrap<Actualite[]>(TABLE, await query)
  },
}

import { supabase } from '../supabase.js'
import type { Exposant } from '../types/database/exposant'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Exposant'

export const exposantHandler = {
  ...createCrudHandler<Exposant, 'id_exposant'>(TABLE, 'id_exposant'),

  async getByCategorie(categorie: string): Promise<Exposant[]> {
    return unwrap<Exposant[]>(TABLE, await supabase.from(TABLE).select('*').eq('categorie', categorie).order('nom'))
  },
}

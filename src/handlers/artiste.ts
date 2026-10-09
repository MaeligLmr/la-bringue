import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Artiste'

export const artisteHandler = {
  ...createCrudHandler<Artiste, 'id_artiste'>(TABLE, 'id_artiste'),

  async getByCategorie(categorie: string): Promise<Artiste[]> {
    return unwrap<Artiste[]>(TABLE, await supabase.from(TABLE).select('*').eq('categorie', categorie).order('nom'))
  },
}

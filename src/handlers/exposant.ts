import { supabase } from '../supabase.js'
import type { Exposant } from '../types/database/exposant'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Exposant'

export const exposantHandler = {
  ...createCrudHandler<Exposant, 'id_exposant'>(TABLE, 'id_exposant'),

  // Tous les exposants, par ordre alphabétique (page Exposants).
  async getAllByNom(): Promise<Exposant[]> {
    return unwrap<Exposant[]>(TABLE, await supabase.from(TABLE).select('*').order('nom'))
  },

  // Valeurs de l'enum `categories_exposants`, via la fonction SQL
  // supabase/get_categories_exposants.sql (PostgREST n'expose pas les enums).
  async getCategories(): Promise<string[]> {
    return unwrap<string[]>(TABLE, await supabase.rpc('get_categories_exposants'))
  },

  async getByCategorie(categorie: string): Promise<Exposant[]> {
    return unwrap<Exposant[]>(TABLE, await supabase.from(TABLE).select('*').eq('categorie', categorie).order('nom'))
  },
}

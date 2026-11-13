import { supabase } from '../supabase.js'
import type { Exposant } from '../types/database/exposant'
import { containsPattern, createCrudHandler, pageRange, toPage, unwrap, type Page } from './crud'

const TABLE = 'Exposant'
export type ExposantResume = Pick<Exposant, 'id_exposant' | 'nom' | 'photo' | 'categorie'>

export const exposantHandler = {
  ...createCrudHandler<Exposant, 'id_exposant'>(TABLE, 'id_exposant', 'id_exposant, nom, photo, categorie, description'),

  // Une page de la liste (page Exposants), par ordre alphabétique ; `search`
  // filtre sur le nom, `categorie` sur la catégorie.
  async getPage({
    offset,
    search = '',
    categorie = '',
  }: {
    offset: number
    search?: string
    categorie?: string
  }): Promise<Page<ExposantResume>> {
    let query = supabase.from(TABLE).select('id_exposant, nom, photo, categorie')
    if (categorie) query = query.eq('categorie', categorie)
    if (search.trim()) query = query.ilike('nom', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('nom').order('id_exposant').range(...pageRange(offset))
    return toPage(unwrap<ExposantResume[]>(TABLE, await query))
  },

  async getCategories(): Promise<string[]> {
    return unwrap<string[]>(TABLE, await supabase.rpc('get_categories_exposants'))
  },

  // `limit` : les suggestions n'ont besoin que de quelques exposants.
  async getByCategorie(categorie: string, limit?: number): Promise<ExposantResume[]> {
    let query = supabase.from(TABLE).select('id_exposant, nom, photo, categorie').eq('categorie', categorie).order('nom')
    if (limit) query = query.limit(limit)
    return unwrap<ExposantResume[]>(TABLE, await query)
  },
}

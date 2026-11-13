import { supabase } from '../supabase.js'
import type { Exposant } from '../types/database/exposant'
import { containsPattern, createCrudHandler, pageRange, PAGE_SIZE, toPage, unwrap, type Page } from './crud'

const TABLE = 'Exposant'
export type ExposantResume = Pick<Exposant, 'id_exposant' | 'nom' | 'photo' | 'categorie'>

export const exposantHandler = {
  ...createCrudHandler<Exposant, 'id_exposant'>(TABLE, 'id_exposant', 'id_exposant, nom, photo, categorie, description'),

  // Tous les exposants, par ordre alphabétique.
  async getAllByNom(): Promise<ExposantResume[]> {
    return unwrap<ExposantResume[]>(TABLE, await supabase.from(TABLE).select('id_exposant, nom, photo, categorie').order('nom'))
  },

  // Une page de la liste (page Exposants), par ordre alphabétique ; `search`
  // filtre sur le nom, `categorie` sur la catégorie.
  async getPage({
    offset,
    search = '',
    categorie = '',
    pageSize = PAGE_SIZE,
  }: {
    offset: number
    search?: string
    categorie?: string
    pageSize?: number
  }): Promise<Page<ExposantResume>> {
    let query = supabase.from(TABLE).select('id_exposant, nom, photo, categorie')
    if (categorie) query = query.eq('categorie', categorie)
    if (search.trim()) query = query.ilike('nom', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('nom').order('id_exposant').range(...pageRange(offset, pageSize))
    return toPage(unwrap<ExposantResume[]>(TABLE, await query), pageSize)
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

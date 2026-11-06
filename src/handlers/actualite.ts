import { supabase } from '../supabase.js'
import type { Actualite } from '../types/database/actualite'
import { containsPattern, createCrudHandler, pageRange, toPage, unwrap, type Page } from './crud'

const TABLE = 'Actualite'

export const actualiteHandler = {
  ...createCrudHandler<Actualite, 'id_actualite'>(TABLE, 'id_actualite', 'id_actualite, titre, description, date_publication, photo'),

  // Les plus récentes d'abord ; `limit` pour les blocs « dernières actus ».
  async getLatest(limit?: number): Promise<Actualite[]> {
    let query = supabase.from(TABLE).select('id_actualite, titre, description, date_publication, photo').order('date_publication', { ascending: false })
    if (limit) query = query.limit(limit)
    return unwrap<Actualite[]>(TABLE, await query)
  },

  // Une page de la liste, les plus récentes d'abord ; `search` filtre sur le titre.
  async getPage({ offset, search = '' }: { offset: number; search?: string }): Promise<Page<Actualite>> {
    let query = supabase.from(TABLE).select('id_actualite, titre, description, date_publication, photo')
    if (search.trim()) query = query.ilike('titre', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query
      .order('date_publication', { ascending: false })
      .order('id_actualite', { ascending: false })
      .range(...pageRange(offset))
    return toPage(unwrap<Actualite[]>(TABLE, await query))
  },
}

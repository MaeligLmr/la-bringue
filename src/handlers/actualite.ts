import { supabase } from '../supabase.js'
import type { Actualite } from '../types/database/actualite'
import { containsPattern, createCrudHandler, pageRange, PAGE_SIZE, toPage, unwrap, type Page } from './crud'

const TABLE = 'Actualite'
const COLUMNS = 'id_actualite, titre, description, date_publication, photo'

// Date de publication atteinte (une date nulle ne l'est jamais). Même règle que
// isPublished (lib/publication) et que la policy RLS de la table.
const now = () => new Date().toISOString()

export const actualiteHandler = {
  ...createCrudHandler<Actualite, 'id_actualite'>(TABLE, 'id_actualite', COLUMNS),

  // Les plus récentes d'abord, publiées seulement ; `limit` pour les blocs « dernières actus ».
  async getLatest(limit?: number): Promise<Actualite[]> {
    let query = supabase.from(TABLE).select(COLUMNS).lte('date_publication', now()).order('date_publication', { ascending: false })
    if (limit) query = query.limit(limit)
    return unwrap<Actualite[]>(TABLE, await query)
  },

  // Une actualité visible du public : null si elle n'existe pas ou si elle est encore en attente.
  async getPublishedById(id: number): Promise<Actualite | null> {
    return unwrap<Actualite | null>(
      TABLE,
      await supabase.from(TABLE).select(COLUMNS).eq('id_actualite', id).lte('date_publication', now()).maybeSingle()
    )
  },

  // Une page de la liste, les plus récentes d'abord ; `search` filtre sur le titre.
  // Seules les actualités publiées sont lues, sauf `includeUnpublished` (back-office).
  async getPage({
    offset,
    search = '',
    pageSize = PAGE_SIZE,
    includeUnpublished = false,
  }: {
    offset: number
    search?: string
    pageSize?: number
    includeUnpublished?: boolean
  }): Promise<Page<Actualite>> {
    let query = supabase.from(TABLE).select(COLUMNS)
    if (!includeUnpublished) query = query.lte('date_publication', now())
    if (search.trim()) query = query.ilike('titre', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query
      .order('date_publication', { ascending: false })
      .order('id_actualite', { ascending: false })
      .range(...pageRange(offset, pageSize))
    return toPage(unwrap<Actualite[]>(TABLE, await query), pageSize)
  },
}

import { supabase } from '../supabase.js'
import type { Promotion } from '../types/database/promotion'
import type { Formule } from '../types/database/formule'
import { containsPattern, createCrudHandler, pageRange, PAGE_SIZE, toPage, unwrap, type Page } from './crud'

const TABLE = 'Promotion'
const COLUMNS = 'id_promotion, id_formule, description, reduction_prc, date_debut, date_fin'

// Promotion + titre de sa formule (liste du back-office).
export type PromotionAvecFormule = Promotion & { Formule: Pick<Formule, 'titre'> | null }

export const promotionHandler = {
  ...createCrudHandler<Promotion, 'id_promotion'>(TABLE, 'id_promotion', 'id_promotion, id_formule, description, reduction_prc, date_debut, date_fin'),

  // Une page de la liste (back-office), les plus récentes d'abord ; `search` filtre sur le nom.
  async getPage({ offset, search = '', pageSize = PAGE_SIZE }: { offset: number; search?: string; pageSize?: number }): Promise<Page<PromotionAvecFormule>> {
    let query = supabase.from(TABLE).select(`${COLUMNS}, Formule(titre)`)
    if (search.trim()) query = query.ilike('description', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('date_debut', { ascending: false }).order('id_promotion', { ascending: false }).range(...pageRange(offset, pageSize))
    return toPage(unwrap<PromotionAvecFormule[]>(TABLE, await query), pageSize)
  },

  async getByFormule(idFormule: number): Promise<Promotion[]> {
    return unwrap<Promotion[]>(TABLE, await supabase.from(TABLE).select('id_promotion, id_formule, description, reduction_prc, date_debut, date_fin').eq('id_formule', idFormule))
  },

  // Promotions en cours à l'instant `now` (date_debut <= now <= date_fin).
  // Les colonnes sont en `timestamp without time zone` : on compare en ISO sans fuseau.
  async getActives(now: Date = new Date()): Promise<Promotion[]> {
    const iso = now.toISOString().slice(0, 19)
    return unwrap<Promotion[]>(
      TABLE,
      await supabase.from(TABLE).select('id_promotion, id_formule, description, reduction_prc, date_debut, date_fin').lte('date_debut', iso).gte('date_fin', iso)
    )
  },
}

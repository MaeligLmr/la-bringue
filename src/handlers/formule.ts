import { supabase } from '../supabase.js'
import type { Formule } from '../types/database/formule'
import type { Promotion } from '../types/database/promotion'
import { containsPattern, createCrudHandler, pageRange, PAGE_SIZE, toPage, unwrap, type Page } from './crud'

const TABLE = 'Formule'
const COLUMNS = 'id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_total, nbr_places_restantes, homepage, nb_jours'

// Cartes de la billetterie : seules les colonnes affichées ou utilisées pour
// calculer prix, promotion et places restantes sont demandées.
const CARD_SELECT = 'id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_restantes, nb_jours, Promotion(description, reduction_prc, date_debut, date_fin)'

export type PromotionResume = Pick<Promotion, 'description' | 'reduction_prc' | 'date_debut' | 'date_fin'>

export type FormuleAvecPromotions = Pick<
  Formule,
  'id_formule' | 'titre' | 'description' | 'jour_debut' | 'jour_fin' | 'prix' | 'lien_shotgun' | 'nbr_places_restantes' | 'nb_jours'
> & { Promotion: PromotionResume[] }

export const formuleHandler = {
  ...createCrudHandler<Formule, 'id_formule'>(TABLE, 'id_formule', COLUMNS),

  // Une page de la liste (back-office), par jour de début ; `search` filtre sur le titre.
  async getPage({ offset, search = '', pageSize = PAGE_SIZE }: { offset: number; search?: string; pageSize?: number }): Promise<Page<Formule>> {
    let query = supabase.from(TABLE).select(COLUMNS)
    if (search.trim()) query = query.ilike('titre', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('jour_debut').order('id_formule').range(...pageRange(offset, pageSize))
    return toPage(unwrap<Formule[]>(TABLE, await query), pageSize)
  },

  async getAllWithPromotions(): Promise<FormuleAvecPromotions[]> {
    return unwrap<FormuleAvecPromotions[]>(TABLE, await supabase.from(TABLE).select(CARD_SELECT).order('jour_debut'))
  },
  async getAllHomepage(): Promise<FormuleAvecPromotions[]> {
    return unwrap<FormuleAvecPromotions[]>(
      TABLE,
      await supabase.from(TABLE).select(CARD_SELECT).eq('homepage', true).order('jour_debut')
    )
  }
}

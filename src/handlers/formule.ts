import { supabase } from '../supabase.js'
import type { Formule } from '../types/database/formule'
import type { Promotion } from '../types/database/promotion'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Formule'

// Cartes de la billetterie : seules les colonnes affichées ou utilisées pour
// calculer prix, promotion et places restantes sont demandées.
const CARD_SELECT = 'id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_restantes, nb_jours, Promotion(description, reduction_prc, date_debut, date_fin)'

export type PromotionResume = Pick<Promotion, 'description' | 'reduction_prc' | 'date_debut' | 'date_fin'>

export type FormuleAvecPromotions = Pick<
  Formule,
  'id_formule' | 'titre' | 'description' | 'jour_debut' | 'jour_fin' | 'prix' | 'lien_shotgun' | 'nbr_places_restantes' | 'nb_jours'
> & { Promotion: PromotionResume[] }

export const formuleHandler = {
  ...createCrudHandler<Formule, 'id_formule'>(TABLE, 'id_formule', 'id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_total, nbr_places_restantes, homepage, nb_jours'),

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

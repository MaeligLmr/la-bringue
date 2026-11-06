import { supabase } from '../supabase.js'
import type { Formule } from '../types/database/formule'
import type { Promotion } from '../types/database/promotion'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Formule'

export interface FormuleAvecPromotions extends Formule {
  Promotion: Promotion[]
}

export const formuleHandler = {
  ...createCrudHandler<Formule, 'id_formule'>(TABLE, 'id_formule', 'id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_total, nbr_places_restantes, homepage, nb_jours'),

  async getAllWithPromotions(): Promise<FormuleAvecPromotions[]> {
    return unwrap<FormuleAvecPromotions[]>(TABLE, await supabase.from(TABLE).select('id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_total, nbr_places_restantes, homepage, nb_jours, Promotion(id_promotion, id_formule, description, reduction_prc, date_debut, date_fin)').order('jour_debut'))
  },
  async getAllHomepage(): Promise<FormuleAvecPromotions[]> {
    return unwrap<FormuleAvecPromotions[]>(
      TABLE,
      await supabase.from(TABLE).select('id_formule, titre, description, jour_debut, jour_fin, prix, lien_shotgun, nbr_places_total, nbr_places_restantes, homepage, nb_jours, Promotion(id_promotion, id_formule, description, reduction_prc, date_debut, date_fin)').eq('homepage', true).order('jour_debut')
    )
  }
}

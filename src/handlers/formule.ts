import { supabase } from '../supabase.js'
import type { Formule } from '../types/database/formule'
import type { Promotion } from '../types/database/promotion'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Formule'

export interface FormuleAvecPromotions extends Formule {
  Promotion: Promotion[]
}

export const formuleHandler = {
  ...createCrudHandler<Formule, 'id_formule'>(TABLE, 'id_formule'),

  async getAllWithPromotions(): Promise<FormuleAvecPromotions[]> {
    return unwrap<FormuleAvecPromotions[]>(
      TABLE,
      await supabase.from(TABLE).select('*, Promotion(*)').order('jour_debut')
    )
  },
}

import { supabase } from '../supabase'
import type { InfoPratique } from '../types/database/info-pratique'
import { createCrudHandler } from './crud'

export const infoPratiqueHandler = {
    ...createCrudHandler<InfoPratique, 'id_info'>('InfoPratique', 'id_info'),

    getAllHomepage: async (): Promise<InfoPratique[]> => {
        const { data, error } = await supabase.from('InfoPratique').select('*').eq('homepage', true).order('id_info')
        if (error) {
            throw error
        }
        return data as InfoPratique[]
    }
}
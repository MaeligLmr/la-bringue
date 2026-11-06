import { supabase } from '../supabase'
import type { InfoPratique } from '../types/database/info-pratique'
import { createCrudHandler } from './crud'

export const infoPratiqueHandler = {
    ...createCrudHandler<InfoPratique, 'id_info'>('InfoPratique', 'id_info', 'id_info, titre, intro, points, homepage'),

    getAllHomepage: async (): Promise<InfoPratique[]> => {
        const { data, error } = await supabase.from('InfoPratique').select('id_info, titre, intro, points, homepage').eq('homepage', true).order('id_info')
        if (error) {
            throw error
        }
        return data as InfoPratique[]
    }
}

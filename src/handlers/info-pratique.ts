import type { InfoPratique } from '../types/database/info-pratique'
import { createCrudHandler } from './crud'

export const infoPratiqueHandler = createCrudHandler<InfoPratique, 'id_info'>('InfoPratique', 'id_info')

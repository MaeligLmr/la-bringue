import type { Conferenciere } from '../types/database/conferenciere'
import { createCrudHandler } from './crud'

export const conferenciereHandler = createCrudHandler<Conferenciere, 'id_conferenciere'>(
  'Conferenciere',
  'id_conferenciere'
)

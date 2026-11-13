import type { Conferenciere } from '../types/database/conferenciere'
import { createCrudHandler, createNamePage } from './crud'

const TABLE = 'Conferenciere'
const COLUMNS = 'id_conferenciere, nom, description, photo'

export const conferenciereHandler = {
  ...createCrudHandler<Conferenciere, 'id_conferenciere'>(TABLE, 'id_conferenciere', COLUMNS),

  // Une page de la liste, par nom ; `search` filtre sur le nom (back-office).
  getPage: createNamePage<Conferenciere>(TABLE, 'id_conferenciere', COLUMNS),
}

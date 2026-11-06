import { supabase } from '../supabase.js'
import type { Conference } from '../types/database/conference'
import type { Conferenciere } from '../types/database/conferenciere'
import type { Participation } from '../types/database/participation'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Participation'

export const participationHandler = {
  ...createCrudHandler<Participation, 'id_participation'>(TABLE, 'id_participation', 'id_participation, id_conferenciere, id_conference'),

  async getConferencieresByConference(
    idConference: number
  ): Promise<(Participation & { Conferenciere: Conferenciere | null })[]> {
    return unwrap(
      TABLE,
      await supabase
        .from(TABLE)
        .select('id_participation, id_conferenciere, id_conference, Conferenciere(id_conferenciere, nom, description, photo)')
        .eq('id_conference', idConference)
    )
  },

  async getConferencesByConferenciere(
    idConferenciere: number
  ): Promise<(Participation & { Conference: Conference | null })[]> {
    return unwrap(
      TABLE,
      await supabase
        .from(TABLE)
        .select('id_participation, id_conferenciere, id_conference, Conference(id_conference, titre, photo, theme, description, jour, heure_debut, heure_fin)')
        .eq('id_conferenciere', idConferenciere)
    )
  },
}

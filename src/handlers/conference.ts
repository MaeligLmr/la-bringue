import { supabase } from '../supabase.js'
import type { Conference } from '../types/database/conference'
import type { Conferenciere } from '../types/database/conferenciere'
import type { Participation } from '../types/database/participation'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Conference'

export interface ConferenceDetail extends Conference {
  Participation: (Participation & { Conferenciere: Conferenciere | null })[]
}

// Conférence + ses conférencières via la table Participation.
const DETAIL_SELECT = '*, Participation(*, Conferenciere(*))'

export const conferenceHandler = {
  ...createCrudHandler<Conference, 'id_conference'>(TABLE, 'id_conference'),

  async getAllDetailed(): Promise<ConferenceDetail[]> {
    return unwrap<ConferenceDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).order('jour').order('heure_debut')
    )
  },

  async getDetailById(id: number): Promise<ConferenceDetail | null> {
    return unwrap<ConferenceDetail | null>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('id_conference', id).maybeSingle()
    )
  },

  // `jour` au format ISO "YYYY-MM-DD".
  async getByJour(jour: string): Promise<ConferenceDetail[]> {
    return unwrap<ConferenceDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('jour', jour).order('heure_debut')
    )
  },

  // Valeurs de l'enum `themes_conferences`, via la fonction SQL
  // supabase/get_themes_conferences.sql (PostgREST n'expose pas les enums).
  async getThemes(): Promise<string[]> {
    return unwrap<string[]>(TABLE, await supabase.rpc('get_themes_conferences'))
  },

  async getByTheme(theme: string): Promise<ConferenceDetail[]> {
    return unwrap<ConferenceDetail[]>(
      TABLE,
      await supabase.from(TABLE).select(DETAIL_SELECT).eq('theme', theme).order('jour').order('heure_debut')
    )
  },
}

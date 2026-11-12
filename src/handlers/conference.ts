import { supabase } from '../supabase.js'
import type { Conference } from '../types/database/conference'
import type { Conferenciere } from '../types/database/conferenciere'
import type { Participation } from '../types/database/participation'
import { containsPattern, createCrudHandler, pageRange, toPage, unwrap, type Page } from './crud'

const TABLE = 'Conference'

// Conférence + ses conférencières via la table Participation.
const DETAIL_SELECT = 'id_conference, titre, photo, theme, description, jour, heure_debut, heure_fin, Participation(id_participation, id_conferenciere, id_conference, Conferenciere(id_conferenciere, nom, description, photo))'
// Pour les cartes : seul le nom des conférencières s'affiche.
const LIST_SELECT = 'id_conference, titre, photo, theme, jour, heure_debut, heure_fin, Participation(Conferenciere(nom))'

export interface ConferenceDetail extends Conference {
  Participation: (Participation & { Conferenciere: Conferenciere | null })[]
}

export interface ConferenceResume extends Omit<Conference, 'description' | 'created_at'> {
  Participation: { Conferenciere: Pick<Conferenciere, 'nom'> | null }[]
}

export const conferenceHandler = {
  ...createCrudHandler<Conference, 'id_conference'>(TABLE, 'id_conference', 'id_conference, titre, photo, theme, description, jour, heure_debut, heure_fin'),

  // Conférences données par identifiant (Mon programme).
  async getByIds(ids: number[]): Promise<ConferenceResume[]> {
    if (ids.length === 0) return []
    return unwrap<ConferenceResume[]>(
      TABLE,
      await supabase.from(TABLE).select(LIST_SELECT).in('id_conference', ids).order('jour').order('heure_debut')
    )
  },

  // Une page de la liste (page Conférences), par jour puis heure ; `search`
  // filtre sur le titre, `jour` (ISO "YYYY-MM-DD") et `theme` sur leur colonne.
  async getPage({
    offset,
    search = '',
    jour = '',
    theme = '',
  }: {
    offset: number
    search?: string
    jour?: string
    theme?: string
  }): Promise<Page<ConferenceResume>> {
    let query = supabase.from(TABLE).select(LIST_SELECT)
    if (jour) query = query.eq('jour', jour)
    if (theme) query = query.eq('theme', theme)
    if (search.trim()) query = query.ilike('titre', containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order('jour').order('heure_debut').order('id_conference').range(...pageRange(offset))
    return toPage(unwrap<ConferenceResume[]>(TABLE, await query))
  },

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
  async getByJour(jour: string): Promise<ConferenceResume[]> {
    return unwrap<ConferenceResume[]>(
      TABLE,
      await supabase.from(TABLE).select(LIST_SELECT).eq('jour', jour).order('heure_debut')
    )
  },

  async getThemes(): Promise<string[]> {
    return unwrap<string[]>(TABLE, await supabase.rpc('get_themes_conferences'))
  },

  // `limit` : les suggestions n'ont besoin que de quelques conférences.
  async getByTheme(theme: string, limit?: number): Promise<ConferenceResume[]> {
    let query = supabase.from(TABLE).select(LIST_SELECT).eq('theme', theme).order('jour').order('heure_debut')
    if (limit) query = query.limit(limit)
    return unwrap<ConferenceResume[]>(TABLE, await query)
  },
}

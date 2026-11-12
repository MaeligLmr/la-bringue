import { supabase } from '../supabase.js'
import type { Notification } from '../types/database/notification'
import { unwrap } from './crud'

const TABLE = 'Notification'
const COLUMNS = 'id_notification, created_at, id_utilisatrice, id_concert, message, lue'

export const notificationHandler = {
  async getUnread(): Promise<Notification[]> {
    return unwrap<Notification[]>(
      TABLE,
      await supabase.from(TABLE).select(COLUMNS).eq('lue', false).order('created_at', { ascending: false })
    )
  },

  async markAllRead(): Promise<void> {
    unwrap(TABLE, await supabase.from(TABLE).update({ lue: true }).eq('lue', false))
  },

  subscribe(idUtilisatrice: string, onInsert: (notification: Notification) => void): () => void {
    const channel = supabase
      .channel(`notifications-${idUtilisatrice}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE, filter: `id_utilisatrice=eq.${idUtilisatrice}` },
        (payload) => onInsert(payload.new as Notification)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}

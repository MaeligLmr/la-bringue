import { computed, readonly, ref } from 'vue'
import { toast } from 'vue-sonner'
import { notificationHandler } from '../../handlers/notification'
import type { Notification } from '../../types/database/notification'

export const NOTIFICATIONS_LOAD_ERROR_MESSAGE = "Tes notifications n'ont pas pu être chargées."

// Notifications non lues de l'utilisatrice connectée, partagées par la navbar
// (compteur) et Mon programme (liste).
const unread = ref<Notification[]>([])

let unsubscribe: (() => void) | null = null
// Incrémenté à chaque démarrage ou arrêt : une réponse périmée est ignorée.
let sessionId = 0

// Charge les notifications non lues et écoute les nouvelles (toast en direct).
async function startNotifications(idUtilisatrice: string) {
  stopNotifications()
  const id = sessionId
  unsubscribe = notificationHandler.subscribe(idUtilisatrice, (notification) => {
    if (id !== sessionId || unread.value.some((item) => item.id_notification === notification.id_notification)) return
    unread.value = [notification, ...unread.value]
    toast.info(notification.message)
  })

  try {
    const rows = await notificationHandler.getUnread()
    if (id !== sessionId) return
    // Garde celles reçues en direct pendant le chargement.
    const ids = new Set(rows.map((row) => row.id_notification))
    unread.value = [...unread.value.filter((item) => !ids.has(item.id_notification)), ...rows]
  } catch (error) {
    console.error(error)
    if (id === sessionId) toast.error(NOTIFICATIONS_LOAD_ERROR_MESSAGE)
  }
}

function stopNotifications() {
  sessionId++
  unsubscribe?.()
  unsubscribe = null
  unread.value = []
}

async function markAllRead() {
  const previous = unread.value
  unread.value = []
  try {
    await notificationHandler.markAllRead()
  } catch (error) {
    console.error(error)
    unread.value = previous
    toast.error("Tes notifications n'ont pas pu être marquées comme lues.")
  }
}

export function useNotifications() {
  return {
    unread: readonly(unread),
    unreadCount: computed(() => unread.value.length),
    startNotifications,
    stopNotifications,
    markAllRead,
  }
}

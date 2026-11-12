import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { Notification } from '../../types/database/notification'

const { notificationHandler, toast } = vi.hoisted(() => ({
  notificationHandler: { getUnread: vi.fn(), markAllRead: vi.fn(), subscribe: vi.fn() },
  toast: { info: vi.fn(), error: vi.fn() },
}))
vi.mock('../../handlers/notification', () => ({ notificationHandler }))
vi.mock('vue-sonner', () => ({ toast }))

function notification(id: number, message = `Changement ${id}`): Notification {
  return { id_notification: id, created_at: '', id_utilisatrice: 'u1', id_concert: 1, message, lue: false }
}

// État partagé au niveau du module : on le réimporte à neuf pour chaque test.
async function load() {
  vi.resetModules()
  const { useNotifications } = await import('./useNotifications')
  return useNotifications()
}

// Déclenche le callback Realtime passé à subscribe.
function receive(item: Notification) {
  notificationHandler.subscribe.mock.calls.at(-1)![1](item)
}

beforeEach(() => {
  vi.clearAllMocks()
  notificationHandler.getUnread.mockResolvedValue([notification(1)])
  notificationHandler.markAllRead.mockResolvedValue(undefined)
  notificationHandler.subscribe.mockReturnValue(vi.fn())
})

describe('useNotifications', () => {
  it('charge les notifications non lues et écoute celles de l’utilisatrice', async () => {
    const { unread, unreadCount, startNotifications } = await load()

    await startNotifications('u1')

    expect(notificationHandler.subscribe).toHaveBeenCalledWith('u1', expect.any(Function))
    expect(unread.value).toEqual([notification(1)])
    expect(unreadCount.value).toBe(1)
  })

  it('ajoute une notification reçue en direct, avec un toast', async () => {
    const { unread, startNotifications } = await load()
    await startNotifications('u1')

    receive(notification(2, 'Le concert a changé'))

    expect(unread.value.map((item) => item.id_notification)).toEqual([2, 1])
    expect(toast.info).toHaveBeenCalledWith('Le concert a changé')
  })

  it('arrête l’écoute et vide la liste à la déconnexion', async () => {
    const unsubscribe = vi.fn()
    notificationHandler.subscribe.mockReturnValue(unsubscribe)
    const { unread, startNotifications, stopNotifications } = await load()
    await startNotifications('u1')

    stopNotifications()

    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(unread.value).toEqual([])
  })

  it('ignore un chargement arrivé après la déconnexion', async () => {
    let resolve!: (rows: Notification[]) => void
    notificationHandler.getUnread.mockReturnValue(new Promise((res) => (resolve = res)))
    const { unread, startNotifications, stopNotifications } = await load()

    const started = startNotifications('u1')
    stopNotifications()
    resolve([notification(1)])
    await started

    expect(unread.value).toEqual([])
  })

  it('marque tout comme lu, et rétablit la liste si l’enregistrement échoue', async () => {
    const { unread, startNotifications, markAllRead } = await load()
    await startNotifications('u1')

    await markAllRead()
    expect(notificationHandler.markAllRead).toHaveBeenCalledOnce()
    expect(unread.value).toEqual([])

    await startNotifications('u1')
    notificationHandler.markAllRead.mockRejectedValue(new Error('boom'))
    await markAllRead()
    await flushPromises()
    expect(unread.value).toEqual([notification(1)])
    expect(toast.error).toHaveBeenCalled()
  })
})

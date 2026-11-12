export interface Notification {
  id_notification: number
  created_at: string
  id_utilisatrice: string
  id_concert: number | null
  message: string
  lue: boolean
}

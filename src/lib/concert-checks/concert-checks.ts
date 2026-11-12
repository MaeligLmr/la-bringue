import { DUREE_PAR_DEFAUT } from '../mon-programme/mon-programme'

// Contrôles de cohérence du formulaire de concert (back office).

export interface Creneau {
  id_concert?: number
  id_scene: number | string | null
  jour: string | null
  heure_debut: string | null
  heure_fin: string | null
}

function minutes(heure: string | null) {
  if (!heure) return null
  const [h, m] = heure.split(':').map(Number)
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m
}

export function heureFinError(heureDebut: string | null, heureFin: string | null) {
  const debut = minutes(heureDebut)
  const fin = minutes(heureFin)
  if (debut === null || fin === null || fin > debut) return undefined
  return "L'heure de fin doit être après l'heure de début."
}

function plage(concert: Creneau) {
  const debut = minutes(concert.heure_debut)
  if (debut === null) return null
  return { debut, fin: minutes(concert.heure_fin) ?? debut + DUREE_PAR_DEFAUT }
}

export function chevauchements<C extends Creneau>(concert: Creneau, autres: C[]): C[] {
  const lui = plage(concert)
  if (!lui || !concert.jour || concert.id_scene == null || concert.id_scene === '') return []

  return autres.filter((autre) => {
    if (autre.id_concert !== undefined && autre.id_concert === concert.id_concert) return false
    if (autre.jour !== concert.jour || String(autre.id_scene) !== String(concert.id_scene)) return false
    const sienne = plage(autre)
    return !!sienne && lui.debut < sienne.fin && sienne.debut < lui.fin
  })
}

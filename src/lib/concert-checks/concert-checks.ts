import { DUREE_PAR_DEFAUT } from '../mon-programme/mon-programme'

// Contrôles horaires des formulaires de concert et de conférence (back office).

export interface Creneau {
  id?: number
  lieu: number | string | null
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

export function horaireRules(values: Record<string, unknown>) {
  return { heure_fin: heureFinError(values.heure_debut as string | null, values.heure_fin as string | null) }
}

export function creneauSaisi(values: Record<string, unknown>, id: number | undefined, lieu: Creneau['lieu']): Creneau {
  return {
    id,
    lieu,
    jour: values.jour as string | null,
    heure_debut: values.heure_debut as string | null,
    heure_fin: values.heure_fin as string | null,
  }
}

function plage(creneau: Creneau) {
  const debut = minutes(creneau.heure_debut)
  if (debut === null) return null
  return { debut, fin: minutes(creneau.heure_fin) ?? debut + DUREE_PAR_DEFAUT }
}

export function chevauchements<C extends Creneau>(creneau: Creneau, autres: C[]): C[] {
  const lui = plage(creneau)
  if (!lui || !creneau.jour || creneau.lieu == null || creneau.lieu === '') return []

  return autres.filter((autre) => {
    if (autre.id !== undefined && autre.id === creneau.id) return false
    if (autre.jour !== creneau.jour || String(autre.lieu) !== String(creneau.lieu)) return false
    const sienne = plage(autre)
    return !!sienne && lui.debut < sienne.fin && sienne.debut < lui.fin
  })
}

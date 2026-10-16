import type { FormuleAvecPromotions } from '../handlers/formule'
import type { Promotion } from '../types/database/promotion'
import type { FormuleCard, FormulePromo } from '../types/ui/billetterie'

// En dessous de ce nombre de places restantes, on le signale sur la carte.
export const PLACES_RESTANTES_SEUIL = 20
// À partir de ce nombre de jours avant la date limite, la promotion est « urgente ».
export const PROMO_URGENTE_JOURS = 7

const JOUR_MS = 24 * 60 * 60 * 1000

// « 28 août » ; les jours de la base sont des dates ISO « YYYY-MM-DD ».
// Lues en UTC pour que le fuseau du navigateur ne décale jamais le jour.
function formatJour(iso: string, withMonth = true) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    ...(withMonth ? { month: 'long' } : {}),
    timeZone: 'UTC',
  })
}

// « 28 août » (un seul jour), « du 28 au 30 août » (même mois), « du 30 août au 2 septembre ».
export function formatDates(debut: string | null, fin: string | null) {
  if (!debut && !fin) return null
  if (!debut || !fin || debut === fin) return formatJour((debut ?? fin)!)
  const sameMonth = debut.slice(0, 7) === fin.slice(0, 7)
  return sameMonth
    ? `du ${formatJour(debut, false)} au ${formatJour(fin)}`
    : `du ${formatJour(debut)} au ${formatJour(fin)}`
}

// La base stocke juste le nombre ('1', '2', '3') : '1' → « 1 jour », '3' → « 3 jours ».
// Un libellé déjà complet ('3 jours') est gardé tel quel.
export function formatDuree(nbJours: string | null) {
  if (nbJours == null) return null
  const jours = nbJours.trim()
  if (!/^\d+$/.test(jours)) return jours || null
  return `${Number(jours)} jour${Number(jours) > 1 ? 's' : ''}`
}

export function formatPrix(prix: number) {
  return prix.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(prix) ? 0 : 2,
  })
}

// Les dates des promotions sont des « timestamp without time zone » : on les lit
// à l'heure locale, comme elles ont été saisies.
function isActive(promotion: Promotion, now: Date) {
  const debut = promotion.date_debut ? new Date(promotion.date_debut) : null
  const fin = promotion.date_fin ? new Date(promotion.date_fin) : null
  return !!promotion.reduction_prc && (!debut || debut <= now) && (!fin || fin >= now)
}

// La promotion en cours la plus avantageuse, avec sa date limite mise en forme.
export function activePromo(promotions: Promotion[], now: Date): FormulePromo | null {
  const best = promotions
    .filter((promotion) => isActive(promotion, now))
    .sort((a, b) => (b.reduction_prc ?? 0) - (a.reduction_prc ?? 0))[0]
  if (!best) return null

  const fin = best.date_fin ? new Date(best.date_fin) : null
  const joursRestants = fin ? Math.floor((fin.getTime() - now.getTime()) / JOUR_MS) : null
  return {
    nom: best.description?.trim() || 'Promotion',
    reduction: best.reduction_prc!,
    jusquAu: fin ? fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null,
    joursRestants,
    urgente: joursRestants !== null && joursRestants <= PROMO_URGENTE_JOURS,
  }
}

// Formules de la base (avec leurs promotions) → cartes de la grille.
// `now` est injectable pour des résultats stables dans les tests.
export function toFormuleCards(formules: FormuleAvecPromotions[], now: Date = new Date()): FormuleCard[] {
  return formules.map((formule) => {
    const promo = activePromo(formule.Promotion ?? [], now)
    const prixInitial = formule.prix ?? null
    const prix = prixInitial === null ? null : prixInitial * (1 - (promo?.reduction ?? 0) / 100)
    const restantes = formule.nbr_places_restantes ?? null

    return {
      id: formule.id_formule,
      titre: formule.titre ?? '',
      description: formule.description ?? '',
      duree: formatDuree(formule.nb_jours),
      dates: formatDates(formule.jour_debut, formule.jour_fin),
      prix: prix === null ? null : formatPrix(Math.round(prix * 100) / 100),
      prixInitial: promo && prixInitial !== null ? formatPrix(prixInitial) : null,
      promo,
      complet: restantes === 0,
      placesRestantes: restantes !== null && restantes > 0 && restantes <= PLACES_RESTANTES_SEUIL ? restantes : null,
      lienShotgun: formule.lien_shotgun,
    }
  })
}

// Billetterie externe (Shotgun) : nouvel onglet, sans transmettre la page d'origine.
// Utilisée par la page Billetterie et par l'accueil.
export function openBilletterie(card: FormuleCard) {
  if (card.lienShotgun) window.open(card.lienShotgun, '_blank', 'noopener,noreferrer')
}

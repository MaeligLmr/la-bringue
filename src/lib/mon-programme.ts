import type { ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'
import type { Frise, FriseBloc, FriseColonne, ProgrammeItem, ProgrammeJour } from '../types/ui/mon-programme'
import { JOURS, SCENES } from '../types/ui/programmation'
import { labelOf } from './cards'

export const DATE_A_CONFIRMER = 'Date à confirmer'
export const EMPTY_MESSAGE = "Vous n'avez encore rien liké"

export function formatCreneau(item: Pick<ProgrammeItem, 'heure' | 'heureFin'>) {
  return [item.heure, item.heureFin].filter(Boolean).join(' – ')
}

export function messageConflit(item: Pick<ProgrammeItem, 'conflits'>) {
  return item.conflits.length ? `En même temps que ${item.conflits.join(', ')}` : undefined
}

export const DUREE_PAR_DEFAUT = 60

// Colonnes dans l'ordre de SCENES, puis « Scène à confirmer », puis les conférences.
function colonneDe(item: ProgrammeItem) {
  if (item.target.type === 'conference') return { id: 'conferences', label: 'Conférences', ordre: SCENES.length + 1 }
  const ordre = SCENES.findIndex((option) => option.value === item.scene)
  return ordre === -1
    ? { id: 'scene-inconnue', label: 'Scène à confirmer', ordre: SCENES.length }
    : { id: item.scene, label: SCENES[ordre].label, ordre }
}

type Place = Omit<FriseBloc, 'piste' | 'pistes'> & { fin: number }

function repartirEnPistes(places: Place[]): FriseBloc[] {
  const blocs: FriseBloc[] = []
  let groupe: FriseBloc[] = []
  let finsDesPistes: number[] = []
  let finDuGroupe = -Infinity

  const fermerGroupe = () => {
    for (const bloc of groupe) bloc.pistes = finsDesPistes.length
    blocs.push(...groupe)
    groupe = []
    finsDesPistes = []
  }

  for (const { fin, ...place } of places) {
    if (place.debut >= finDuGroupe) fermerGroupe()
    let piste = finsDesPistes.findIndex((finPiste) => finPiste <= place.debut)
    if (piste === -1) piste = finsDesPistes.push(fin) - 1
    else finsDesPistes[piste] = fin
    finDuGroupe = Math.max(finDuGroupe, fin)
    groupe.push({ ...place, piste, pistes: 1 })
  }
  fermerGroupe()
  return blocs
}

type ItemSansConflit = Omit<ProgrammeItem, 'conflits'> & { jour: string }

function fromArtiste(card: ArtisteCard): ItemSansConflit {
  return {
    key: `artiste-${card.id}`,
    target: { id: card.idArtiste, type: 'artiste' },
    nom: card.nom,
    photo: card.photo,
    heure: card.heure,
    heureFin: card.heureFin,
    lieu: labelOf(SCENES, card.scene),
    scene: card.scene,
    categorie: card.categorie,
    jour: card.date,
  }
}

function fromConference(card: ConferenceCard): ItemSansConflit {
  return {
    key: `conference-${card.id}`,
    target: { id: card.id, type: 'conference' },
    nom: card.nom,
    photo: card.photo,
    heure: card.heure,
    heureFin: card.heureFin,
    lieu: card.conferencieres,
    scene: '',
    categorie: card.theme,
    jour: card.date,
  }
}

function minutes(heure: string) {
  const match = /^(\d{2})h(\d{2})$/.exec(heure)
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

function creneau(item: Pick<ProgrammeItem, 'heure' | 'heureFin'>) {
  const debut = minutes(item.heure)
  const fin = minutes(item.heureFin)
  if (debut === null || fin === null) return null
  return { debut, fin: fin <= debut ? fin + 24 * 60 : fin }
}

function seChevauchent(a: ReturnType<typeof creneau>, b: ReturnType<typeof creneau>) {
  return a !== null && b !== null && a.debut < b.fin && b.debut < a.fin
}

function avecConflits(jour: string, items: Omit<ProgrammeItem, 'conflits'>[]): ProgrammeItem[] {
  const creneaux = items.map((item) => (jour ? creneau(item) : null))
  return items.map((item, index) => ({
    ...item,
    conflits: items.flatMap((autre, autreIndex) =>
      autreIndex !== index && seChevauchent(creneaux[index], creneaux[autreIndex]) ? [autre.nom] : []
    ),
  }))
}

export function groupProgrammeByJour(artistes: ArtisteCard[], conferences: ConferenceCard[]): ProgrammeJour[] {
  const byJour = new Map<string, Omit<ProgrammeItem, 'conflits'>[]>()
  for (const { jour, ...item } of [...artistes.map(fromArtiste), ...conferences.map(fromConference)]) {
    byJour.set(jour, [...(byJour.get(jour) ?? []), item])
  }

  const ordre = (jour: string) => {
    const index = JOURS.findIndex((option) => option.value === jour)
    return index === -1 ? JOURS.length : index
  }

  return [...byJour.entries()]
    .sort(([a], [b]) => ordre(a) - ordre(b) || a.localeCompare(b))
    .map(([jour, items]) => ({
      jour,
      label: jour ? labelOf(JOURS, jour) : DATE_A_CONFIRMER,
      items: avecConflits(
        jour,
        items.sort((a, b) => Number(!a.heure) - Number(!b.heure) || a.heure.localeCompare(b.heure))
      ),
    }))
}

function labelHeure(minutesDepuisMinuit: number) {
  return `${String(Math.floor(minutesDepuisMinuit / 60) % 24).padStart(2, '0')}h`
}

export function construireFrise(items: ProgrammeItem[]): Frise {
  const sansHoraire: ProgrammeItem[] = []
  const places: (Place & { colonne: ReturnType<typeof colonneDe> })[] = []

  for (const item of items) {
    const debut = minutes(item.heure)
    if (debut === null) {
      sansHoraire.push(item)
      continue
    }
    const finConnue = creneau(item)?.fin
    const fin = finConnue ?? debut + DUREE_PAR_DEFAUT
    places.push({
      item,
      debut,
      fin,
      duree: fin - debut,
      finInconnue: finConnue === undefined,
      colonne: colonneDe(item),
    })
  }

  if (places.length === 0) return { duree: 0, heures: [], colonnes: [], sansHoraire }

  places.sort((a, b) => a.debut - b.debut || a.fin - b.fin)
  const origine = Math.floor(places[0].debut / 60) * 60
  const finFrise = Math.ceil(Math.max(...places.map((place) => place.fin)) / 60) * 60

  const parColonne = new Map<string, { label: string; places: Place[] }>()
  for (const { colonne, ...place } of places) {
    const entree = parColonne.get(colonne.id) ?? { label: colonne.label, places: [] }
    entree.places.push({ ...place, debut: place.debut - origine, fin: place.fin - origine })
    parColonne.set(colonne.id, entree)
  }

  const colonnes: FriseColonne[] = [...parColonne.entries()]
    .sort(([a], [b]) => ordreColonne(a) - ordreColonne(b))
    .map(([id, { label, places }]) => ({ id, label, blocs: repartirEnPistes(places) }))

  const heures = []
  for (let position = 0; position <= finFrise - origine; position += 60) {
    heures.push({ position, label: labelHeure(origine + position) })
  }

  return { duree: finFrise - origine, heures, colonnes, sansHoraire }
}

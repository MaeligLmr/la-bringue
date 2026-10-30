import { describe, it, expect } from 'vitest'
import {
  DATE_A_CONFIRMER,
  DUREE_PAR_DEFAUT,
  construireFrise,
  formatCreneau,
  groupProgrammeByJour,
  messageConflit,
} from './mon-programme'
import type { ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'

function artiste(
  idArtiste: number,
  nom: string,
  date: string,
  heure: string,
  scene = 'chrome',
  heureFin = ''
): ArtisteCard {
  return { id: `c-${idArtiste}`, idArtiste, nom, photo: null, date, heure, heureFin, scene, categorie: 'Pop' }
}

function conference(id: number, nom: string, date: string, heure: string, heureFin = ''): ConferenceCard {
  return { id, nom, photo: null, date, heure, heureFin, conferencieres: 'Alice, Inès', theme: 'Féminisme' }
}

function conflitsParNom(artistes: ArtisteCard[], conferences: ConferenceCard[] = []) {
  return Object.fromEntries(
    groupProgrammeByJour(artistes, conferences).flatMap((jour) => jour.items.map((item) => [item.nom, item.conflits]))
  )
}

describe('groupProgrammeByJour', () => {
  it('ne renvoie aucun jour sans contenu', () => {
    expect(groupProgrammeByJour([], [])).toEqual([])
  })

  it("regroupe artistes et conférences par jour, dans l'ordre du festival", () => {
    const jours = groupProgrammeByJour(
      [artiste(1, 'Oklou', '2026-08-30', '19h00'), artiste(2, 'Iliona', '2026-08-28', '17h00')],
      [conference(3, 'Table ronde', '2026-08-28', '14h00')]
    )

    expect(jours.map((jour) => jour.label)).toEqual(['Vendredi 28 août', 'Dimanche 30 août'])
    expect(jours[0].items.map((item) => item.nom)).toEqual(['Table ronde', 'Iliona'])
  })

  it('trie les contenus de la journée par horaire, ceux sans horaire en dernier', () => {
    const [jour] = groupProgrammeByJour(
      [artiste(1, 'Tard', '2026-08-29', '22h15'), artiste(2, 'Sans heure', '2026-08-29', '')],
      [conference(3, 'Tôt', '2026-08-29', '09h30')]
    )

    expect(jour.items.map((item) => item.nom)).toEqual(['Tôt', 'Tard', 'Sans heure'])
  })

  it('affiche la scène pour un artiste et les conférencières pour une conférence', () => {
    const [jour] = groupProgrammeByJour(
      [artiste(1, 'Oklou', '2026-08-29', '19h00', '2000')],
      [conference(3, 'Table ronde', '2026-08-29', '14h00')]
    )

    expect(jour.items).toEqual([
      expect.objectContaining({ target: { id: 3, type: 'conference' }, lieu: 'Alice, Inès', categorie: 'Féminisme' }),
      expect.objectContaining({ target: { id: 1, type: 'artiste' }, lieu: '2000’', heure: '19h00' }),
    ])
  })

  it('place les contenus sans date dans un groupe « Date à confirmer » en fin de liste', () => {
    const jours = groupProgrammeByJour([artiste(1, 'Mystère', '', ''), artiste(2, 'Oklou', '2026-08-30', '19h00')], [])

    expect(jours.map((jour) => jour.label)).toEqual(['Dimanche 30 août', DATE_A_CONFIRMER])
  })

  describe('conflits d’horaire', () => {
    it('signale deux éléments du même jour dont les horaires se chevauchent', () => {
      expect(
        conflitsParNom(
          [artiste(1, 'Oklou', '2026-08-29', '19h00', 'chrome', '20h00')],
          [conference(2, 'Table ronde', '2026-08-29', '19h30', '21h00')]
        )
      ).toEqual({ Oklou: ['Table ronde'], 'Table ronde': ['Oklou'] })
    })

    it('liste tous les éléments en conflit avec un même élément', () => {
      expect(
        conflitsParNom([
          artiste(1, 'Long', '2026-08-29', '18h00', 'chrome', '22h00'),
          artiste(2, 'Tôt', '2026-08-29', '18h30', 'soft', '19h00'),
          artiste(3, 'Tard', '2026-08-29', '21h00', 'summer', '21h30'),
        ])
      ).toEqual({ Long: ['Tôt', 'Tard'], Tôt: ['Long'], Tard: ['Long'] })
    })

    it('ne signale rien quand un élément commence pile à la fin du précédent', () => {
      expect(
        conflitsParNom([
          artiste(1, 'Avant', '2026-08-29', '20h00', 'chrome', '21h00'),
          artiste(2, 'Après', '2026-08-29', '21h00', 'soft', '22h00'),
        ])
      ).toEqual({ Avant: [], Après: [] })
    })

    it('ne compare pas des éléments de jours différents', () => {
      expect(
        conflitsParNom([
          artiste(1, 'Vendredi', '2026-08-28', '20h00', 'chrome', '21h00'),
          artiste(2, 'Samedi', '2026-08-29', '20h00', 'soft', '21h00'),
        ])
      ).toEqual({ Vendredi: [], Samedi: [] })
    })

    it('gère un concert qui se termine après minuit', () => {
      expect(
        conflitsParNom([
          artiste(1, 'Nuit', '2026-08-29', '23h30', 'chrome', '01h00'),
          artiste(2, 'Minuit', '2026-08-29', '23h45', 'soft', '00h30'),
        ])
      ).toEqual({ Nuit: ['Minuit'], Minuit: ['Nuit'] })
    })

    it("ne signale rien sans heure de fin connue", () => {
      expect(
        conflitsParNom([
          artiste(1, 'Sans fin', '2026-08-29', '20h00'),
          artiste(2, 'Pendant', '2026-08-29', '20h15', 'soft', '20h45'),
        ])
      ).toEqual({ 'Sans fin': [], Pendant: [] })
    })

    it('ne signale rien entre deux éléments sans date', () => {
      expect(
        conflitsParNom([
          artiste(1, 'Mystère A', '', '20h00', 'chrome', '21h00'),
          artiste(2, 'Mystère B', '', '20h00', 'soft', '21h00'),
        ])
      ).toEqual({ 'Mystère A': [], 'Mystère B': [] })
    })
  })

  it('formate le créneau et le message de conflit', () => {
    expect(formatCreneau({ heure: '22h15', heureFin: '23h30' })).toBe('22h15 – 23h30')
    expect(formatCreneau({ heure: '22h15', heureFin: '' })).toBe('22h15')
    expect(messageConflit({ conflits: ['Oklou', 'Table ronde'] })).toBe('En même temps que Oklou, Table ronde')
    expect(messageConflit({ conflits: [] })).toBeUndefined()
  })

  describe('construireFrise', () => {
    function frise(artistes: ArtisteCard[], conferences: ConferenceCard[] = []) {
      const [jour] = groupProgrammeByJour(artistes, conferences)
      return construireFrise(jour.items)
    }

    function placement(resultat: ReturnType<typeof construireFrise>) {
      return Object.fromEntries(
        resultat.colonnes.flatMap((colonne) =>
          colonne.blocs.map(({ item, debut, duree, piste, pistes }) => [
            item.nom,
            { colonne: colonne.label, debut, duree, piste, pistes },
          ])
        )
      )
    }

    it('borne la frise aux heures pleines et place chaque élément selon son horaire', () => {
      const resultat = frise([
        artiste(1, 'Iliona', '2026-08-28', '16h20', 'summer', '17h20'),
        artiste(2, 'Aya Nakamura', '2026-08-28', '22h15', 'chrome', '00h15'),
      ])

      expect(resultat.duree).toBe(9 * 60)
      expect(resultat.heures.map((heure) => heure.label)).toEqual([
        '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h', '00h', '01h',
      ])
      expect(placement(resultat)).toEqual({
        Iliona: { colonne: 'Summer', debut: 20, duree: 60, piste: 0, pistes: 1 },
        'Aya Nakamura': { colonne: 'Chrome', debut: 6 * 60 + 15, duree: 120, piste: 0, pistes: 1 },
      })
    })

    it("n'affiche que les colonnes utilisées, scènes dans l'ordre puis conférences", () => {
      const resultat = frise(
        [
          artiste(1, 'Iliona', '2026-08-28', '16h20', 'summer', '17h20'),
          artiste(2, 'Meryl', '2026-08-28', '17h55', 'chrome', '18h55'),
          artiste(3, 'Mystère', '2026-08-28', '18h00', '', '19h00'),
        ],
        [conference(4, 'Table ronde', '2026-08-28', '14h00', '15h00')]
      )

      expect(resultat.colonnes.map((colonne) => colonne.label)).toEqual([
        'Chrome',
        'Summer',
        'Scène à confirmer',
        'Conférences',
      ])
    })

    it("met côte à côte, dans leur colonne, deux éléments d'une même colonne qui se chevauchent", () => {
      const resultat = frise(
        [artiste(1, 'Oklou', '2026-08-29', '18h00', 'chrome', '19h00')],
        [
          conference(2, 'Longue', '2026-08-29', '18h00', '22h00'),
          conference(3, 'Courte', '2026-08-29', '18h30', '19h30'),
          conference(4, 'Plus tard', '2026-08-29', '20h00', '21h00'),
          conference(5, 'Seule', '2026-08-29', '23h00', '00h00'),
        ]
      )

      expect(placement(resultat)).toEqual({
        Oklou: { colonne: 'Chrome', debut: 0, duree: 60, piste: 0, pistes: 1 },
        Longue: { colonne: 'Conférences', debut: 0, duree: 240, piste: 0, pistes: 2 },
        Courte: { colonne: 'Conférences', debut: 30, duree: 60, piste: 1, pistes: 2 },
        'Plus tard': { colonne: 'Conférences', debut: 120, duree: 60, piste: 1, pistes: 2 },
        Seule: { colonne: 'Conférences', debut: 300, duree: 60, piste: 0, pistes: 1 },
      })
    })

    it('donne une durée par défaut aux éléments sans heure de fin', () => {
      const [bloc] = frise([artiste(1, 'Sans fin', '2026-08-29', '20h00')]).colonnes[0].blocs

      expect(bloc).toMatchObject({ duree: DUREE_PAR_DEFAUT, finInconnue: true })
    })

    it('met à part les éléments sans horaire', () => {
      const resultat = frise([
        artiste(1, 'Oklou', '2026-08-29', '19h00', 'chrome', '20h00'),
        artiste(2, 'Mystère', '2026-08-29', ''),
      ])

      expect(Object.keys(placement(resultat))).toEqual(['Oklou'])
      expect(resultat.sansHoraire.map((item) => item.nom)).toEqual(['Mystère'])
    })
  })
})

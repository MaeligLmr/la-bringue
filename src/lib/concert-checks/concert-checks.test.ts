import { describe, it, expect } from 'vitest'
import { chevauchements, creneauSaisi, heureFinError, horaireRules } from './concert-checks'

describe('heureFinError', () => {
  it('bloque une heure de fin avant ou égale à l’heure de début', () => {
    expect(heureFinError('21:00', '20:30')).toBe("L'heure de fin doit être après l'heure de début.")
    expect(heureFinError('21:00:00', '21:00')).toBe("L'heure de fin doit être après l'heure de début.")
  })

  it('accepte une heure de fin après le début, ou absente', () => {
    expect(heureFinError('21:00:00', '22:30')).toBeUndefined()
    expect(heureFinError('21:00', null)).toBeUndefined()
    expect(heureFinError('21:00', '')).toBeUndefined()
  })
})

describe('chevauchements', () => {
  const CHROME_SAMEDI_21H = { id: 1, lieu: 1, jour: '2026-08-29', heure_debut: '21:00:00', heure_fin: '22:30:00' }

  it('repère un concert de la même scène, le même jour, sur un créneau commun', () => {
    const nouveau = { lieu: '1', jour: '2026-08-29', heure_debut: '22:00', heure_fin: '23:00' }
    expect(chevauchements(nouveau, [CHROME_SAMEDI_21H])).toEqual([CHROME_SAMEDI_21H])
  })

  it('ignore les concerts qui se suivent, d’une autre scène ou d’un autre jour', () => {
    const suivant = { lieu: 1, jour: '2026-08-29', heure_debut: '22:30', heure_fin: '23:30' }
    const autreScene = { lieu: 2, jour: '2026-08-29', heure_debut: '21:30', heure_fin: '22:00' }
    const autreJour = { lieu: 1, jour: '2026-08-30', heure_debut: '21:30', heure_fin: '22:00' }

    expect(chevauchements(suivant, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements(autreScene, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements(autreJour, [CHROME_SAMEDI_21H])).toEqual([])
  })

  it('ne compare pas un concert avec lui-même', () => {
    expect(chevauchements({ ...CHROME_SAMEDI_21H, heure_fin: '23:00' }, [CHROME_SAMEDI_21H])).toEqual([])
  })

  it('compte une heure de fin absente comme une durée par défaut', () => {
    const sansFin = { id: 2, lieu: 1, jour: '2026-08-29', heure_debut: '20:30', heure_fin: null }
    expect(chevauchements(sansFin, [CHROME_SAMEDI_21H])).toEqual([CHROME_SAMEDI_21H])
  })

  it('s’applique aussi aux conférences, qui partagent le même lieu', () => {
    const table = { id: 1, lieu: 'conferences', jour: '2026-08-29', heure_debut: '14:00', heure_fin: '15:00' }
    const atelier = { lieu: 'conferences', jour: '2026-08-29', heure_debut: '14:30', heure_fin: '15:30' }
    expect(chevauchements(atelier, [table])).toEqual([table])
  })

  it('ne signale rien tant que jour, lieu ou heure de début manquent', () => {
    expect(chevauchements({ lieu: '', jour: '2026-08-29', heure_debut: '21:00', heure_fin: null }, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements({ lieu: 1, jour: '', heure_debut: '21:00', heure_fin: null }, [CHROME_SAMEDI_21H])).toEqual([])
  })
})

describe('horaireRules', () => {
  it('signale une heure de fin incohérente sur le champ heure_fin', () => {
    expect(horaireRules({ heure_debut: '21:00', heure_fin: '20:00' })).toEqual({
      heure_fin: "L'heure de fin doit être après l'heure de début.",
    })
    expect(horaireRules({ heure_debut: '21:00', heure_fin: '22:00' })).toEqual({ heure_fin: undefined })
  })
})

describe('creneauSaisi', () => {
  it('construit le créneau à partir des valeurs du formulaire', () => {
    const values = { jour: '2026-08-29', heure_debut: '21:00', heure_fin: '22:00', titre: 'ignoré' }

    expect(creneauSaisi(values, 7, 'conferences')).toEqual({
      id: 7,
      lieu: 'conferences',
      jour: '2026-08-29',
      heure_debut: '21:00',
      heure_fin: '22:00',
    })
  })
})

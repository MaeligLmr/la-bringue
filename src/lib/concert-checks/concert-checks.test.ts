import { describe, it, expect } from 'vitest'
import { chevauchements, heureFinError } from './concert-checks'

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
  const CHROME_SAMEDI_21H = { id_concert: 1, id_scene: 1, jour: '2026-08-29', heure_debut: '21:00:00', heure_fin: '22:30:00' }

  it('repère un concert de la même scène, le même jour, sur un créneau commun', () => {
    const nouveau = { id_scene: '1', jour: '2026-08-29', heure_debut: '22:00', heure_fin: '23:00' }
    expect(chevauchements(nouveau, [CHROME_SAMEDI_21H])).toEqual([CHROME_SAMEDI_21H])
  })

  it('ignore les concerts qui se suivent, d’une autre scène ou d’un autre jour', () => {
    const suivant = { id_scene: 1, jour: '2026-08-29', heure_debut: '22:30', heure_fin: '23:30' }
    const autreScene = { id_scene: 2, jour: '2026-08-29', heure_debut: '21:30', heure_fin: '22:00' }
    const autreJour = { id_scene: 1, jour: '2026-08-30', heure_debut: '21:30', heure_fin: '22:00' }

    expect(chevauchements(suivant, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements(autreScene, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements(autreJour, [CHROME_SAMEDI_21H])).toEqual([])
  })

  it('ne compare pas un concert avec lui-même', () => {
    expect(chevauchements({ ...CHROME_SAMEDI_21H, heure_fin: '23:00' }, [CHROME_SAMEDI_21H])).toEqual([])
  })

  it('compte une heure de fin absente comme une durée par défaut', () => {
    const sansFin = { id_concert: 2, id_scene: 1, jour: '2026-08-29', heure_debut: '20:30', heure_fin: null }
    expect(chevauchements(sansFin, [CHROME_SAMEDI_21H])).toEqual([CHROME_SAMEDI_21H])
  })

  it('ne signale rien tant que jour, scène ou heure de début manquent', () => {
    expect(chevauchements({ id_scene: '', jour: '2026-08-29', heure_debut: '21:00', heure_fin: null }, [CHROME_SAMEDI_21H])).toEqual([])
    expect(chevauchements({ id_scene: 1, jour: '', heure_debut: '21:00', heure_fin: null }, [CHROME_SAMEDI_21H])).toEqual([])
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { photoUrl } from './photo'

const SUPABASE_URL = 'https://exemple.supabase.co'

describe('photoUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('laisse une URL complète telle quelle', () => {
    expect(photoUrl('https://cdn.exemple.fr/a.webp')).toBe('https://cdn.exemple.fr/a.webp')
    expect(photoUrl('http://cdn.exemple.fr/a.webp')).toBe('http://cdn.exemple.fr/a.webp')
  })

  it('résout les photos des exposants vers le bucket Supabase', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    expect(photoUrl('/exposants/zoe-kaba.webp')).toBe(`${SUPABASE_URL}/storage/v1/object/public/images/exposants/zoe-kaba.webp`)
  })

  it('résout les photos de la programmation vers le bucket Supabase', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    expect(photoUrl('/programmation/aya-nakamura.webp')).toBe(
      `${SUPABASE_URL}/storage/v1/object/public/images/programmation/aya-nakamura.webp`
    )
  })

  it.each(['conferences', 'conferencieres'])('résout les photos du dossier %s vers le bucket Supabase', (dossier) => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    expect(photoUrl(`/${dossier}/a.webp`)).toBe(`${SUPABASE_URL}/storage/v1/object/public/images/${dossier}/a.webp`)
  })

  it('accepte un chemin sans slash initial', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    expect(photoUrl('exposants/zoe-kaba.webp')).toBe(`${SUPABASE_URL}/storage/v1/object/public/images/exposants/zoe-kaba.webp`)
  })

  it('préfixe les autres chemins par BASE_URL', () => {
    vi.stubEnv('VITE_SUPABASE_URL', SUPABASE_URL)
    expect(photoUrl('/autre/photo.webp')).toBe(`${import.meta.env.BASE_URL}autre/photo.webp`)
  })

  it('retombe sur BASE_URL si VITE_SUPABASE_URL est absent', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    expect(photoUrl('/exposants/zoe-kaba.webp')).toBe(`${import.meta.env.BASE_URL}exposants/zoe-kaba.webp`)
  })
})

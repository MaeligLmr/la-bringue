import { describe, expect, it, vi } from 'vitest'

// Les vues importent les handlers et useAuth, qui touchent au client Supabase
// dès le chargement : on le remplace par un faux sans réseau.
vi.mock('../supabase.js', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const { auth } = vi.hoisted(() => ({ auth: { isAdmin: { value: false } } }))

vi.mock('../composables/useAuth/useAuth', () => ({
  useAuth: () => ({ ready: Promise.resolve(), isAdmin: auth.isAdmin }),
}))

import { router } from './index'


function scrollTo(to: object, from: object, saved: object | null = null) {
  const behavior = router.options.scrollBehavior!
  return behavior(to as never, from as never, saved as never)
}

describe('router', () => {
  it.each([
    ['/', 'home'],
    ['/profil', 'profil'],
    ['/programmation', 'programmation'],
    ['/billetterie', 'billetterie'],
    ['/mon-programme', 'mon-programme'],
    ['/exposants', 'exposants'],
    ['/conferences', 'conferences'],
    ['/a-propos', 'a-propos'],
    ['/infos-pratiques', 'infos-pratiques'],
    ['/actualites', 'actualites'],
  ])('%s mène à la route %s', (path, name) => {
    expect(router.resolve(path).name).toBe(name)
  })

  it('masque la section Support sur le profil uniquement', () => {
    expect(router.resolve('/profil').meta.hideSupport).toBe(true)
    expect(router.resolve('/exposants').meta.hideSupport).toBeUndefined()
  })

  it('résout une fiche avec son type et son identifiant numérique', () => {
    const route = router.resolve('/artiste/fiche/12')
    expect(route.name).toBe('fiche')

    const props = (route.matched[0].props.default as (r: typeof route) => unknown)(route)
    expect(props).toEqual({ type: 'artiste', id: 12 })
  })

  it('refuse un type de fiche inconnu ou un identifiant non numérique', () => {
    expect(router.resolve('/festival/fiche/1').name).toBeUndefined()
    expect(router.resolve('/artiste/fiche/abc').name).toBeUndefined()
  })

  describe('back office', () => {
    it('résout les sections sous /admin, réservées aux admins', () => {
      expect(router.resolve('/admin/artistes').name).toBe('admin-artistes')
      expect(router.resolve('/admin/intervenantes').meta.requiresAdmin).toBe(true)
    })

    it('résout la création et la modification d’une artiste', () => {
      expect(router.resolve('/admin/artistes/nouvelle').name).toBe('admin-artiste-nouvelle')

      const route = router.resolve('/admin/artistes/12')
      expect(route.name).toBe('admin-artiste')
      expect(route.meta.requiresAdmin).toBe(true)
      const props = (route.matched.at(-1)!.props.default as (r: typeof route) => unknown)(route)
      expect(props).toEqual({ id: 12 })
    })

    it('renvoie une non-admin qui tape /admin vers la home', async () => {
      auth.isAdmin.value = false
      await router.push('/programmation')

      await router.push('/admin/artistes')

      expect(router.currentRoute.value.name).toBe('home')
    })

    it('laisse une admin accéder au back office', async () => {
      auth.isAdmin.value = true
      await router.push('/programmation')

      await router.push('/admin')

      expect(router.currentRoute.value.name).toBe('admin-artistes')
    })
  })

  describe('scrollBehavior', () => {
    it('restaure la position enregistrée (retour arrière)', () => {
      const saved = { left: 0, top: 480 }
      expect(scrollTo({ path: '/a' }, { path: '/b' }, saved)).toBe(saved)
    })

    it('laisse la page défiler elle-même pour un lien d’ancre', () => {
      expect(scrollTo({ path: '/infos-pratiques', hash: '#cashless' }, { path: '/' })).toBe(false)
    })

    it('ne défile pas quand seule la query change (filtres)', () => {
      expect(scrollTo({ path: '/programmation', hash: '' }, { path: '/programmation' })).toBe(false)
    })

    it('remonte en haut sur une nouvelle page', () => {
      expect(scrollTo({ path: '/exposants', hash: '' }, { path: '/' })).toEqual({ top: 0 })
    })
  })
})


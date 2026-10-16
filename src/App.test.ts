import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { useAuthModal } from './composables/useAuthModal'
import { useLikes } from './composables/useLikes'
import LoginForm from './components/auth/LoginForm.vue'
import SignUpForm from './components/auth/SignUpForm.vue'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn() } }))

vi.mock('vue-sonner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-sonner')>()),
  toast,
}))

const { signInWithPassword, signUp } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(() => new Promise(() => {})),
  signUp: vi.fn(() => new Promise(() => {})),
}))

vi.mock('./supabase.js', () => ({
  supabase: {
    auth: {
      signInWithPassword,
      signUp,
      // Used by useAuth.ts, pulled in transitively via Navbar.
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
    },
  },
}))

let wrapper: VueWrapper | null = null

async function mountApp(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profil', component: { template: '<div />' }, meta: { hideSupport: true } },
    ],
  })
  router.push(url)
  await router.isReady()
  return mount(App, { attachTo: document.body, global: { plugins: [router] } })
}

// Le contenu de la modale est téléporté dans <body> via <Teleport>, en dehors
// de l'arbre DOM du wrapper : wrapper.find() ne peut donc pas le trouver, on
// interagit directement avec le DOM réel.
async function click(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Élément introuvable : ${selector}`)
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
}

async function pressEscape(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Élément introuvable : ${selector}`)
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  )
  await nextTick()
}

describe("App (modale d'authentification)", () => {
  beforeEach(() => {
    signInWithPassword.mockClear()
    signUp.mockClear()
    useAuthModal().close()
    useAuthModal().switchTo('login')
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it("affiche le formulaire de connexion quand la modale s'ouvre sur 'login'", async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    expect(document.querySelector('#login-email')).not.toBeNull()
    expect(document.querySelector('#signup-email')).toBeNull()
  })

  it("affiche le formulaire d'inscription quand la modale s'ouvre sur 'signup'", async () => {
    wrapper = await mountApp()
    useAuthModal().open('signup')
    await nextTick()

    expect(document.querySelector('#signup-email')).not.toBeNull()
    expect(document.querySelector('#login-email')).toBeNull()
  })

  it('bascule vers le formulaire opposé sans fermer la modale', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    await click('.auth-form__switch')

    expect(document.querySelector('.modal__backdrop')).not.toBeNull()
    expect(document.querySelector('#signup-email')).not.toBeNull()
  })

  it('se ferme sur clic du bouton de fermeture, sans appel Supabase', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    await click('.modal__close')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(signInWithPassword).not.toHaveBeenCalled()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('abandonne le like demandé quand on ferme la modale sans se connecter', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login', { id: 42, type: 'artiste' })
    await nextTick()

    await click('.modal__close')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(useAuthModal().pendingLike.value).toBeNull()
  })

  it('se ferme sur clic du backdrop, sans appel Supabase', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    await click('.modal__backdrop')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('se ferme sur Échap, sans appel Supabase', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    await pressEscape('.modal__backdrop')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it("place le focus sur le premier champ à l'ouverture et le restitue au déclencheur à la fermeture", async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Se connecter'
    document.body.appendChild(trigger)
    trigger.focus()

    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(document.querySelector('#login-email'))

    useAuthModal().close()
    await nextTick()

    expect(document.activeElement).toBe(trigger)

    trigger.remove()
  })
})

describe('App (like en attente après connexion)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLikes().setLiked({ id: 42, type: 'artiste' }, false)
    useLikes().setLiked({ id: 3, type: 'conference' }, false)
    useAuthModal().close()
    useAuthModal().switchTo('login')
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('applique le like demandé et affiche le toast après une connexion réussie', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login', { id: 42, type: 'artiste' })
    await nextTick()

    wrapper.findComponent(LoginForm).vm.$emit('success')
    await flushPromises()

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(useLikes().isLiked({ id: 42, type: 'artiste' })).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Ajouté à Mon programme')
    expect(useAuthModal().pendingLike.value).toBeNull()
  })

  it('applique aussi le like demandé après une inscription réussie', async () => {
    wrapper = await mountApp()
    useAuthModal().open('login', { id: 3, type: 'conference' })
    useAuthModal().switchTo('signup')
    await nextTick()

    wrapper.findComponent(SignUpForm).vm.$emit('success')
    await flushPromises()

    expect(useLikes().isLiked({ id: 3, type: 'conference' })).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Ajouté à Mon programme')
  })

  it("n'applique aucun like quand on se connecte sans être passé par un like", async () => {
    wrapper = await mountApp()
    useAuthModal().open('login')
    await nextTick()

    wrapper.findComponent(LoginForm).vm.$emit('success')
    await flushPromises()

    expect(useLikes().isLiked({ id: 42, type: 'artiste' })).toBe(false)
    expect(useLikes().isLiked({ id: 3, type: 'conference' })).toBe(false)
    expect(toast.success).not.toHaveBeenCalled()
  })
})

describe('App (section Support)', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('affiche les sponsors juste au-dessus du footer', async () => {
    wrapper = await mountApp('/')

    const support = wrapper.find('.support')
    expect(support.exists()).toBe(true)
    expect(support.element.nextElementSibling?.tagName).toBe('FOOTER')
  })

  it('masque les sponsors sur la page profil', async () => {
    wrapper = await mountApp('/profil')

    expect(wrapper.find('.support').exists()).toBe(false)
    expect(wrapper.find('footer').exists()).toBe(true)
  })
})

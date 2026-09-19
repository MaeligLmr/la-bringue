import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from './App.vue'
import { useAuthModal } from './composables/useAuthModal'

const { signInWithPassword, signUp } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(() => new Promise(() => {})),
  signUp: vi.fn(() => new Promise(() => {})),
}))

vi.mock('./supabase.js', () => ({
  supabase: { auth: { signInWithPassword, signUp } },
}))

let wrapper: VueWrapper | null = null

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

describe('App (modale d\'authentification)', () => {
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
    wrapper = mount(App, { attachTo: document.body })
    useAuthModal().open('login')
    await nextTick()

    expect(document.querySelector('#login-email')).not.toBeNull()
    expect(document.querySelector('#signup-email')).toBeNull()
  })

  it("affiche le formulaire d'inscription quand la modale s'ouvre sur 'signup'", async () => {
    wrapper = mount(App, { attachTo: document.body })
    useAuthModal().open('signup')
    await nextTick()

    expect(document.querySelector('#signup-email')).not.toBeNull()
    expect(document.querySelector('#login-email')).toBeNull()
  })

  it('bascule vers le formulaire opposé sans fermer la modale', async () => {
    wrapper = mount(App, { attachTo: document.body })
    useAuthModal().open('login')
    await nextTick()

    await click('.auth-form__switch')

    expect(document.querySelector('.modal__backdrop')).not.toBeNull()
    expect(document.querySelector('#signup-email')).not.toBeNull()
  })

  it('se ferme sur clic du bouton de fermeture, sans appel Supabase', async () => {
    wrapper = mount(App, { attachTo: document.body })
    useAuthModal().open('login')
    await nextTick()

    await click('.modal__close')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(signInWithPassword).not.toHaveBeenCalled()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('se ferme sur clic du backdrop, sans appel Supabase', async () => {
    wrapper = mount(App, { attachTo: document.body })
    useAuthModal().open('login')
    await nextTick()

    await click('.modal__backdrop')

    expect(document.querySelector('.modal__backdrop')).toBeNull()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('se ferme sur Échap, sans appel Supabase', async () => {
    wrapper = mount(App, { attachTo: document.body })
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

    wrapper = mount(App, { attachTo: document.body })
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

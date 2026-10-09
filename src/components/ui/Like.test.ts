import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed } from 'vue'
import Like from './Like.vue'
import Icon from './Icon.vue'
import { useAuthModal } from '../../composables/useAuthModal'

const { loggedIn } = vi.hoisted(() => ({ loggedIn: { value: true } }))
vi.mock('../../composables/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: computed(() => loggedIn.value), ready: Promise.resolve() }),
}))

function mountLike(props: Record<string, unknown> = {}) {
  const wrapper = mount(Like, {
    props: {
      modelValue: false,
      'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
      ...props,
    },
  })
  return wrapper
}

beforeEach(() => {
  loggedIn.value = true
  useAuthModal().close()
})

describe('Like', () => {
  it('affiche le cœur vide et aria-pressed à false par défaut', () => {
    const wrapper = mount(Like)

    expect(wrapper.findComponent(Icon).props('name')).toBe('heart')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.attributes('aria-label')).toBe('Ajouter à Mon programme')
  })

  it('passe à liké au clic, puis retire le like au second clic', async () => {
    const wrapper = mountLike()

    await wrapper.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart-filled')
    expect(wrapper.attributes('aria-pressed')).toBe('true')

    await wrapper.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart')
  })

  it('affiche le cœur plein quand il est déjà liké', async () => {
    const wrapper = mount(Like, { props: { modelValue: true } })

    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart-filled')
  })

  describe('sans être connectée', () => {
    beforeEach(() => {
      loggedIn.value = false
    })

    it('ouvre la modale de connexion au lieu de liker', async () => {
      const wrapper = mountLike()

      await wrapper.trigger('click')
      await flushPromises()

      const { isOpen, activeView } = useAuthModal()
      expect(isOpen.value).toBe(true)
      expect(activeView.value).toBe('login')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.attributes('aria-pressed')).toBe('false')
    })

    it('mémorise le contenu liké le temps de la connexion', async () => {
      const wrapper = mountLike({ target: { id: 42, type: 'artiste' } })

      await wrapper.trigger('click')
      await flushPromises()

      expect(useAuthModal().pendingLike.value).toEqual({ id: 42, type: 'artiste' })
    })
  })
})


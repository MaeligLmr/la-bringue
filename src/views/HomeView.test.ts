import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  it('affiche la section Programmation (détail testé dans ProgrammationSection.test.ts)', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: HomeView }],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, { global: { plugins: [router] } })

    expect(wrapper.find('.programmation-section h2').text()).toBe('Programmation')
    expect(wrapper.findAll('.programmation-day')).toHaveLength(3)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import DatePicker from './DatePicker.vue'

const mounted: VueWrapper[] = []

function mountPicker(props: Record<string, unknown>) {
  const wrapper = mount(DatePicker, { props: props as never, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

const panel = () => document.body.querySelector('[role="dialog"]')
const days = () => Array.from(document.body.querySelectorAll<HTMLElement>('.date-picker__day'))
const byLabel = (label: string) => document.body.querySelector<HTMLElement>(`[aria-label="${label}"]`)!
const digits = (group: string) => byLabel(group).querySelector('.date-picker__digits')?.textContent?.trim()
const day = (prefix: string) => days().find((el) => el.getAttribute('aria-label')?.startsWith(prefix))!

describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 28, 12))
  })
  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.useRealTimers()
  })

  it('affiche la valeur formatée, ou un texte d’invite', () => {
    const filled = mountPicker({ modelValue: '2026-08-28', mode: 'date' })
    expect(filled.find('.date-picker__value').text()).toBe('vendredi 28 août 2026')

    const empty = mountPicker({ modelValue: '', mode: 'time' })
    expect(empty.find('.date-picker__value').text()).toBe('Choisir une heure')
  })

  it('transmet l’id au bouton pour qu’un <label for> l’ouvre', () => {
    const wrapper = mountPicker({ modelValue: '', id: 'admin-jour' })
    expect(wrapper.find('button#admin-jour').exists()).toBe(true)
  })

  it('n’affiche pas le panneau au repos, l’ouvre au clic, le ferme avec Échap', async () => {
    const wrapper = mountPicker({ modelValue: '2026-08-28' })
    expect(panel()).toBeNull()

    await wrapper.find('.date-picker__trigger').trigger('click')
    expect(panel()).not.toBeNull()
    expect(document.body.querySelector('.date-picker__month')?.textContent).toBe('août 2026')

    await wrapper.find('.date-picker__trigger').trigger('keydown', { key: 'Escape' })
    expect(panel()).toBeNull()
  })

  it('émet la date cliquée et se ferme (mode date)', async () => {
    const wrapper = mountPicker({ modelValue: '2026-08-28', mode: 'date' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    day('samedi 29 août').click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-29']])
    expect(panel()).toBeNull()
  })

  it('navigue entre les mois', async () => {
    const wrapper = mountPicker({ modelValue: '2026-08-28' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    byLabel('Mois suivant').click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.date-picker__month')?.textContent).toBe('septembre 2026')

    byLabel('Mois précédent').click()
    byLabel('Mois précédent').click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('.date-picker__month')?.textContent).toBe('juillet 2026')
  })

  it('n’affiche que le sélecteur d’heure en mode time, avec la valeur courante', async () => {
    const wrapper = mountPicker({ modelValue: '16:30', mode: 'time' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    expect(document.body.querySelector('.date-picker__calendar')).toBeNull()
    expect(digits('Heures')).toBe('16')
    expect(digits('Minutes')).toBe('30')
  })

  it('incrémente et décrémente les heures, en bouclant sur 24 h', async () => {
    const wrapper = mountPicker({ modelValue: '23:30', mode: 'time' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    byLabel('Heure suivante').click()
    byLabel('Heure précédente').click()
    await wrapper.setProps({ modelValue: '00:10' })
    byLabel('Heure précédente').click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['00:30'], ['22:30'], ['23:10']])
    expect(panel()).not.toBeNull()
  })

  it('avance les minutes par pas de 5 et reporte sur l’heure', async () => {
    const wrapper = mountPicker({ modelValue: '16:30', mode: 'time' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    byLabel('Minute suivante').click()
    await wrapper.setProps({ modelValue: '16:55' })
    byLabel('Minute suivante').click()
    await wrapper.setProps({ modelValue: '17:00' })
    byLabel('Minute précédente').click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['16:35'], ['17:00'], ['16:55']])
  })

  it('se cale sur le pas quand la minute actuelle n’en fait pas partie', async () => {
    const wrapper = mountPicker({ modelValue: '14:32', mode: 'time' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    byLabel('Minute suivante').click()
    byLabel('Minute précédente').click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['14:35'], ['14:30']])
  })

  it('respecte minuteStep', async () => {
    const wrapper = mountPicker({ modelValue: '14:00', mode: 'time', minuteStep: 15 })
    await wrapper.find('.date-picker__trigger').trigger('click')

    byLabel('Minute suivante').click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['14:15']])
  })

  it('combine date et heure en datetime', async () => {
    const wrapper = mountPicker({ modelValue: '2026-08-28T16:30', mode: 'datetime' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    day('samedi 29 août').click()
    byLabel('Heure suivante').click()

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-29T16:30'], ['2026-08-28T17:30']])
    expect(panel()).not.toBeNull()
  })

  it('ferme avec OK en mode time', async () => {
    const wrapper = mountPicker({ modelValue: '16:30', mode: 'time' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    Array.from(document.body.querySelectorAll<HTMLElement>('.date-picker__footer button'))
      .find((button) => button.textContent?.trim() === 'OK')!
      .click()
    await wrapper.vm.$nextTick()

    expect(panel()).toBeNull()
  })

  it('efface la valeur quand clearable, et ferme', async () => {
    const wrapper = mountPicker({ modelValue: '16:30', mode: 'time', clearable: true })
    await wrapper.find('.date-picker__trigger').trigger('click')

    Array.from(document.body.querySelectorAll<HTMLElement>('.date-picker__footer button'))
      .find((button) => button.textContent?.trim() === 'Effacer')!
      .click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(panel()).toBeNull()
  })

  it('se ferme au clic en dehors', async () => {
    const wrapper = mountPicker({ modelValue: '2026-08-28' })
    await wrapper.find('.date-picker__trigger').trigger('click')

    document.body.click()
    await wrapper.vm.$nextTick()

    expect(panel()).toBeNull()
  })

  it('ne s’ouvre pas quand il est désactivé', async () => {
    const wrapper = mountPicker({ modelValue: '', disabled: true })
    await wrapper.find('.date-picker__trigger').trigger('click')

    expect(panel()).toBeNull()
  })
})

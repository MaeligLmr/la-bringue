import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ConcertLineup from './ConcertLineup.vue'
import Select from '../../ui/Select/Select.vue'
import type { LineupEntry } from '../../../lib/links/links'

const { artisteHandler } = vi.hoisted(() => ({ artisteHandler: { getAll: vi.fn() } }))

vi.mock('../../../handlers/artiste', () => ({ artisteHandler }))
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

const AYA: LineupEntry = { id: 1, nom: 'Aya Nakamura', artiste_annonce: true, featuring: false }

async function mountLineup(lineup: LineupEntry[] = [AYA]) {
  const wrapper = mount(ConcertLineup, {
    props: {
      modelValue: lineup,
      'onUpdate:modelValue': (value: LineupEntry[]) => wrapper.setProps({ modelValue: value }),
    },
  })
  await flushPromises()
  return wrapper
}

function current(wrapper: Awaited<ReturnType<typeof mountLineup>>) {
  return wrapper.props('modelValue') as LineupEntry[]
}

function addButton(wrapper: Awaited<ReturnType<typeof mountLineup>>) {
  return wrapper.findAll('.admin-links__add button').find((button) => button.text() === 'Ajouter')!
}

function checkboxes(wrapper: Awaited<ReturnType<typeof mountLineup>>) {
  return wrapper.findAll('.admin-links__item input[type="checkbox"]')
}

beforeEach(() => {
  vi.clearAllMocks()
  artisteHandler.getAll.mockResolvedValue([
    { id_artiste: 2, nom: 'Angèle', photo: null, description: null, categorie: null },
    { id_artiste: 1, nom: 'Aya Nakamura', photo: null, description: null, categorie: null },
  ])
})

describe('ConcertLineup', () => {
  it('affiche les artistes du line-up avec leurs cases Annoncée et Featuring', async () => {
    const wrapper = await mountLineup()

    expect(wrapper.find('.admin-links__nom').text()).toBe('Aya Nakamura')
    expect(checkboxes(wrapper).map((box) => (box.element as HTMLInputElement).checked)).toEqual([true, false])
  })

  it('ne propose que les artistes absentes du line-up', async () => {
    const wrapper = await mountLineup()

    expect(wrapper.findComponent(Select).props('options')).toEqual([{ value: '2', label: 'Angèle' }])
  })

  it('ajoute une artiste, annoncée par défaut, avec ses options', async () => {
    const wrapper = await mountLineup()

    wrapper.findComponent(Select).vm.$emit('update:modelValue', '2')
    await wrapper.findAll('.admin-links__add input[type="checkbox"]')[1].setValue(true)
    await addButton(wrapper).trigger('click')

    expect(current(wrapper)).toEqual([AYA, { id: 2, nom: 'Angèle', artiste_annonce: true, featuring: true }])
  })

  it('met à jour les cases d’une artiste du line-up', async () => {
    const wrapper = await mountLineup()

    await checkboxes(wrapper)[1].setValue(true)

    expect(current(wrapper)).toEqual([{ ...AYA, featuring: true }])
  })

  it('retire une artiste du line-up', async () => {
    const wrapper = await mountLineup()

    await wrapper.find('[aria-label="Retirer Aya Nakamura du concert"]').trigger('click')

    expect(current(wrapper)).toEqual([])
  })

  it('n’envoie pas le formulaire du concert en ajoutant une artiste', async () => {
    const wrapper = await mountLineup()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(addButton(wrapper).attributes('type')).toBe('button')
  })
})

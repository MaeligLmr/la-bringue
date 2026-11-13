import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AdminForm from './AdminForm.vue'
import { PostgrestError } from '@supabase/supabase-js'
import { HandlerError } from '../../../handlers/crud'
import { ImageError } from '../../../lib/image/to-webp'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }))
const { toWebp } = vi.hoisted(() => ({ toWebp: vi.fn() }))
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../../../supabase.js', () => ({
  supabase: { storage: { from: () => ({ upload }) } },
}))
vi.mock('vue-sonner', () => ({ toast }))
vi.mock('../../../lib/image/to-webp.ts', async (importOriginal) => ({ ...(await importOriginal<object>()), toWebp }))

const ANGELE: Artiste = { id_artiste: 3, nom: 'Angèle', photo: '/programmation/angele.webp', description: 'Pop belge', categorie: 'pop' }

const FIELDS: AdminFormField<Artiste>[] = [
  { key: 'nom', label: 'Nom', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'categorie', label: 'Catégorie', type: 'select', options: [{ value: 'pop', label: 'Pop' }] },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'programmation' },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => (resolve = res))
  return { promise, resolve }
}

function makeHandler() {
  return {
    getById: vi.fn().mockResolvedValue(ANGELE),
    create: vi.fn().mockResolvedValue(ANGELE),
    update: vi.fn().mockResolvedValue(ANGELE),
  }
}

function mountForm(handler = makeHandler(), id?: number) {
  return mount(AdminForm<Artiste>, { props: { fields: FIELDS, handler, id } })
}

describe('AdminForm', () => {
  beforeEach(() => {
    upload.mockReset()
    // Par défaut : l'image est déjà prête (WebP), renvoyée telle quelle.
    toWebp.mockReset().mockImplementation(async (file: File) => file)
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('gère un champ numérique : valeur numérique, bornes, vide envoyé à null', async () => {
    const handler = makeHandler()
    const wrapper = mount(AdminForm<{ nom: string; prix: number | null }>, {
      props: {
        fields: [
          { key: 'nom', label: 'Nom', type: 'text', required: true },
          { key: 'prix', label: 'Prix', type: 'number', min: 0, max: 100 },
        ],
        handler: handler as never,
      },
    })
    const prix = wrapper.find('#admin-prix')

    expect(prix.attributes('type')).toBe('number')
    expect(prix.attributes('min')).toBe('0')
    expect(prix.attributes('max')).toBe('100')
    expect(prix.attributes('step')).toBe('any')

    await wrapper.find('#admin-nom').setValue('Pass')
    await prix.setValue('45.5')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(handler.create.mock.calls[0][0]).toEqual({ nom: 'Pass', prix: 45.5 })

    await prix.setValue('')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(handler.create.mock.calls[1][0]).toEqual({ nom: 'Pass', prix: null })
  })

  it('marque les champs obligatoires d’un astérisque, et eux seuls', () => {
    const wrapper = mountForm(makeHandler())

    const stars = wrapper.findAll('.form-field').map((field) => field.find('.form-field__required').exists())

    // Nom (obligatoire), puis description, catégorie et photo.
    expect(stars).toEqual([true, false, false, false])
    expect(wrapper.find('label[for="admin-nom"]').text()).toBe('Nom *')
    // L'astérisque est décoratif : le lecteur d'écran lit « Nom » seul.
    expect(wrapper.find('.form-field__required').attributes('aria-hidden')).toBe('true')
  })

  it('affiche un message sous un champ obligatoire vide, sans appel au serveur', async () => {
    const handler = makeHandler()
    const wrapper = mountForm(handler)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.form-field__error').text()).toBe('Ce champ est obligatoire.')
    expect(handler.create).not.toHaveBeenCalled()
  })

  it('crée l’élément, champs vides envoyés à null', async () => {
    const handler = makeHandler()
    const wrapper = mountForm(handler)

    await wrapper.find('#admin-nom').setValue('Angèle')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(handler.create).toHaveBeenCalledWith({ nom: 'Angèle', description: null, categorie: null, photo: null })
  })

  it('désactive le bouton pendant l’envoi, puis confirme par un toast et émet « saved »', async () => {
    const handler = makeHandler()
    const pending = deferred<Artiste>()
    handler.create.mockReturnValue(pending.promise)
    const wrapper = mountForm(handler)

    await wrapper.find('#admin-nom').setValue('Angèle')
    await wrapper.find('form').trigger('submit')

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toBe('Enregistrement…')

    pending.resolve(ANGELE)
    await flushPromises()

    expect(button.attributes('disabled')).toBeUndefined()
    expect(toast.success).toHaveBeenCalled()
    expect(wrapper.emitted('saved')).toEqual([[ANGELE]])
  })

  it('en édition, pré-remplit via getById et enregistre avec update', async () => {
    const handler = makeHandler()
    const wrapper = mountForm(handler, 3)
    await flushPromises()

    expect(handler.getById).toHaveBeenCalledWith(3)
    expect((wrapper.find('#admin-nom').element as HTMLInputElement).value).toBe('Angèle')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(handler.update).toHaveBeenCalledWith(3, {
      nom: 'Angèle',
      description: 'Pop belge',
      categorie: 'pop',
      photo: '/programmation/angele.webp',
    })
  })

  it('envoie l’image choisie dans Storage et enregistre son chemin', async () => {
    upload.mockResolvedValue({ data: {}, error: null })
    const handler = makeHandler()
    const wrapper = mountForm(handler)
    const input = wrapper.find('#admin-photo')
    const file = new File(['x'], 'IMG_4032.WEBP', { type: 'image/webp' })
    Object.defineProperty(input.element, 'files', { value: [file] })

    await wrapper.find('#admin-nom').setValue('Angèle')
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const path = upload.mock.calls[0][0] as string
    expect(path).toMatch(/^programmation\/angele-[0-9a-f]{8}\.webp$/)
    expect(handler.create.mock.calls[0][0].photo).toBe(`/${path}`)
  })

  it('convertit l’image en WebP avant de l’envoyer, avec le bon type MIME', async () => {
    upload.mockResolvedValue({ data: {}, error: null })
    toWebp.mockResolvedValue(new File(['webp'], 'Photo Angèle.webp', { type: 'image/webp' }))
    const handler = makeHandler()
    const wrapper = mountForm(handler)
    const input = wrapper.find('#admin-photo')
    const jpeg = new File(['x'], 'Photo Angèle.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [jpeg] })

    await wrapper.find('#admin-nom').setValue('Angèle')
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(toWebp).toHaveBeenCalledWith(jpeg)
    const [path, sent, options] = upload.mock.calls[0]
    expect(path).toMatch(/^programmation\/angele-[0-9a-f]{8}\.webp$/)
    expect((sent as File).type).toBe('image/webp')
    expect(options).toEqual({ contentType: 'image/webp' })
  })

  it('n’enregistre rien et prévient si la conversion échoue', async () => {
    toWebp.mockRejectedValue(new Error('boom'))
    const handler = makeHandler()
    const wrapper = mountForm(handler)
    const input = wrapper.find('#admin-photo')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] })

    await wrapper.find('#admin-nom').setValue('Angèle')
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(upload).not.toHaveBeenCalled()
    expect(handler.create).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })

  it('affiche le message précis quand l’image est trop lourde', async () => {
    toWebp.mockRejectedValue(new ImageError('L’image fait plus de 5 Mo en WebP, même compressée.'))
    const handler = makeHandler()
    const wrapper = mountForm(handler)
    const input = wrapper.find('#admin-photo')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] })

    await wrapper.find('#admin-nom').setValue('Angèle')
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('L’image fait plus de 5 Mo en WebP, même compressée.')
    expect(handler.create).not.toHaveBeenCalled()
  })

  it('affiche un message d’erreur lisible sur une HandlerError', async () => {
    const handler = makeHandler()
    handler.create.mockRejectedValue(
      new HandlerError('Artiste', new PostgrestError({ code: '42501', message: 'permission denied', details: '', hint: '' }))
    )
    const wrapper = mountForm(handler)

    await wrapper.find('#admin-nom').setValue('Angèle')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('L’enregistrement a échoué. Réessaie plus tard.')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('bloque l’envoi sur une règle de la page et affiche son message sous le champ', async () => {
    const handler = makeHandler()
    const rules = vi.fn((values: Record<string, unknown>) => ({
      description: values.description === 'interdit' ? 'Description refusée.' : undefined,
    }))
    const wrapper = mount(AdminForm<Artiste>, { props: { fields: FIELDS, handler, rules } })

    await wrapper.find('#admin-nom').setValue('Angèle')
    await wrapper.find('#admin-description').setValue('interdit')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.form-field__error').text()).toBe('Description refusée.')
    expect(handler.create).not.toHaveBeenCalled()
  })

  it('donne les valeurs en cours de saisie au contenu ajouté par la page', async () => {
    const wrapper = mount(AdminForm<Artiste>, {
      props: { fields: FIELDS, handler: makeHandler() },
      slots: { default: `<template #default="{ values }"><p class="apercu">{{ values.nom }}</p></template>` },
    })

    await wrapper.find('#admin-nom').setValue('Angèle')

    expect(wrapper.find('.apercu').text()).toBe('Angèle')
  })

  it('affiche l’avertissement calculé sur la saisie, sans bloquer l’envoi', async () => {
    const handler = makeHandler()
    const warning = (values: Record<string, unknown>) => (values.nom === 'Angèle' ? 'Déjà programmée ce jour-là.' : '')
    const wrapper = mount(AdminForm<Artiste>, { props: { fields: FIELDS, handler, warning } })

    expect(wrapper.find('.admin-form__warning').exists()).toBe(false)

    await wrapper.find('#admin-nom').setValue('Angèle')
    expect(wrapper.find('.admin-form__warning').text()).toBe('Déjà programmée ce jour-là.')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(handler.create).toHaveBeenCalled()
  })
})

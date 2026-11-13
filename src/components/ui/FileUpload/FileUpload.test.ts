import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUpload from './FileUpload.vue'

function makeFile(name = 'angele.webp', type = 'image/webp', size = 1024) {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function pickFile(wrapper: ReturnType<typeof mount>, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  return input.trigger('change')
}

describe('FileUpload', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('affiche la consigne de dépôt quand aucun fichier n’est choisi', () => {
    const wrapper = mount(FileUpload)
    expect(wrapper.text()).toContain('Glisse un fichier ici')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('affiche l’image actuelle et propose de la remplacer', () => {
    const wrapper = mount(FileUpload, { props: { currentUrl: '/a.webp' } })
    expect(wrapper.find('img').attributes('src')).toBe('/a.webp')
    expect(wrapper.text()).toContain('Remplacer l’image')
  })

  it('transmet l’id à l’input et applique accept', () => {
    const wrapper = mount(FileUpload, { props: { id: 'admin-photo', accept: 'image/png' } })
    const input = wrapper.find('#admin-photo')
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toBe('image/png')
  })

  it('émet le fichier choisi via le sélecteur', async () => {
    const wrapper = mount(FileUpload)
    const file = makeFile()
    await pickFile(wrapper, file)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([file])
  })

  it('affiche le nom, la taille et un aperçu du fichier choisi', () => {
    const wrapper = mount(FileUpload, { props: { modelValue: makeFile('angele.webp', 'image/webp', 2048) } })
    expect(wrapper.text()).toContain('angele.webp')
    expect(wrapper.text()).toContain('2 Ko')
    expect(wrapper.find('img').attributes('src')).toBe('blob:preview')
  })

  it('émet le fichier déposé par glisser-déposer', async () => {
    const wrapper = mount(FileUpload)
    const file = makeFile()
    const zone = wrapper.find('.file-upload__zone')

    await zone.trigger('dragenter')
    expect(zone.classes()).toContain('file-upload__zone--dragging')

    await zone.trigger('drop', { dataTransfer: { files: [file] } })
    expect(zone.classes()).not.toContain('file-upload__zone--dragging')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([file])
  })

  it('refuse un type de fichier non accepté', async () => {
    const wrapper = mount(FileUpload)
    await pickFile(wrapper, makeFile('doc.pdf', 'application/pdf'))
    expect(wrapper.find('[role="alert"]').text()).toContain('pas accepté')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('refuse un fichier trop volumineux', async () => {
    const wrapper = mount(FileUpload, { props: { maxSize: 1024 } })
    await pickFile(wrapper, makeFile('big.webp', 'image/webp', 5000))
    expect(wrapper.find('[role="alert"]').text()).toContain('dépasse')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('retire le fichier choisi', async () => {
    const wrapper = mount(FileUpload, { props: { modelValue: makeFile() } })
    await wrapper.find('button[aria-label="Retirer le fichier"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([undefined])
  })

  it('ignore les dépôts quand il est désactivé', async () => {
    const wrapper = mount(FileUpload, { props: { disabled: true } })
    await wrapper.find('.file-upload__zone').trigger('drop', { dataTransfer: { files: [makeFile()] } })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('libère l’URL d’aperçu au démontage', () => {
    const wrapper = mount(FileUpload, { props: { modelValue: makeFile() } })
    wrapper.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })
})

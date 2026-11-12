import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminTable from './AdminTable.vue'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

const ARTISTES: Artiste[] = [
  { id_artiste: 1, nom: 'Beyoncé', photo: null, description: null, categorie: 'Pop' },
  { id_artiste: 2, nom: 'Aya Nakamura', photo: null, description: null, categorie: 'RnB' },
  { id_artiste: 3, nom: 'Angèle', photo: null, description: null, categorie: 'Pop' },
]

const COLONNES: AdminTableColumn<Artiste>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'categorie', label: 'Catégorie', format: (value) => String(value).toUpperCase() },
]

function mountArtistes(props: Record<string, unknown> = {}) {
  return mount(AdminTable<Artiste>, {
    props: { items: ARTISTES, columns: COLONNES, rowKey: 'id_artiste', ...props },
  })
}

function rows(wrapper: ReturnType<typeof mountArtistes>) {
  return wrapper
    .findAll('tbody tr')
    .map((row) => row.findAll('td').slice(0, -1).map((cell) => cell.text()))
}

function button(wrapper: ReturnType<typeof mountArtistes>, label: string, index = 0) {
  return wrapper.findAll('button').filter((b) => b.text() === label)[index]
}

describe('AdminTable', () => {
  it('affiche les colonnes configurées pour une liste d’artistes', () => {
    const wrapper = mountArtistes()

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Nom', 'Catégorie', 'Actions'])
    expect(rows(wrapper)).toEqual([
      ['Beyoncé', 'POP'],
      ['Aya Nakamura', 'RNB'],
      ['Angèle', 'POP'],
    ])
  })

  it('filtre en temps réel par nom', async () => {
    const wrapper = mountArtistes()
    const input = wrapper.find('input[type="search"]')

    await input.setValue('angele')
    expect(rows(wrapper)).toEqual([['Angèle', 'POP']])

    await input.setValue('')
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('émet les actions Ajouter et Modifier avec la ligne concernée', async () => {
    const wrapper = mountArtistes()

    await button(wrapper, 'Ajouter').trigger('click')
    await button(wrapper, 'Modifier', 1).trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
    expect(wrapper.emitted('edit')).toEqual([[ARTISTES[1]]])
  })

  it('affiche le Loader pendant le chargement', () => {
    const wrapper = mountArtistes({ loading: true })

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('affiche l’état vide quand il n’y a rien à afficher', () => {
    const wrapper = mountArtistes({ items: [] })

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucun résultat.')
  })
})

describe('AdminTable (confirmation de suppression)', () => {
  function dialog() {
    return document.querySelector('[role="dialog"]')
  }

  function dialogButton(label: string) {
    const found = Array.from(dialog()?.querySelectorAll('button') ?? []).find((b) => b.textContent?.trim() === label)
    if (!found) throw new Error(`Bouton "${label}" introuvable dans la modale`)
    return found
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('demande confirmation en rappelant le nom, avant toute suppression', async () => {
    const wrapper = mountArtistes()

    await button(wrapper, 'Supprimer', 2).trigger('click')

    expect(dialog()?.textContent).toContain('« Angèle »')
    expect(wrapper.emitted('delete')).toBeUndefined()
    wrapper.unmount()
  })

  it('émet delete avec la ligne une fois la suppression confirmée', async () => {
    const wrapper = mountArtistes()

    await button(wrapper, 'Supprimer', 2).trigger('click')
    dialogButton('Supprimer').click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('delete')).toEqual([[ARTISTES[2]]])
    expect(dialog()).toBeNull()
    wrapper.unmount()
  })

  it('ne supprime rien quand on annule', async () => {
    const wrapper = mountArtistes()

    await button(wrapper, 'Supprimer', 2).trigger('click')
    dialogButton('Annuler').click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('delete')).toBeUndefined()
    expect(dialog()).toBeNull()
    wrapper.unmount()
  })
})

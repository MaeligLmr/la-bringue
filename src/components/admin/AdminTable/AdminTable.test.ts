import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
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

afterEach(() => vi.unstubAllGlobals())

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

  it('ne filtre rien lui-même : la recherche est transmise au parent, qui la fait côté serveur', async () => {
    const wrapper = mountArtistes()

    await wrapper.find('input[type="search"]').setValue('angele')

    expect(wrapper.emitted('update:search')?.at(-1)).toEqual(['angele'])
    expect(rows(wrapper)).toHaveLength(3)
  })

  it('reflète la recherche fournie par le parent (v-model:search)', () => {
    const wrapper = mountArtistes({ search: 'aya' })

    expect((wrapper.find('input[type="search"]').element as HTMLInputElement).value).toBe('aya')
  })

  it('émet les actions Ajouter et Modifier avec la ligne concernée', async () => {
    const wrapper = mountArtistes()

    await button(wrapper, 'Ajouter').trigger('click')
    await button(wrapper, 'Modifier', 1).trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
    expect(wrapper.emitted('edit')).toEqual([[ARTISTES[1]]])
  })

  it('affiche le Loader à la place du tableau pendant le premier chargement', () => {
    const wrapper = mountArtistes({ items: [], loading: true })

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Aucun résultat.')
  })

  it('garde le tableau et affiche le Loader dessous pendant le chargement de la suite', () => {
    const wrapper = mountArtistes({ loading: true, hasMore: true })

    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('charge la suite quand la sentinelle arrive à l’écran', async () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof notify) {
          notify = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    const wrapper = mountArtistes({ hasMore: true })
    await flushPromises()

    notify([{ isIntersecting: true }])

    expect(wrapper.emitted('load-more')).toHaveLength(1)
    expect(button(wrapper, 'Voir plus')).toBeUndefined()
  })

  it('propose « Voir plus » quand il reste des lignes (sans IntersectionObserver)', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const wrapper = mountArtistes({ hasMore: true })

    await button(wrapper, 'Voir plus').trigger('click')

    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })

  it('ne propose rien quand tout est chargé', () => {
    const wrapper = mountArtistes({ hasMore: false })

    expect(button(wrapper, 'Voir plus')).toBeUndefined()
  })

  it('propose de réessayer quand le chargement de la suite a échoué', async () => {
    const wrapper = mountArtistes({ failed: true, hasMore: true })

    expect(wrapper.find('[role="alert"]').text()).toContain('Impossible de charger la liste.')
    expect(button(wrapper, 'Voir plus')).toBeUndefined()

    await button(wrapper, 'Réessayer').trigger('click')

    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })

  it('affiche l’erreur plutôt que « Aucun résultat » si la première page échoue', () => {
    const wrapper = mountArtistes({ items: [], failed: true })

    expect(wrapper.text()).not.toContain('Aucun résultat.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
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

  it('affiche l’impact de la suppression calculé pour la ligne', async () => {
    const deleteImpact = vi.fn(async (artiste: Artiste) => [`12 personnes ont liké ${artiste.nom}`, 'Programmée sur 2 concerts'])
    const wrapper = mountArtistes({ deleteImpact })

    await button(wrapper, 'Supprimer', 2).trigger('click')
    await flushPromises()

    expect(deleteImpact).toHaveBeenCalledWith(ARTISTES[2])
    expect(dialog()?.textContent).toContain('12 personnes ont liké Angèle')
    expect(dialog()?.textContent).toContain('Programmée sur 2 concerts')
    wrapper.unmount()
  })

  it('signale un impact impossible à calculer sans bloquer la suppression', async () => {
    const wrapper = mountArtistes({ deleteImpact: vi.fn().mockRejectedValue(new Error('boom')) })

    await button(wrapper, 'Supprimer', 2).trigger('click')
    await flushPromises()
    expect(dialog()?.textContent).toContain("Impossible de calculer l'impact")

    dialogButton('Supprimer').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('delete')).toEqual([[ARTISTES[2]]])
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

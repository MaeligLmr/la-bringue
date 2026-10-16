import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

// Recherche en cours d'une liste, partagée entre FilterableList (qui la fournit)
// et les cartes qu'elle affiche (ContentCard, qui la lit pour surligner leur
// nom). Le slot #item appartient à la page : passer par provide/inject lui
// évite d'avoir à relayer la recherche à chaque carte.
const LIST_SEARCH_KEY: InjectionKey<Ref<string>> = Symbol('list-search')

// À appeler dans la liste qui possède le champ de recherche.
export function provideListSearch(search: Ref<string>) {
  provide(LIST_SEARCH_KEY, search)
}

// À appeler dans une carte. Hors d'une liste, rien n'est fourni : on renvoie
// une recherche vide, donc aucun surlignage.
export function useListSearch() {
  return inject(LIST_SEARCH_KEY, ref(''))
}

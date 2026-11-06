import { ref } from 'vue'

// Libellé de la page courante quand il dépend de données chargées (nom de
// l'artiste, de la conférence...) : la vue le pose, le fil d'Ariane le lit.
const breadcrumbTitle = ref<string | null>(null)

export function useBreadcrumbTitle() {
  return { breadcrumbTitle }
}

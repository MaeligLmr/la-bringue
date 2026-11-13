export interface AdminSection {
  // Nom de la route, et segment d'URL sous /admin.
  name: string
  path: string
  label: string
}

// Source unique des types de contenu gérés dans le back office : routes
// enfants de /admin et menu latéral d'AdminLayout. /admin ouvre la première.
export const ADMIN_SECTIONS: AdminSection[] = [
  { name: 'admin-artistes', path: 'artistes', label: 'Artistes' },
  { name: 'admin-concerts', path: 'concerts', label: 'Concerts' },
  { name: 'admin-conferences', path: 'conferences', label: 'Conférences' },
  { name: 'admin-intervenantes', path: 'intervenantes', label: 'Intervenantes' },
  { name: 'admin-exposants', path: 'exposants', label: 'Exposants' },
  { name: 'admin-actualites', path: 'actualites', label: 'Actualités' },
  { name: 'admin-formules', path: 'billetterie', label: 'Billetterie' },
  { name: 'admin-promotions', path: 'promotions', label: 'Promotions' },
]

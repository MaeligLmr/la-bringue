// Ancre stable d'une section à partir de son titre :
// « Accès & transport » → « acces-transport ». Sans titre exploitable, on
// retombe sur `section-<id>`. Partagée par la page qui pose les `id` et par
// les liens qui y pointent (ex. tuiles de l'accueil).
export function sectionAnchor(titre: string | null, id: number) {
  const slug = (titre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `section-${id}`
}

// Une actualité est visible du public quand sa date de publication est atteinte ;
// une date future (ou absente) la garde « en attente ». Même règle que dans les
// requêtes du site (handlers/actualite) et que la policy RLS de la table Actualite.
export function isPublished(datePublication: string | null, now = Date.now()): boolean {
  return datePublication !== null && new Date(datePublication).getTime() <= now
}

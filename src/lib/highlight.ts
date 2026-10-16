// Surlignage façon Ctrl+F, en trois étapes réparties dans le code :
//   1. ce fichier découpe un texte en morceaux « correspond / ne correspond pas »
//      à la recherche (splitMatches) ;
//   2. HighlightedText.vue rend chaque morceau, les correspondances dans un <mark> ;
//   3. la page (ex. InfosPratiquesView) compte ces <mark> dans le DOM pour
//      afficher « 2 / 5 » et passer d'un résultat à l'autre.
// La logique de comparaison vit ici, seule, pour pouvoir être testée sans DOM.

export interface TextSegment {
  text: string
  // true : ce morceau est une occurrence de la recherche (à surligner).
  match: boolean
}

// Nombre minimal de caractères avant de surligner : un seul caractère
// correspondrait à presque toute la page et n'aiderait pas à chercher.
// Aussi utilisé par la page pour savoir quand afficher le compteur.
export const MIN_QUERY_LENGTH = 2

// Replie un texte pour la comparaison : minuscules et sans accents
// (« Accès » → « acces »), pour qu'une recherche « acces » trouve « Accès ».
//
// Le repli se fait caractère par caractère et ne garde que le premier
// caractère de chaque décomposition : la chaîne repliée a donc EXACTEMENT la
// longueur de l'originale. C'est ce qui permet d'utiliser les indices trouvés
// dans le texte replié pour découper le texte affiché (qui, lui, garde ses
// accents et sa casse). Une normalisation globale (normalize + replace)
// changerait la longueur et décalerait les morceaux surlignés.
export function fold(text: string) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    // NFD sépare la lettre de son accent (« è » → « e » + accent) : on garde la lettre.
    out += (char.normalize('NFD')[0] ?? char).toLowerCase()[0] ?? char
  }
  return out
}

// Découpe `text` en morceaux consécutifs, ceux qui contiennent `query` étant
// marqués `match: true`. Mis bout à bout, les morceaux redonnent `text` à
// l'identique : seul le rendu change, jamais le contenu.
//
// Exemple : splitMatches('Accès à l’accès', 'ACCES') →
//   [{ Accès, true }, { ' à l’', false }, { accès, true }]
//
// Cas limites : pas de texte → [] ; recherche trop courte ou vide → un seul
// morceau non surligné.
export function splitMatches(text: string | null | undefined, query: string): TextSegment[] {
  if (!text) return []
  const needle = fold(query.trim())
  if (needle.length < MIN_QUERY_LENGTH) return [{ text, match: false }]

  // On cherche dans la version repliée, mais on découpe le texte d'origine
  // (mêmes indices, voir fold).
  const haystack = fold(text)
  const segments: TextSegment[] = []
  // `from` : début du morceau pas encore émis.
  let from = 0
  let index = haystack.indexOf(needle, from)
  while (index !== -1) {
    // Le texte entre deux occurrences est un morceau non surligné.
    if (index > from) segments.push({ text: text.slice(from, index), match: false })
    segments.push({ text: text.slice(index, index + needle.length), match: true })
    // On repart après l'occurrence : elles ne se chevauchent pas
    // (« aa » dans « aaa » ne compte qu'une fois).
    from = index + needle.length
    index = haystack.indexOf(needle, from)
  }
  // Reste du texte après la dernière occurrence.
  if (from < text.length) segments.push({ text: text.slice(from), match: false })
  return segments
}

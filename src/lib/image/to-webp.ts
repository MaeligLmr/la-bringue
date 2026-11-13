export const WEBP_TYPE = 'image/webp'
// Formats raster acceptés en entrée (le SVG et le GIF animé ne se convertissent pas sans perte).
export const IMAGE_INPUT_TYPES = ['image/jpeg', 'image/png', WEBP_TYPE]

// Poids maximal du fichier WebP envoyé dans Storage.
export const MAX_WEBP_BYTES = 5 * 1024 * 1024
// Garde-fou sur l'original (avant conversion) : au-delà, le décodage pèse trop sur le navigateur.
export const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024

// Erreur dont le message est destiné à l'utilisateur (à afficher tel quel).
export class ImageError extends Error {}

interface ToWebpOptions {
  /** Largeur max en pixels : une image plus large est réduite (ratio conservé). */
  maxWidth?: number
  /** Qualité d'encodage de départ, de 0 à 1. */
  quality?: number
  /** Poids max du WebP obtenu ; si besoin la qualité est baissée par paliers. */
  maxBytes?: number
}

// Paliers essayés quand le WebP dépasse `maxBytes`.
const FALLBACK_QUALITIES = [0.7, 0.55, 0.4]

function webpName(name: string) {
  const dot = name.lastIndexOf('.')
  return `${dot > 0 ? name.slice(0, dot) : name}.webp`
}

function formatMo(bytes: number) {
  return `${Number((bytes / 1024 / 1024).toFixed(1))} Mo`
}

// Le type MIME d'un fichier vient de son extension, pas de son contenu : on lit donc la
// signature (« RIFF…WEBP ») pour savoir si c'est vraiment du WebP.
export async function isWebp(blob: Blob) {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  return bytes.length === 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
}

function encode(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, WEBP_TYPE, quality))
}

// Convertit une image (JPEG, PNG…) en WebP dans le navigateur, avant l'envoi vers
// Storage, en vérifiant que le résultat ne dépasse pas `maxBytes`. Un fichier déjà en
// WebP est renvoyé tel quel (mais son poids est vérifié). Lève une ImageError si
// l'image est inutilisable ou reste trop lourde, une Error si le navigateur ne sait
// pas encoder en WebP.
export async function toWebp(
  file: File,
  { maxWidth = 1600, quality = 0.85, maxBytes = MAX_WEBP_BYTES }: ToWebpOptions = {}
): Promise<File> {
  const tooHeavy = () => new ImageError(`L’image fait plus de ${formatMo(maxBytes)} en WebP, même compressée. Choisis-en une plus légère.`)

  // Un « .webp » qui n'en est pas un (JPEG renommé…) est ré-encodé comme les autres.
  if (file.type === WEBP_TYPE && (await isWebp(file))) {
    if (file.size > maxBytes) throw tooHeavy()
    return file
  }
  if (!IMAGE_INPUT_TYPES.includes(file.type)) {
    throw new ImageError('Format d’image non pris en charge : utilise un JPEG, un PNG ou un WebP.')
  }

  // L'orientation EXIF est appliquée au décodage (photos prises en portrait).
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new ImageError('Impossible de lire cette image : le fichier est peut-être corrompu.')
  })
  try {
    const scale = Math.min(1, maxWidth / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Conversion en WebP impossible : canvas indisponible.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const q of [quality, ...FALLBACK_QUALITIES.filter((fallback) => fallback < quality)]) {
      const blob = await encode(canvas, q)
      // Un navigateur sans encodeur WebP retombe sur du PNG : on refuse plutôt que d'enregistrer un faux .webp.
      if (!blob || blob.type !== WEBP_TYPE || !(await isWebp(blob))) throw new Error('Conversion en WebP impossible : format non pris en charge par le navigateur.')
      if (blob.size <= maxBytes) return new File([blob], webpName(file.name), { type: WEBP_TYPE, lastModified: Date.now() })
    }
    throw tooHeavy()
  } finally {
    bitmap.close()
  }
}

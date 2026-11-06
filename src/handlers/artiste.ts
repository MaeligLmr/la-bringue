import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import type { Scene } from '../types/database/scene'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Artiste'

export type ArtisteResume = Pick<Artiste, 'id_artiste' | 'nom' | 'photo' | 'categorie'>

export interface ArtisteDetail extends Artiste {
  ConcertArtiste: (ConcertArtiste & { Concert: (Concert & { Scene: Scene | null }) | null })[]
}

export const artisteHandler = {
  ...createCrudHandler<Artiste, 'id_artiste'>(TABLE, 'id_artiste', 'id_artiste, nom, photo, categorie, description'),

  // Artiste + ses concerts (avec leur scène), pour la fiche détail.
  async getDetailById(id: number): Promise<ArtisteDetail | null> {
    return unwrap<ArtisteDetail | null>(
      TABLE,
      await supabase
        .from(TABLE)
        .select(
          'id_artiste, nom, photo, categorie, description, ConcertArtiste(id_artiste, id_concert, artiste_annonce, featuring, Concert(id_concert, id_scene, jour, heure_debut, heure_fin, Scene(id_scene, nom)))'
        )
        .eq('id_artiste', id)
        .maybeSingle()
    )
  },

  // `limit` : les suggestions n'ont besoin que de quelques artistes.
  async getByCategorie(categorie: string, limit?: number): Promise<ArtisteResume[]> {
    let query = supabase.from(TABLE).select('id_artiste, nom, photo, categorie').eq('categorie', categorie).order('nom')
    if (limit) query = query.limit(limit)
    return unwrap<ArtisteResume[]>(TABLE, await query)
  },
}

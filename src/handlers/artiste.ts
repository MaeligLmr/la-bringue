import { supabase } from '../supabase.js'
import type { Artiste } from '../types/database/artiste'
import type { Concert } from '../types/database/concert'
import type { ConcertArtiste } from '../types/database/concert-artiste'
import type { Scene } from '../types/database/scene'
import { createCrudHandler, unwrap } from './crud'

const TABLE = 'Artiste'

export interface ArtisteDetail extends Artiste {
  ConcertArtiste: (ConcertArtiste & { Concert: (Concert & { Scene: Scene | null }) | null })[]
}

export const artisteHandler = {
  ...createCrudHandler<Artiste, 'id_artiste'>(TABLE, 'id_artiste'),

  // Artiste + ses concerts (avec leur scène), pour la fiche détail.
  async getDetailById(id: number): Promise<ArtisteDetail | null> {
    return unwrap<ArtisteDetail | null>(
      TABLE,
      await supabase.from(TABLE).select('*, ConcertArtiste(*, Concert(*, Scene(*)))').eq('id_artiste', id).maybeSingle()
    )
  },

  async getByCategorie(categorie: string): Promise<Artiste[]> {
    return unwrap<Artiste[]>(TABLE, await supabase.from(TABLE).select('*').eq('categorie', categorie).order('nom'))
  },
}

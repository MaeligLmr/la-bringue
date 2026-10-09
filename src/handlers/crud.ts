import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../supabase.js'

export class HandlerError extends Error {
  readonly code: string

  constructor(table: string, error: PostgrestError) {
    super(`[${table}] ${error.message}`)
    this.name = 'HandlerError'
    this.code = error.code
  }
}

// Les colonnes générées par Postgres (identité, created_at) ne sont jamais
// envoyées à l'insertion ; tout le reste est optionnel car nullable en base.
export type Insert<Row, IdKey extends keyof Row> = Partial<Omit<Row, IdKey | 'created_at'>>
export type Update<Row, IdKey extends keyof Row> = Partial<Omit<Row, IdKey | 'created_at'>>

// Déballe la réponse Supabase : renvoie `data` ou lève une HandlerError, pour
// que les composants n'aient qu'un try/catch à gérer.
export function unwrap<T>(table: string, { data, error }: { data: unknown; error: PostgrestError | null }): T {
  if (error) throw new HandlerError(table, error)
  return data as T
}

export function createCrudHandler<Row, IdKey extends keyof Row & string>(table: string, idColumn: IdKey) {
  // Le client n'est pas typé avec le schéma : on repasse sur des types larges
  // pour les appels Supabase, la sûreté de type est portée par la signature.
  const column: string = idColumn

  return {
    async getAll(): Promise<Row[]> {
      return unwrap<Row[]>(table, await supabase.from(table).select('*').order(column))
    },

    async getById(id: Row[IdKey]): Promise<Row | null> {
      return unwrap<Row | null>(table, await supabase.from(table).select('*').eq(column, id).maybeSingle())
    },

    async create(values: Insert<Row, IdKey>): Promise<Row> {
      return unwrap<Row>(table, await supabase.from(table).insert(values as Record<string, unknown>).select().single())
    },

    async update(id: Row[IdKey], values: Update<Row, IdKey>): Promise<Row> {
      return unwrap<Row>(table, await supabase.from(table).update(values as Record<string, unknown>).eq(column, id).select().single())
    },

    async remove(id: Row[IdKey]): Promise<void> {
      unwrap(table, await supabase.from(table).delete().eq(column, id))
    },
  }
}

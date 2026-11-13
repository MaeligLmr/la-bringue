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

// Taille d'une page des listes paginées (voir usePaginatedList).
export const PAGE_SIZE = 5
// Taille d'une page des listes du back-office (plus large : on y parcourt tout).
export const ADMIN_PAGE_SIZE = 20

export interface Page<T> {
  rows: T[]
  // Vrai s'il reste des lignes après cette page.
  hasMore: boolean
}

// Intervalle PostgREST (bornes incluses) d'une page, avec UNE ligne de plus que
// demandé : si elle est là, il y a une page suivante — sans requête de
// comptage. À passer à .range(), puis la réponse à toPage().
export function pageRange(offset: number, pageSize = PAGE_SIZE): [number, number] {
  return [offset, offset + pageSize]
}

export function toPage<T>(rows: T[], pageSize = PAGE_SIZE): Page<T> {
  return { rows: rows.slice(0, pageSize), hasMore: rows.length > pageSize }
}

// Motif ilike « contient » : % et _ saisis par l'utilisateur sont littéraux.
export function containsPattern(search: string): string {
  return `%${search.trim().replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

// Page d'une table triée par nom, filtrée par recherche sur le nom (listes du back-office).
export function createNamePage<Row>(table: string, idColumn: string, columns: string, nameColumn = 'nom') {
  return async function getPage({
    offset,
    search = '',
    pageSize = PAGE_SIZE,
  }: {
    offset: number
    search?: string
    pageSize?: number
  }): Promise<Page<Row>> {
    let query = supabase.from(table).select(columns)
    if (search.trim()) query = query.ilike(nameColumn, containsPattern(search))
    // id en second critère : un ordre stable évite doublons et trous entre les pages.
    query = query.order(nameColumn).order(idColumn).range(...pageRange(offset, pageSize))
    return toPage(unwrap<Row[]>(table, await query), pageSize)
  }
}

// `columns` : colonnes lues (jamais '*'), au format du select Supabase.
export function createCrudHandler<Row, IdKey extends keyof Row & string>(
  table: string,
  idColumn: IdKey,
  columns: string
) {
  // Le client n'est pas typé avec le schéma : on repasse sur des types larges
  // pour les appels Supabase, la sûreté de type est portée par la signature.
  const column: string = idColumn

  return {
    async getAll(): Promise<Row[]> {
      return unwrap<Row[]>(table, await supabase.from(table).select(columns).order(column))
    },

    async getById(id: Row[IdKey]): Promise<Row | null> {
      return unwrap<Row | null>(table, await supabase.from(table).select(columns).eq(column, id).maybeSingle())
    },

    async create(values: Insert<Row, IdKey>): Promise<Row> {
      return unwrap<Row>(table, await supabase.from(table).insert(values as Record<string, unknown>).select(columns).single())
    },

    async update(id: Row[IdKey], values: Update<Row, IdKey>): Promise<Row> {
      return unwrap<Row>(table, await supabase.from(table).update(values as Record<string, unknown>).eq(column, id).select(columns).single())
    },

    async remove(id: Row[IdKey]): Promise<void> {
      unwrap(table, await supabase.from(table).delete().eq(column, id))
    },
  }
}

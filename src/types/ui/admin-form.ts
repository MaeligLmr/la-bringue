import type { SelectOption } from './select'

export type AdminFieldType = 'text' | 'textarea' | 'date' | 'time' | 'datetime' | 'select' | 'checkbox' | 'image'

export interface AdminFormField<T> {
  key: keyof T & string
  label: string
  type: AdminFieldType
  required?: boolean
  // Choix d'un champ « select ».
  options?: SelectOption[]
  // Dossier du bucket Storage « images » où envoyer le fichier d'un champ « image ».
  folder?: string
}

// Ce dont AdminForm a besoin d'un handler (voir createCrudHandler).
export interface AdminFormHandler<T> {
  getById(id: never): Promise<T | null>
  create(values: never): Promise<T>
  update(id: never, values: never): Promise<T>
}

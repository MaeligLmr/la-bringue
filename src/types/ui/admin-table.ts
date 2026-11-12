export interface AdminTableColumn<T> {
  key: keyof T & string
  label: string
  format?: (value: T[keyof T], item: T) => string
}

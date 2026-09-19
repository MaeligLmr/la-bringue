export class AuthTimeoutError extends Error {
  constructor() {
    super('Délai dépassé en attendant la réponse de Supabase.')
    this.name = 'AuthTimeoutError'
  }
}

export function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  const timeout = new Promise<T>((_resolve, reject) => {
    setTimeout(() => reject(new AuthTimeoutError()), ms)
  })

  return Promise.race([promise, timeout])
}

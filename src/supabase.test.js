import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('src/supabase.js - configuration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("lève une erreur explicite si VITE_SUPABASE_URL est manquante", async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_key')

    await expect(import('./supabase.js')).rejects.toThrow(/Configuration Supabase manquante/)
  })

  it("lève une erreur explicite si VITE_SUPABASE_PUBLISHABLE_KEY est manquante", async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')

    await expect(import('./supabase.js')).rejects.toThrow(/Configuration Supabase manquante/)
  })

  it('crée un client Supabase quand la configuration est complète', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_key')

    const { supabase } = await import('./supabase.js')

    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })
})

// Test d'intégration : vérifie que src/supabase.js parvient réellement à
// joindre le projet Supabase configuré dans .env.local (vrai appel réseau,
// contrairement aux tests ci-dessus qui sont mockés).
const hasEnv = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY)

describe.skipIf(!hasEnv)('src/supabase.js - connexion réelle', () => {
  it(
    'joint le endpoint REST de Supabase avec les identifiants configurés',
    async () => {
      // Repart d'un module frais : les tests de configuration ci-dessus ont
      // pu importer supabase.js avec des variables d'environnement stubées.
      vi.resetModules()
      const { supabase } = await import('./supabase.js')

      // Aucune table n'est requise : on veut seulement s'assurer que la requête
      // atteint Postgrest et reçoit une réponse structurée. Une erreur "table
      // introuvable" ou liée aux droits RLS prouve que la connexion fonctionne ;
      // seule une erreur réseau/DNS doit faire échouer ce test (identifiants
      // manquants ou invalides dans .env.local).
      let error
      try {
        ;({ error } = await supabase.from('__connection_probe__').select('id').limit(1))
      } catch (thrown) {
        error = thrown
      }

      if (error) {
        expect(error.message, `Impossible de joindre Supabase : ${error.message}`).not.toMatch(
          /fetch failed|ENOTFOUND|EAI_AGAIN|network/i
        )
      }
    },
    15000
  )
})

if (!hasEnv) {
  console.warn(
    "[supabase.test] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY absentes : test de connexion réelle ignoré."
  )
}

import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig(() => {
  // 'development' (not 'test') so .env.local is loaded too — Vite skips
  // .env.local for the 'test' mode by design, but our real Supabase
  // credentials live there for the integration test.
  const env = loadEnv('development', process.cwd(), '')

  return {
    plugins: [vue()],
    test: {
      environment: 'node',
      env,
    },
  }
})

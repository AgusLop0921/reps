import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Deployed as a GitHub Pages project site at https://<user>.github.io/reps/, so built asset
// URLs need the "/reps/" base. Dev server and tests stay at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/reps/' : '/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
}))

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// The Entry must stay fast and must not pay for the 3D runtime [04 §14].
// Three.js is therefore isolated into its own chunk so that route-level code
// splitting can keep it out of the initial payload.
const MANUAL_CHUNKS: Record<string, string[]> = {
  'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    // Honour an assigned PORT, falling back to 5173.
    //
    // Nothing here is pinned to a specific port — there are no OAuth
    // callbacks, webhooks or CORS allowlists to satisfy — so hardcoding one
    // only guarantees a collision when another dev server is already running.
    // 5173 stays the default so `npm run dev` is unchanged for a human.
    port: Number(process.env['PORT']) || 5173,
  },
  build: {
    // Surfaces regressions against the performance budget in the blueprint
    // rather than silently shipping them.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [chunk, packages] of Object.entries(MANUAL_CHUNKS)) {
            if (packages.some((pkg) => id.includes(`node_modules/${pkg}`))) {
              return chunk
            }
          }
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Explicit imports (`import { describe, it, expect } from 'vitest'`) rather
    // than globals, matching the explicit-import convention used everywhere
    // else in this codebase.
    globals: false,
  },
})

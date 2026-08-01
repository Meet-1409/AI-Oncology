import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// The Entry must stay fast and must not pay for the 3D runtime [04 §14].
// Three.js and the motion runtime are therefore isolated into their own chunks so
// that route-level code splitting can keep them out of the initial payload.
const MANUAL_CHUNKS: Record<string, string[]> = {
  'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
  'vendor-motion': ['motion'],
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
    port: 5173,
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
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ensure build doesn't fail due to type errors
    outDir: 'dist',
  },
  esbuild: {
    logLevel: 'silent', // Silences warnings from esbuild
  },
  server: {
    port: 8081,
    proxy: {
      "/api": {
        target: "https://api.sandbox.harborlockers.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
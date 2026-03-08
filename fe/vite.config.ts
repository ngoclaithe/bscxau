import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [

    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'sonner'],
          'state-vendor': ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    target: 'es2020',
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
  },
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase/app': path.resolve(__dirname, './src/firebase/compat/app.ts'),
      'firebase/auth': path.resolve(__dirname, './src/firebase/compat/auth.ts'),
      'firebase/firestore': path.resolve(__dirname, './src/firebase/compat/firestore.ts'),
      'firebase/storage': path.resolve(__dirname, './src/firebase/compat/storage.ts'),
    },
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
})

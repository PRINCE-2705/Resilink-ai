import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Ye import add karo

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Ye plugin yahan add karo
  ],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Allows network access to the development server
    port: 3000,  // Optional: specify a port; otherwise, Vite will pick one
  }
})

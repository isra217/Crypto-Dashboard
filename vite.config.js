import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Crypto-Dashboard/',   // 👈 replace with your github repo name
})


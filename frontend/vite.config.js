import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sslKeyPath  = path.resolve(__dirname, '../backend/ssl/key.pem');
const sslCertPath = path.resolve(__dirname, '../backend/ssl/cert.pem');
const sslExists   = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);
const useHttps = process.env.HTTPS === 'true' && sslExists;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 4000,
    allowedHosts: ['frontend-production-8bfbf.up.railway.app'],
    ...(useHttps ? { https: {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    } } : {}),
    // Local development proxy: production uses VITE_API_URL instead.
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:3000',  // Use 127.0.0.1 (works from any interface on same machine)
        changeOrigin: true,
        secure: false,  // Allow self-signed certificates
        rewrite: (path) => path
      },
      '/auth': {
        target: 'https://127.0.0.1:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://127.0.0.1:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4000,
    allowedHosts: ['frontend-production-8bfbf.up.railway.app']
  }
})

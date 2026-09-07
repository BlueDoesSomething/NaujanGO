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

// In production (node server.js / vite preview) all /api, /auth, /uploads and
// /socket.io requests are proxied to the backend so cookies stay same-origin.
const PROXY_TARGET = process.env.VITE_API_URL || 'https://backend-production-03ea.up.railway.app';
const sharedProxy = {
  '/api': { target: PROXY_TARGET, changeOrigin: true, secure: false, rewrite: (path) => path },
  '/auth': { target: PROXY_TARGET, changeOrigin: true, secure: false },
  '/uploads': { target: PROXY_TARGET, changeOrigin: true, secure: false },
  '/socket.io': { target: PROXY_TARGET, changeOrigin: true, secure: false, ws: true }
};
const devProxy = {
  '/api': { target: 'https://127.0.0.1:3000', changeOrigin: true, secure: false, rewrite: (path) => path },
  '/auth': { target: 'https://127.0.0.1:3000', changeOrigin: true, secure: false },
  '/uploads': { target: 'https://127.0.0.1:3000', changeOrigin: true, secure: false }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 4000,
    allowedHosts: ['frontend-production-8bfbf.up.railway.app', 'naujan-go.up.railway.app'],
    ...(useHttps ? { https: {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    } } : {}),
    // Local development proxy: production uses VITE_API_URL instead.
    proxy: devProxy
  },
  preview: {
    host: '0.0.0.0',
    port: 4000,
    allowedHosts: ['frontend-production-8bfbf.up.railway.app', 'naujan-go.up.railway.app'],
    proxy: sharedProxy
  }
})

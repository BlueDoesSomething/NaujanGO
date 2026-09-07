import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.FRONTEND_PORT ? Number(process.env.FRONTEND_PORT) : 4000;

const BACKEND_ORIGIN = (process.env.VITE_API_URL || 'https://backend-production-03ea.up.railway.app').replace(/\/+$/, '');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

const safeJoin = (base, urlPath) => {
  const decoded = decodeURIComponent(urlPath);
  const resolved = path.normalize(path.join(base, decoded));
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    return null;
  }
  return resolved;
};

const serveFile = (res, filePath, useCache) => {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': useCache ? 'public, max-age=31536000, immutable' : 'no-cache'
  });
  fs.createReadStream(filePath).pipe(res);
};

const PROXY_PREFIXES = ['/socket.io/', '/api/', '/auth/', '/uploads/', '/socket.io', '/api', '/auth', '/uploads'];

const proxyToBackend = (req, res, pathname) => {
  const backendUrl = new URL(`${BACKEND_ORIGIN}${pathname}${req.url.slice(pathname.length)}`);
  const proxyReq = https.request(backendUrl, { method: req.method, headers: { ...req.headers, host: backendUrl.host } }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end('Bad Gateway');
  });
  req.pipe(proxyReq);
};

// Forward Socket.IO WebSocket upgrades to the backend (same-origin transport).
const proxyUpgrade = (req, socket, head) => {
  const urlPath = req.url.split('?')[0];
  if (!urlPath.startsWith('/socket.io')) {
    socket.destroy();
    return;
  }

  const backendUrl = new URL(`${BACKEND_ORIGIN}${req.url}`);
  const proxyReq = https.request(backendUrl, {
    method: 'GET',
    headers: { ...req.headers, host: backendUrl.host }
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(`HTTP/1.1 101 ${proxyRes.statusMessage || 'Switching Protocols'}\r\n`);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((v) => socket.write(`${key}: ${v}\r\n`));
      else socket.write(`${key}: ${value}\r\n`);
    });
    socket.write('\r\n');
    proxySocket.write(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
  });

  proxyReq.on('response', (proxyRes) => {
    socket.write(`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage || ''}\r\n`);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((v) => socket.write(`${key}: ${v}\r\n`));
      else socket.write(`${key}: ${value}\r\n`);
    });
    socket.write('\r\n');
    proxyRes.pipe(socket);
  });

  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  const proxyPrefix = PROXY_PREFIXES.find((prefix) => urlPath.startsWith(prefix));
  if (proxyPrefix) {
    return proxyToBackend(req, res, proxyPrefix);
  }

  const isStaticAsset = urlPath.startsWith('/assets/');
  let filePath = safeJoin(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath, isStaticAsset);
  }

  if (path.extname(urlPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return serveFile(res, indexPath, false);
  }

  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('dist not found - run `npm run build` first');
});

server.on('upgrade', proxyUpgrade);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NaujanGO frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving ${DIST_DIR}`);
  console.log(`Proxying /uploads to ${BACKEND_ORIGIN}`);
});
import 'dotenv/config';
import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import selfsigned from 'selfsigned';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import chatbotRouter from './routes/chatbot.js';
import authRouter from './routes/auth.js';
import attractionsRouter from './routes/attractions.js';
import poisRouter from './routes/pois.js';
import routesRouter from './routes/routes.js';
import itineraryRouter from './routes/itinerary.js';
import languagesRouter from './routes/languages.js';
import weatherRouter from './routes/weather.js';
import bookingsRouter from './routes/bookings.js';
import hotelsRouter from './routes/hotels.js';
import restaurantsRouter from './routes/restaurants.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import ownerRouter from './routes/owner.js';
import messagesRouter from './routes/messages.js';
import wildlifeRouter from './routes/wildlife.js';
import aboutRouter from './routes/about.js';
import translationAdminRouter from './routes/translationAdmin.js';
import { trackVisitorCount } from './middleware/trackVisitor.js';
import detectLanguage from './middleware/detectLanguage.js';
import { SESSION_SECRET } from './config/security.js';
import { csrfProtection } from './middleware/csrf.js';
import { FRONTEND_URL } from './config/publicUrls.js';

const app = express();
const PORT = process.env.PORT || 3000;

/* 
import morgan from 'morgan';  // Commenting out morgan import to avoid ERR_MODULE_NOT_FOUND error
*/


// Middleware
// app.use(morgan('dev'));  // Commenting out morgan usage due to missing package error
// CORS configuration - restrict origins properly
const defaultAllowedOrigins = process.env.NODE_ENV === 'production'
  ? [FRONTEND_URL, 'https://frontend-production-8bfbf.up.railway.app']
  : ['http://localhost:4000', 'http://127.0.0.1:4000', 'https://localhost:4000', 'https://frontend-production-8bfbf.up.railway.app'];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const frontendOrigin = FRONTEND_URL;
const allowedOrigins = [...new Set([
  ...defaultAllowedOrigins,
  ...configuredOrigins,
  ...(frontendOrigin ? [frontendOrigin] : [])
])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive - allow localhost and IP addresses
    if (process.env.NODE_ENV === 'development') {
      if (/^https?:\/\/localhost(:[0-9]+)?$/.test(origin) || 
          /^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/.test(origin) ||
          /^https?:\/\/(192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.)[0-9.]+:[0-9]+$/.test(origin)) {
        return callback(null, true);
      }
    }
    
    // In production or if explicitly configured, use whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,  // Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Language', 'x-lookup-token'],
  maxAge: 600  // preflight cache 10 minutes
}));
app.use(cookieParser());
app.use(express.json());
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});
app.use(csrfProtection);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== CACHING MIDDLEWARE ===== 
// Cache headers for public API endpoints (1 hour for about content)
app.use((req, res, next) => {
  // No cache for about endpoints so admin changes appear immediately
  if (req.path.match(/^\/api\/(about|attractions|pois|languages)/)) {
    res.set('Cache-Control', 'no-store');
  }
  // Cache static assets for 24 hours
  else if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/i)) {
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
  }
  next();
});

// Choose HTTP or HTTPS based on environment
// Railway terminates TLS at its proxy; HTTPS is only needed for local development.
const USE_HTTPS = process.env.USE_HTTPS === 'true' && process.env.NODE_ENV !== 'production';

// Session middleware for OAuth
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: USE_HTTPS,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Visitor tracking middleware
app.use(trackVisitorCount);

// Language detection middleware (sets req.language)
app.use(detectLanguage);

// Routes
app.use('/api/chatbot', chatbotRouter);
app.use('/auth', authRouter); // OAuth routes without /api prefix
app.use('/api/auth', authRouter); // Regular auth routes with /api prefix
app.use('/api/attractions', attractionsRouter);
app.use('/api/pois', poisRouter);
app.use('/api/routes', routesRouter);
app.use('/api/itinerary', itineraryRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api', aboutRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', translationAdminRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/wildlife', wildlifeRouter);

// Payment callback redirects (for payment providers that don't support /api prefix)
app.get('/payments/success', (req, res) => {
  res.redirect(307, `/api/payments/success?${new URLSearchParams(req.query).toString()}`);
});
app.get('/payments/cancel', (req, res) => {
  res.redirect(307, `/api/payments/cancel?${new URLSearchParams(req.query).toString()}`);
});
app.get('/payments/stripe/success', (req, res) => {
  res.redirect(307, `/api/payments/success?${new URLSearchParams(req.query).toString()}`);
});
app.get('/payments/stripe/cancel', (req, res) => {
  res.redirect(307, `/api/payments/cancel?${new URLSearchParams(req.query).toString()}`);
});

// GCash Payment Redirects - with HTML auto-redirect for better compatibility
app.get('/payments/gcash/success', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Payment</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          // Auto-redirect after 1 second
          setTimeout(() => {
            window.location.href = '/api/payments/gcash/success?${query}';
          }, 1000);
        </script>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
          h1 { color: #333; margin: 0 0 20px 0; }
          p { color: #666; margin: 0; }
          .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Processing Your Payment</h1>
          <div class="spinner"></div>
          <p>Redirecting you back to Naujango...</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/payments/gcash/failed', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Failed</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(() => {
            window.location.href = '/api/payments/gcash/failed?${query}';
          }, 2000);
        </script>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
          h1 { color: #f5576c; margin: 0 0 10px 0; }
          p { color: #666; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Payment Failed</h1>
          <p>Your payment could not be processed.</p>
          <p>Returning to Naujango...</p>
        </div>
      </body>
    </html>
  `);
});

// GrabPay Payment Redirects - with HTML auto-redirect
app.get('/payments/grabpay/success', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Payment</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(() => {
            window.location.href = '/api/payments/grabpay/success?${query}';
          }, 1000);
        </script>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
          h1 { color: #333; margin: 0 0 20px 0; }
          p { color: #666; margin: 0; }
          .spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Processing Your Payment</h1>
          <div class="spinner"></div>
          <p>Redirecting you back to Naujango...</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/payments/grabpay/failed', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Failed</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          setTimeout(() => {
            window.location.href = '/api/payments/grabpay/failed?${query}';
          }, 2000);
        </script>
        <style>
          body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
          .container { text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
          h1 { color: #f5576c; margin: 0 0 10px 0; }
          p { color: #666; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Payment Failed</h1>
          <p>Your payment could not be processed.</p>
          <p>Returning to Naujango...</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/payments/paypal/success', (req, res) => {
  res.redirect(307, `/api/payments/paypal/success?${new URLSearchParams(req.query).toString()}`);
});
app.get('/payments/paypal/cancel', (req, res) => {
  res.redirect(307, `/api/payments/paypal/cancel?${new URLSearchParams(req.query).toString()}`);
});

// Xendit Sandbox Payment Page - shows test checkout UI
app.get('/payments/xendit/sandbox', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/payments/xendit/sandbox?${query}`);
});

// 🟢 NEW: Xendit payment redirect handlers
app.get('/payments/xendit/success', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/payments/xendit/success?${query}`);
});

app.get('/payments/xendit/failed', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/payments/xendit/failed?${query}`);
});

app.get('/payments/xendit/cancel', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/payments/xendit/cancel?${query}`);
});

// Payment Success Page - displays success message and redirects to booking history
app.get('/payment-success', (req, res) => {
  // the updated reference confirmation UI. Preserve all incoming
  // Redirect to the frontend payment success route which contains
  // query params (booking_id, provider, source_id, requires_reference, etc.).
  const frontendUrl = FRONTEND_URL;
  const qs = new URLSearchParams(req.query).toString();
  const target = `${frontendUrl}/payment-success${qs ? `?${qs}` : ''}`;
  return res.redirect(307, target);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend server for Chatbot is running');
});

import { initSocket } from './socket.js';

if (USE_HTTPS) {
  // Load or generate SSL certificates (dev)
  const sslDir = path.join(__dirname, 'ssl');
  const keyPath = path.join(sslDir, 'key.pem');
  const certPath = path.join(sslDir, 'cert.pem');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SSL certificates not found. Provide key.pem and cert.pem in backend/ssl for production.');
    }

    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true });
    }

    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, { keySize: 2048, days: 365 });
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
    console.log('✅ Generated self-signed SSL certificate in backend/ssl');
  }

  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  // Start HTTPS server
  const server = https.createServer(sslOptions, app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 HTTPS Server is running on https://localhost:${PORT}`);
    console.log(`🌐 Network access: https://<your-local-ip>:${PORT}`);
    console.log(`⚠️  Using self-signed certificate - your browser will show a security warning.`);
    console.log(`   This is normal for development. Click "Advanced" > "Proceed to localhost" to continue.`);
  });
  // Initialize socket.io
  initSocket(server, { sessionMiddleware, origin: allowedOrigins }).then(() => console.log('🔌 Socket.IO initialized (HTTPS)')).catch((e) => console.error('Failed to init Socket.IO', e));
} else {
  // Start HTTP server (default for development)
  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 HTTP Server is running on http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://<your-local-ip>:${PORT}`);
    console.log(`   To use HTTPS, set USE_HTTPS=true in your .env file`);
  });
  initSocket(server, { sessionMiddleware, origin: allowedOrigins }).then(() => console.log('🔌 Socket.IO initialized (HTTP)')).catch((e) => console.error('Failed to init Socket.IO', e));
}

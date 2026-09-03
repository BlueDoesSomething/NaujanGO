# Network Access Configuration Guide

## ✅ Configuration Complete

Your project is now configured to run on both localhost and across your local network.

## 🚀 How to Start

### 1. Start Backend (Port 3000)
```bash
cd backend
npm start
```

### 2. Start Frontend (Port 4000)
```bash
cd frontend
npm start
```

## 🌐 Access Points

### On the Host Machine (where servers are running):
- **Frontend**: http://localhost:4000
- **Backend**: http://localhost:3000

### From Other Devices on the Same Network:
- **Frontend**: http://YOUR_LOCAL_IP:4000
- **Backend**: http://YOUR_LOCAL_IP:3000

## 🔍 Find Your Local IP Address

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

### Example:
If your IP is `192.168.1.100`:
- Access frontend from phone/tablet: `http://192.168.1.100:4000`
- Backend API endpoint: `http://192.168.1.100:3000`

## 🔧 What Was Changed

### 1. Backend Server (server.js)
- **Changed**: Server now binds to `0.0.0.0` instead of default localhost
- **Why**: Allows accepting connections from any network interface
- **Impact**: Backend accessible from local network IPs

### 2. CORS Configuration (server.js)
- **Changed**: Added regex patterns for local network IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- **Why**: Allows frontend requests from network IPs, not just localhost
- **Impact**: No CORS errors when accessing from other devices

### 3. Frontend Environment (.env)
- **Changed**: Commented out `VITE_API_URL=http://localhost:3000`
- **Why**: Enables auto-detection in api.js to use browser's hostname
- **Impact**: Frontend automatically connects to backend using the same IP/hostname

### 4. Vite Configuration (vite.config.js)
- **Changed**: Set `host: '0.0.0.0'` and disabled HTTPS
- **Why**: Explicitly bind to all interfaces and match .env settings
- **Impact**: Vite dev server accessible from network

## 🎯 How It Works

The frontend's `api.js` has smart auto-detection:
```javascript
// If VITE_API_URL is not set, it auto-detects:
// - On localhost: uses http://localhost:3000
// - On network IP: uses http://192.168.1.100:3000 (your actual IP)
```

This means:
- ✅ Works on localhost without any changes
- ✅ Works on network IPs automatically
- ✅ No need to manually update URLs for each device

## 🔒 Security Notes

- This configuration is for **development only**
- Local network IPs (192.168.x.x, 10.x.x.x) are allowed by CORS
- For production, configure specific allowed origins in CORS settings
- HTTPS is currently disabled; enable it by setting `USE_HTTPS=true` in backend/.env

## 🧪 Testing

1. Start both servers
2. On host machine: Open http://localhost:4000
3. Find your local IP (e.g., 192.168.1.100)
4. On another device (phone/tablet): Open http://192.168.1.100:4000
5. Both should work identically

## 🐛 Troubleshooting

### Can't access from other devices?
- Check firewall settings (Windows Firewall may block ports 3000 and 4000)
- Ensure both devices are on the same network
- Verify your local IP hasn't changed

### CORS errors?
- Check backend console for CORS logs
- Verify the origin matches the allowed patterns in server.js

### Backend connection fails?
- Ensure backend is running and accessible at http://YOUR_IP:3000
- Check that `VITE_API_URL` is commented out in frontend/.env
- Clear browser cache and reload

## 📝 No Other Changes Required

All existing functionality remains intact:
- ✅ Authentication (Google, Facebook OAuth)
- ✅ Payment processing (PayPal, Stripe)
- ✅ Database connections
- ✅ File uploads
- ✅ All API routes
- ✅ Chatbot functionality

The changes are isolated to network binding and CORS configuration only.

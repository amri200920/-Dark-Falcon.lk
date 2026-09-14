# 🦅 Dark Falcon — Production Deployment Guide

## 1. Environment Configuration
Copy `.env.example` to `.env` and provide your production variables:
```bash
cp .env.example .env
```

## 2. Production Build
```bash
# Build React/Vite frontend bundle and TypeScript verification
npm run build
```

## 3. Production Process Manager (PM2 / Docker)
Run the production Node.js Express server:
```bash
# Start server
npm run start
```

## 4. Reverse Proxy (Nginx)
Configure Nginx to proxy HTTP requests and WebSockets:
```nginx
server {
    server_name darkfalcon.io;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

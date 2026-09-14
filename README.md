# 🦅 DARK FALCON

> **Connect. Create. Communicate.**
> An all-in-one sovereign social networking, real-time messaging, WebRTC calling, and AI communication platform.

![Dark Falcon Banner](/assets/brand/dark-falcon-logo.png)

---

## 🌟 Overview

Dark Falcon🦅 unites modern social networking with sovereign communications:
- **Social Networking & Feed**: High-res images, video media, 6 animated reactions (`Like`, `Love`, `Haha`, `Wow`, `Sad`, `Angry`), threaded comments, #hashtags and @mentions.
- **24-Hour Ephemeral Stories & Status**: Disappearing media stories with progress timer, viewers tracking, and direct story replies.
- **Dark Falcon Reels**: Vertical short video feed with snap scrolling, lazy autoplay via `IntersectionObserver`, and creator follow actions.
- **Real-Time Sovereign Messaging**: Authenticated WebSockets for text, emoji, file uploads, and browser voice messages with live Canvas audio waveforms.
- **WebRTC 1-to-1 Audio & Video Calls**: Peer-to-peer audio and video calls using native browser `RTCPeerConnection`, real STUN/TURN signaling, screen sharing, and procedural Web Audio ringtones.
- **Dark Falcon Meetings**: Instant and scheduled group video conferences with participant grid, active speaker highlighting, and host controls.
- **Sovereign Communities & Broadcast Channels**: Topic-based discussion hubs and 1-to-many official broadcast channels.
- **Dark Falcon AI 🦅**: Server-side Google Gemini neural intelligence for caption generation, trending hashtags, content rewriting, and chat assistance.
- **Cryptographic Security & App Lock**: 4-digit PIN lock for protected chats and inactivity timeouts, active hardware session manager with remote revocation.
- **Dual-Engine Persistence**: Production-ready Firebase Firestore integration adapter + zero-config local persistence engine that works out of the box.
- **Progressive Web App (PWA)**: Web manifest, service worker offline shell, installable desktop/mobile experience.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Installation
```bash
# Clone the repository and install dependencies
npm install
```

### 3. Start Development Servers
You can run the backend and frontend concurrently:

```bash
# Terminal 1: Launch Backend Server (Port 5000)
npm run server

# Terminal 2: Launch Vite Frontend Dev Server (Port 3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## ⚡ Demo Mode Access

To explore all platform features without registering, click **"Launch Demo Mode ⚡"** on the landing page or sign in with the preloaded pilot credentials:

- **Username / Email**: `cyber_falcon` (or `pilot@darkfalcon.io`)
- **Password**: `YOUR_LOCAL_DEMO_PASSWORD`

For Super Admin access (Admin Dashboard at `/admin`):
- **Username / Email**: `darkfalcon_admin` (or `admin@darkfalcon.io`)
- **Password**: `YOUR_LOCAL_ADMIN_PASSWORD`

---

## 🦅 Brand Assets & Official Logo

Dark Falcon utilizes the official uploaded brand asset:
- **Master Brand Logo**: `/public/assets/brand/dark-falcon-logo.png`
- **Falcon Emblem**: `/public/assets/brand/dark-falcon-emblem.png`
- **PWA Icons**: `/public/assets/brand/icon-192.png`, `/public/assets/brand/icon-512.png`
- **Component**: `<BrandLogo variant="full" | "compact" | "emblem" glow />`

---

## 🧪 Automated Testing

Run the automated test suite covering authentication, duplicate username checks, social feed operations, 24h stories filter, real-time messaging, and role security:

```bash
npm test
```

---

## 📚 Complete Technical Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Security & App Lock](docs/SECURITY.md)
- [Database & Firestore Architecture](docs/DATABASE.md)
- [WebRTC Calling & Dark Falcon Meetings](docs/WEBRTC.md)
- [Real-time WebSockets & Presence](docs/REALTIME.md)
- [Dark Falcon AI (Gemini Integration)](docs/AI.md)
- [Brand Identity & Logo Usage Rules](docs/BRANDING.md)
- [Production Deployment](docs/DEPLOYMENT.md)



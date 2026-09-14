# 🦅 Dark Falcon — System Architecture

## Architectural Layers

```text
┌────────────────────────────────────────────────────────────┐
│                    REACT 18/19 CLIENT                      │
│  Tailwind CSS • Lucide Icons • Web Audio API • WebRTC API  │
└──────────────┬───────────────────────────────┬─────────────┘
               │ HTTP REST                     │ WebSocket (ws)
               ▼                               ▼
┌────────────────────────────────────────────────────────────┐
│                  NODE.JS EXPRESS SERVER                    │
│  Auth Middleware • Rate Limiter • Error Handler • Multer   │
└───────┬─────────────────┬──────────────────────┬───────────┘
        │                 │                      │
        ▼                 ▼                      ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐
│ DUAL DB      │   │ GEMINI AI    │   │ WEBRTC SIGNALING     │
│ JSON Local + │   │ Server-side  │   │ Offer/Answer/ICE +   │
│ Firestore    │   │ SDK v0.24    │   │ STUN/TURN Relays     │
└──────────────┘   └──────────────┘   └──────────────────────┘
```

### 1. Presentation Tier (Client)
- **Framework**: React 18/19 with TypeScript, bundled via Vite.
- **Styling**: Tailwind CSS with custom Dark Falcon palette (Deep Black `#06080d`, Falcon Blue `#00a6ff`, Metallic Silver `#cbd5e1`).
- **State & Contexts**:
  - `AuthContext`: Manages user credentials, JWT sessions, App Lock PIN state.
  - `SocketContext`: Maintains authenticated WebSocket connection to `/ws`.
  - `CallContext`: Native browser WebRTC connection manager (`RTCPeerConnection`), audio/video tracks, and Web Audio synthesizer ringtones.
  - `ThemeContext`: Dark, Light, and System OS preference switcher.

### 2. Application Tier (Server)
- **Runtime**: Node.js with TypeScript (`tsx`).
- **Framework**: Express with modular REST controllers.
- **WebSockets**: Standard RFC 6455 `ws` library attached to `/ws`.
- **Security**: Argon2/bcrypt-compatible password hashing, stateless signed JWTs, in-memory sliding-window rate limiters, MIME-verified file uploads.

### 3. Persistence Tier (Dual Engine)
- **Local Engine**: File-persisted atomic JSON database (`src/server/data/db.json`) allowing zero-config execution.
- **Firebase Firestore Engine**: Production adapter using `firebase/config.ts`, `firestore.rules`, and composite indexes in `firestore.indexes.json`.

# 🦅 Dark Falcon — Real-time WebSockets & Presence

## WebSocket Architecture
- Endpoint: `ws://localhost:5000/ws?token=<JWT>`
- Heartbeat Ping/Pong every 30 seconds ensures stale sockets are closed.
- Real-time events:
  - `presence_change`: Broadcasts user online/offline status changes.
  - `new_message`: Pushes incoming direct and group chat messages.
  - `user_typing`: Relays typing indicators.
  - `new_notification`: Dispatches live notifications.
  - `call_incoming`, `call_accepted`, `call_rejected`, `call_ended`: WebRTC signaling.
  - `webrtc_offer`, `webrtc_answer`, `ice_candidate`: SDP and ICE candidate relays.
  - `meeting_join`, `meeting_leave`: Dark Falcon Meeting presence.

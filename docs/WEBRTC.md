# 🦅 Dark Falcon — WebRTC & Meetings Architecture

## 1. 1-to-1 Audio & Video Calling
- **Media Acquisition**: `navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo })`
- **Peer Connection**: Native `RTCPeerConnection` with STUN servers (`stun:stun.l.google.com:19302`) and optional TURN relays from `process.env.TURN_URL`.
- **Signaling via WebSockets**:
  1. `call_initiate`: Caller notifies receiver.
  2. `call_accept`: Receiver accepts call.
  3. `webrtc_offer`: Caller generates SDP offer and dispatches over WebSocket.
  4. `webrtc_answer`: Receiver accepts SDP offer, generates SDP answer, returns it.
  5. `ice_candidate`: Candidates exchanged until direct P2P media flow starts.
- **Screen Sharing**: `navigator.mediaDevices.getDisplayMedia({ video: true })` seamlessly replaces the active video track sender.
- **Synthesized Ringtones**: Procedural dual-frequency Web Audio synth (440Hz / 480Hz) plays on incoming/outgoing calls without loading external audio assets.

## 2. Dark Falcon Meetings (Group Calling)
- Instant room generation via shareable meeting code (`df-xxxx-xxxx`).
- Participant video grid with active camera feeds and mute controls.
- **SFU Scalability**: Documented integration for LiveKit / Mediasoup clusters for rooms exceeding peer mesh capacity.

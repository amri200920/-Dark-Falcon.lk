# 🦅 Dark Falcon — Security Architecture

## 1. Authentication & Session Security
- **Passwords**: Hashed with bcrypt (10 rounds of salting). Raw passwords are never persisted.
- **Sessions**: JWT tokens signed with a server-side secret with 7-day expiration.
- **Active Hardware Sessions**: Every login registers a hardware session (`device`, `browser`, `ip`, `lastActive`). Users can terminate other devices remotely from **Settings → Security**.

## 2. App Lock PIN Protection
- Users can configure a 4-digit PIN for device-level security.
- The PIN is salted and hashed before persistence.
- Auto-lock timer triggers after inactivity (1, 5, 15, or 30 minutes).
- Protected chats require the PIN to decrypt and reveal the conversation.

## 3. Rate Limiting
- **Authentication**: Max 15 attempts / minute to prevent brute-force attacks.
- **Dark Falcon AI**: Max 20 requests / minute per user/IP.
- **Standard API**: Max 120 requests / minute.

## 4. Role-Based Access Control (RBAC)
Server-side middleware strictly checks role permissions before granting access:
- `user`: Standard access to personal feed, messaging, and calls.
- `moderator`: Review user reports, remove offensive content.
- `admin`: Full administrative access to metrics, user accounts, and report moderation.
- `super_admin`: Full sovereign control, cannot be modified by standard admins.

## 5. Message Security Notice
> **Message Security Notice**:
> Messages in Dark Falcon are protected by transport layer security (TLS) and server-side authorization checks. True end-to-end encryption (E2EE) with client-side key pairs is architected in the data schema for future sovereign cryptographic extensions.

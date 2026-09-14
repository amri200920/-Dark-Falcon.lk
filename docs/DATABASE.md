# 🦅 Dark Falcon — Database & Firestore Model

## Firestore Collection Schema

```text
users/{userId}
  ├── username: string (unique, lowercase indexed)
  ├── email: string (unique, lowercase)
  ├── displayName: string
  ├── role: 'user' | 'moderator' | 'admin' | 'super_admin'
  ├── isVerified: boolean
  ├── isPrivate: boolean
  └── appLockPinHash: string

sessions/{sessionId}
  ├── userId: string
  ├── device: string
  ├── ip: string
  └── lastActive: timestamp

posts/{postId}
  ├── userId: string
  ├── content: string
  ├── mediaUrls: string[]
  ├── privacy: 'public' | 'followers' | 'close_friends' | 'only_me'
  ├── hashtags: string[]
  ├── likesCount: number
  └── reactions: Reaction[]

stories/{storyId}
  ├── userId: string
  ├── mediaUrl: string
  ├── expiresAt: timestamp (24h TTL)
  └── viewers: Viewer[]

conversations/{conversationId}
  ├── type: 'direct' | 'group'
  ├── participants: string[]
  ├── isLocked: boolean
  └── lastMessage: Message

messages/{messageId}
  ├── conversationId: string
  ├── senderId: string
  ├── type: 'text' | 'image' | 'video' | 'audio' | 'file'
  ├── content: string
  ├── attachment: Attachment
  └── status: 'sending' | 'sent' | 'delivered' | 'read'
```

## Dual-Engine Architecture
1. **Local Mode**: File-persisted atomic JSON storage in `src/server/data/db.json` ensures all functionality works instantly out of the box.
2. **Production Firebase Mode**: By supplying `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`, the system connects to Google Cloud Firestore with security rules enforced via `firebase/firestore.rules`.

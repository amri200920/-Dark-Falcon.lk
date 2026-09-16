// Dark Falcon Shared Types

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  createdAt: string;
  current?: boolean;
}

export * from './membership';
import { SubscriptionPlanId, SubscriptionStatus, VerificationStatus } from './membership';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role: UserRole;
  isVerified: boolean;
  isPrivate: boolean;
  isSuspended?: boolean;
  isBanned?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  lastSeen?: string;
  isOnline?: boolean;
  appLockPinHash?: string;
  appLockTimeout?: number; // minutes
  recoveryEmail?: string;
  recoveryQuestion?: string;
  recoveryAnswerHash?: string;
  recoveryKey?: string;
  firebaseUid?: string;
  authProvider?: 'password' | 'google' | 'firebase';
  tokenVersion?: number;
  hideOnlineStatus?: boolean;
  hideLastSeen?: boolean;
  hideReadReceipts?: boolean;
  e2eePublicKey?: string;
  membershipTier?: SubscriptionPlanId;
  membershipStatus?: SubscriptionStatus;
  trialUsed?: boolean;
  trialStart?: string;
  trialEnd?: string;
  verificationStatus?: VerificationStatus;
  subscriptionId?: string;
  closeFriends?: string[];
  defaultStoryAudience?: 'everyone' | 'followers' | 'close_friends' | 'selected';
}

export type PostPrivacy = 'public' | 'followers' | 'close_friends' | 'only_me';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | string;

export interface Reaction {
  userId: string;
  username: string;
  type: ReactionType;
  emoji?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  likesCount: number;
  reactions: Reaction[];
  createdAt: string;
  parentId?: string; // for nested replies
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatar?: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'text' | 'image' | 'video' | 'carousel';
  privacy: PostPrivacy;
  hashtags: string[];
  mentions: string[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  reactions: Reaction[];
  sharesCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  repostOf?: Post;
  repostUserId?: string;
  repostUsername?: string;
}

export interface StorySticker {
  type: 'emoji' | 'location' | 'mention' | 'poll';
  content: string;
  x?: number;
  y?: number;
}

export type StoryAudienceType = 'everyone' | 'followers' | 'close_friends' | 'selected';

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'text';
  textContent?: string;
  backgroundColor?: string;
  filter?: string;
  stickers?: StorySticker[];
  audienceType?: StoryAudienceType;
  allowedUserIds?: string[];
  excludedUserIds?: string[];
  viewers: { userId: string; username: string; viewedAt: string }[];
  reactions: Reaction[];
  expiresAt: string;
  createdAt: string;
}

export interface StoryHighlight {
  id: string;
  userId: string;
  username: string;
  title: string;
  coverUrl: string;
  storyIds: string[];
  stories?: Story[];
  createdAt: string;
  updatedAt: string;
}

export interface EphemeralStatus {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  mediaUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ShortVideo {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userAvatar?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  likesCount: number;
  likes?: string[]; // userIds who liked
  commentsCount: number;
  comments?: Comment[];
  sharesCount: number;
  viewsCount: number;
  filter?: string;
  audioTitle?: string;
  audioArtist?: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';


export interface MessageAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  duration?: number; // for audio voice notes
  waveform?: number[]; // for audio waveform rendering
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  attachment?: MessageAttachment;
  status: MessageStatus;
  reactions: Reaction[];
  replyToId?: string;
  replyToContent?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  expiresAt?: string; // disappearing messages
  isEncrypted?: boolean; // End-to-End Encrypted payload
  encryptedIv?: string; // AES-GCM Initialization Vector
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // for group
  avatarUrl?: string;
  participants: string[]; // userIds
  participantDetails?: Partial<User>[];
  admins?: string[];
  description?: string;
  lastMessage?: Message;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isLocked?: boolean; // App-lock / Hidden Chat
  disappearingTimer?: number; // seconds
  createdAt: string;
  updatedAt: string;
}

export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';

export interface CallLog {
  id: string;
  callerId: string;
  callerUsername: string;
  callerAvatar?: string;
  receiverId: string;
  receiverUsername: string;
  receiverAvatar?: string;
  type: CallType;
  status: CallStatus;
  duration: number; // in seconds
  startedAt: string;
  endedAt?: string;
}

export interface Meeting {
  id: string;
  title: string;
  hostId: string;
  hostUsername: string;
  meetingCode: string; // e.g. "df-abc-xyz"
  isInstant: boolean;
  scheduledTime?: string;
  isLocked: boolean;
  participants: {
    userId: string;
    username: string;
    avatarUrl?: string;
    role: 'host' | 'co-host' | 'participant';
    audioMuted: boolean;
    videoMuted: boolean;
    joinedAt: string;
  }[];
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  handle: string;
  description: string;
  category: string;
  avatarUrl?: string;
  coverUrl?: string;
  rules: string[];
  isPrivate: boolean;
  creatorId: string;
  membersCount: number;
  channels: { id: string; name: string; topic?: string }[];
  createdAt: string;
}

export interface BroadcastChannel {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatarUrl?: string;
  ownerId: string;
  ownerUsername: string;
  subscribersCount: number;
  isVerified: boolean;
  posts: {
    id: string;
    title?: string;
    content: string;
    mediaUrls?: string[];
    createdAt: string;
    reactions: Reaction[];
  }[];
  createdAt: string;
}

export type NotificationType =
  | 'follow'
  | 'follow_request'
  | 'like'
  | 'reaction'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'message'
  | 'call'
  | 'group_invite'
  | 'community_invite'
  | 'meeting_invite'
  | 'story_reply'
  | 'story_reaction'
  | 'repost';

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actorUsername: string;
  actorAvatar?: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemType: 'post' | 'video' | 'message';
  itemId: string;
  collectionName: string; // Favorites, Business, Inspiration, Personal, etc.
  itemData: any;
  savedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: 'user' | 'post' | 'comment' | 'message' | 'community' | 'channel';
  targetId: string;
  targetSnippet?: string;
  reason: 'spam' | 'scam' | 'harassment' | 'impersonation' | 'abuse' | 'sexual' | 'violence' | 'illegal' | 'other';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: string;
  timestamp: string;
}

export interface SystemConfigStatus {
  firebaseConfigured: boolean;
  geminiConfigured: boolean;
  stunTurnConfigured: boolean;
  sfuConfigured: boolean;
  smsConfigured: boolean;
  pushConfigured: boolean;
  environment: string;
}

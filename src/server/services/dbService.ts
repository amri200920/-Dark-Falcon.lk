import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserSession,
  Post,
  Comment,
  Reaction,
  Story,
  StoryHighlight,
  EphemeralStatus,
  ShortVideo,
  Conversation,
  Message,
  CallLog,
  Meeting,
  Community,
  BroadcastChannel,
  Notification,
  SavedItem,
  Report,
  AuditLog,
  Subscription,
  PaymentTransaction,
  VerificationApplication,
  MembershipSettings,
} from '../../shared/types';

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> passwordHash
  sessions: UserSession[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  highlights: StoryHighlight[];
  statuses: EphemeralStatus[];
  shortVideos: ShortVideo[];
  conversations: Conversation[];
  messages: Message[];
  callLogs: CallLog[];
  meetings: Meeting[];
  communities: Community[];
  channels: BroadcastChannel[];
  notifications: Notification[];
  savedItems: SavedItem[];
  reports: Report[];
  auditLogs: AuditLog[];
  follows: { followerId: string; followingId: string; createdAt: string }[];
  blocks: { blockerId: string; blockedId: string; createdAt: string }[];
  mutes: { userId: string; mutedUserId: string; createdAt: string }[];
  // Membership
  subscriptions: Subscription[];
  paymentTransactions: PaymentTransaction[];
  verificationApplications: VerificationApplication[];
  membershipSettings: MembershipSettings | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'src/server/data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
    this.seedDefaultsIfEmpty();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.highlights) parsed.highlights = [];
        return parsed;
      }
    } catch (err) {
      console.error('Failed to parse db.json, initializing fresh store:', err);
    }
    return {
      users: [],
      passwords: {},
      sessions: [],
      posts: [],
      comments: [],
      stories: [],
      highlights: [],
      statuses: [],
      shortVideos: [],
      conversations: [],
      messages: [],
      callLogs: [],
      meetings: [],
      communities: [],
      channels: [],
      notifications: [],
      savedItems: [],
      reports: [],
      auditLogs: [],
      follows: [],
      blocks: [],
      mutes: [],
      subscriptions: [],
      paymentTransactions: [],
      verificationApplications: [],
      membershipSettings: null,
    };
  }

public persist() {
  if (this.saveTimeout) clearTimeout(this.saveTimeout);

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

  private seedDefaultsIfEmpty() {
    if (this.data.users.length === 0) {
      console.log('🦅 Seeding initial Dark Falcon platform records...');
      const salt = bcrypt.genSaltSync(10);
      const defaultHash = bcrypt.hashSync(process.env.DEFAULT_ADMIN_PASSWORD || 'CHANGE_ME_ADMIN_PASSWORD', salt);
      const userHash = bcrypt.hashSync(process.env.DEFAULT_DEMO_PASSWORD || 'CHANGE_ME_DEMO_PASSWORD', salt);

      const adminUser: User = {
        id: 'user-falcon-admin',
        email: 'admin@darkfalcon.io',
        username: 'darkfalcon_admin',
        displayName: 'Dark Falcon HQ 🦅',
        bio: 'Official Dark Falcon Platform Command. Connect. Create. Communicate.',
        website: 'https://darkfalcon.io',
        avatarUrl: '/assets/brand/dark-falcon-logo.png',
        coverUrl: '/assets/brand/dark-falcon-logo.png',
        role: 'super_admin',
        isVerified: true,
        isPrivate: false,
        followersCount: 12480,
        followingCount: 15,
        postsCount: 3,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        isOnline: true,
      };

      const demoUser: User = {
        id: 'user-demo-falcon',
        email: 'pilot@darkfalcon.io',
        username: 'cyber_falcon',
        displayName: 'Falcon Aviator',
        bio: 'Cyber security architect, open-source enthusiast & tech explorer.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        role: 'user',
        isVerified: true,
        isPrivate: false,
        followersCount: 342,
        followingCount: 120,
        postsCount: 2,
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        isOnline: true,
      };

      this.data.users.push(adminUser, demoUser);
      this.data.passwords[adminUser.id] = defaultHash;
      this.data.passwords[demoUser.id] = userHash;

      // Seed Posts
      this.data.posts.push(
        {
          id: 'post-1',
          userId: adminUser.id,
          username: adminUser.username,
          userDisplayName: adminUser.displayName,
          userAvatar: adminUser.avatarUrl,
          content: 'Welcome to Dark Falcon🦅! The next-generation sovereign communication platform is now live. Connect. Create. Communicate with electric speed and peerless security.',
          mediaUrls: ['/assets/brand/dark-falcon-logo.png'],
          mediaType: 'image',
          privacy: 'public',
          hashtags: ['DarkFalcon', 'Launch', 'ConnectCreateCommunicate', 'NextGen'],
          mentions: [],
          likesCount: 1240,
          commentsCount: 2,
          reactions: [
            { userId: demoUser.id, username: demoUser.username, type: 'love', createdAt: new Date().toISOString() },
            { userId: adminUser.id, username: adminUser.username, type: 'like', createdAt: new Date().toISOString() }
          ],
          sharesCount: 384,
          savesCount: 195,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          isPinned: true,
        },
        {
          id: 'post-2',
          userId: demoUser.id,
          username: demoUser.username,
          userDisplayName: demoUser.displayName,
          userAvatar: demoUser.avatarUrl,
          content: 'Testing real-time WebRTC calling and Gemini AI writing assistants in Dark Falcon! The latency and audio waveform clarity is incredible. 🦅⚡',
          mediaUrls: [],
          mediaType: 'text',
          privacy: 'public',
          hashtags: ['WebRTC', 'GeminiAI', 'Realtime'],
          mentions: ['darkfalcon_admin'],
          likesCount: 88,
          commentsCount: 1,
          reactions: [
            { userId: adminUser.id, username: adminUser.username, type: 'wow', createdAt: new Date().toISOString() }
          ],
          sharesCount: 12,
          savesCount: 20,
          createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        }
      );

      // Seed Comments
      this.data.comments.push(
        {
          id: 'comment-1',
          postId: 'post-1',
          userId: demoUser.id,
          username: demoUser.username,
          userAvatar: demoUser.avatarUrl,
          content: 'Honored to be here from day one. Long live Dark Falcon! 🦅🔥',
          likesCount: 24,
          reactions: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'comment-2',
          postId: 'post-2',
          userId: adminUser.id,
          username: adminUser.username,
          userAvatar: adminUser.avatarUrl,
          content: 'Glad you are enjoying the ultra-low latency WebRTC stack! Keep building. ⚡',
          likesCount: 15,
          reactions: [],
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        }
      );

      // Seed 24h Stories
      this.data.stories.push(
        {
          id: 'story-1',
          userId: adminUser.id,
          username: adminUser.username,
          userAvatar: adminUser.avatarUrl,
          mediaUrl: '/assets/brand/dark-falcon-logo.png',
          mediaType: 'image',
          textContent: 'Official Dark Falcon System Launch',
          viewers: [{ userId: demoUser.id, username: demoUser.username, viewedAt: new Date().toISOString() }],
          reactions: [],
          expiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
        {
          id: 'story-2',
          userId: demoUser.id,
          username: demoUser.username,
          userAvatar: demoUser.avatarUrl,
          mediaUrl: '',
          mediaType: 'text',
          textContent: 'Exploring Dark Falcon AI caption features! ⚡🦅',
          backgroundColor: '#00477a',
          viewers: [],
          reactions: [],
          expiresAt: new Date(Date.now() + 22 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        }
      );

      // Seed Short Videos (Reels)
      this.data.shortVideos.push(
        {
          id: 'video-1',
          userId: adminUser.id,
          username: adminUser.username,
          userDisplayName: adminUser.displayName,
          userAvatar: adminUser.avatarUrl,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-and-connections-41879-large.mp4',
          thumbnailUrl: '/assets/brand/dark-falcon-logo.png',
          caption: 'Inside the neural core of Dark Falcon 🦅⚡ #Cyber #Future #Tech',
          hashtags: ['Cyber', 'Future', 'Tech'],
          likesCount: 540,
          commentsCount: 32,
          sharesCount: 110,
          viewsCount: 2390,
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
        {
          id: 'video-2',
          userId: demoUser.id,
          username: demoUser.username,
          userDisplayName: demoUser.displayName,
          userAvatar: demoUser.avatarUrl,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
          thumbnailUrl: '/assets/brand/dark-falcon-logo.png',
          caption: 'Falcon view from the skies. High speed & freedom. 🦅🌅',
          hashtags: ['Aviation', 'Sunset', 'DarkFalcon'],
          likesCount: 310,
          commentsCount: 18,
          sharesCount: 45,
          viewsCount: 1420,
          createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        }
      );

      // Seed Communities
      this.data.communities.push(
        {
          id: 'comm-1',
          name: 'Dark Falcon Developers',
          handle: 'falcon-devs',
          description: 'The official collective of engineers building on the Dark Falcon ecosystem.',
          category: 'Technology',
          avatarUrl: '/assets/brand/dark-falcon-logo.png',
          rules: ['Be respectful', 'No spam', 'Share verified code'],
          isPrivate: false,
          creatorId: adminUser.id,
          membersCount: 1420,
          channels: [
            { id: 'ch-announcements', name: 'announcements', topic: 'Core releases and updates' },
            { id: 'ch-general', name: 'general', topic: 'Architecture and WebRTC discussions' },
            { id: 'ch-showcase', name: 'showcase', topic: 'Show what you created' },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'comm-2',
          name: 'Cyber Security Operations',
          handle: 'cyber-ops',
          description: 'Encryption, decentralized infrastructure, and sovereign communication.',
          category: 'Science',
          avatarUrl: '/assets/brand/dark-falcon-logo.png',
          rules: ['Responsible disclosure only', 'Encrypted mindset'],
          isPrivate: false,
          creatorId: demoUser.id,
          membersCount: 890,
          channels: [
            { id: 'ch-threat-intel', name: 'threat-intel', topic: 'Global security feeds' },
            { id: 'ch-privacy', name: 'privacy', topic: 'Hardening personal telemetry' },
          ],
          createdAt: new Date().toISOString(),
        }
      );

      // Seed Broadcast Channels
      this.data.channels.push(
        {
          id: 'channel-hq',
          name: 'Dark Falcon Official Broadcast 🦅',
          handle: 'darkfalcon_news',
          description: 'Official announcements, release notes, and updates straight from Dark Falcon HQ.',
          avatarUrl: '/assets/brand/dark-falcon-logo.png',
          ownerId: adminUser.id,
          ownerUsername: adminUser.username,
          subscribersCount: 25400,
          isVerified: true,
          posts: [
            {
              id: 'bp-1',
              title: 'Welcome to Dark Falcon 1.0 Launch Edition',
              content: 'We are thrilled to roll out our all-in-one platform featuring end-to-end WebRTC calling, Gemini AI integration, real-time messaging, and PWA capabilities. Connect. Create. Communicate.',
              mediaUrls: ['/assets/brand/dark-falcon-logo.png'],
              createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
              reactions: [
                { userId: demoUser.id, username: demoUser.username, type: 'love', createdAt: new Date().toISOString() }
              ],
            }
          ],
          createdAt: new Date().toISOString(),
        }
      );

      // Seed Sample Direct Conversation
      const convoId = 'convo-admin-demo';
      this.data.conversations.push({
        id: convoId,
        type: 'direct',
        participants: [adminUser.id, demoUser.id],
        isMuted: false,
        isPinned: true,
        unreadCount: 0,
        lastMessage: {
          id: 'msg-welcome-1',
          conversationId: convoId,
          senderId: adminUser.id,
          senderUsername: adminUser.username,
          senderAvatar: adminUser.avatarUrl,
          type: 'text',
          content: 'Welcome to Dark Falcon! Feel free to test real-time messages, audio notes, and WebRTC video calls.',
          status: 'read',
          reactions: [],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      });

      this.data.messages.push({
        id: 'msg-welcome-1',
        conversationId: convoId,
        senderId: adminUser.id,
        senderUsername: adminUser.username,
        senderAvatar: adminUser.avatarUrl,
        type: 'text',
        content: 'Welcome to Dark Falcon! Feel free to test real-time messages, audio notes, and WebRTC video calls.',
        status: 'read',
        reactions: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      });

      // Seed Notification
      this.data.notifications.push({
        id: 'notif-1',
        recipientId: demoUser.id,
        actorId: adminUser.id,
        actorUsername: adminUser.username,
        actorAvatar: adminUser.avatarUrl,
        type: 'follow',
        title: 'New Follower',
        body: 'Dark Falcon HQ 🦅 started following you.',
        link: `/profile/${adminUser.username}`,
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      });

      this.persist();
      console.log('🦅 Seeding complete.');
    }
  }

  // --- Users & Auth ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsername(username: string): User | undefined {
    const clean = username.toLowerCase().trim();
    return this.data.users.find((u) => u.username.toLowerCase() === clean);
  }

  public findUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    return this.data.users.find((u) => u.email.toLowerCase() === clean);
  }

  public findUserByFirebaseUid(firebaseUid: string): User | undefined {
    return this.data.users.find((u) => u.firebaseUid === firebaseUid);
  }

  public createUser(user: User, passwordPlain: string): User {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(passwordPlain, salt);
    this.data.users.push(user);
    this.data.passwords[user.id] = hash;
    this.persist();
    return user;
  }

  public verifyPassword(userId: string, passwordPlain: string): boolean {
    const hash = this.data.passwords[userId];
    if (!hash) return false;
    return bcrypt.compareSync(passwordPlain, hash);
  }

  public updateUserPassword(userId: string, newPasswordPlain: string): boolean {
    const salt = bcrypt.genSaltSync(10);
    this.data.passwords[userId] = bcrypt.hashSync(newPasswordPlain, salt);
    this.persist();
    return true;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    delete this.data.passwords[id];
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== id);
    this.data.notifications = this.data.notifications.filter((n) => n.recipientId !== id);
    this.data.savedItems = this.data.savedItems.filter((s) => s.userId !== id);
    this.persist();
    return true;
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  // --- Sessions ---
  public createSession(session: UserSession): UserSession {
    this.data.sessions.push(session);
    this.persist();
    return session;
  }

  public getUserSessions(userId: string): UserSession[] {
    return this.data.sessions.filter((s) => s.userId === userId);
  }

  public removeSession(sessionId: string): boolean {
    const prevLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.id !== sessionId);
    if (this.data.sessions.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public removeOtherSessions(userId: string, currentSessionId: string): void {
    this.data.sessions = this.data.sessions.filter(
      (s) => s.userId !== userId || s.id === currentSessionId
    );
    this.persist();
  }

  // --- Follows & Blocks ---
  public isFollowing(followerId: string, followingId: string): boolean {
    return this.data.follows.some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }

  public followUser(followerId: string, followingId: string): boolean {
    if (followerId === followingId) return false;
    if (this.isFollowing(followerId, followingId)) return true;
    this.data.follows.push({
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    });
    // update counts
    const follower = this.findUserById(followerId);
    const following = this.findUserById(followingId);
    if (follower) follower.followingCount = (follower.followingCount || 0) + 1;
    if (following) following.followersCount = (following.followersCount || 0) + 1;
    this.persist();
    return true;
  }

  public unfollowUser(followerId: string, followingId: string): boolean {
    const prev = this.data.follows.length;
    this.data.follows = this.data.follows.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    );
    if (this.data.follows.length !== prev) {
      const follower = this.findUserById(followerId);
      const following = this.findUserById(followingId);
      if (follower && follower.followingCount > 0) follower.followingCount -= 1;
      if (following && following.followersCount > 0) following.followersCount -= 1;
      this.persist();
      return true;
    }
    return false;
  }

  public isBlocked(blockerId: string, blockedId: string): boolean {
    return this.data.blocks.some(
      (b) => (b.blockerId === blockerId && b.blockedId === blockedId) ||
             (b.blockerId === blockedId && b.blockedId === blockerId)
    );
  }

  public blockUser(blockerId: string, blockedId: string): boolean {
    if (!this.data.blocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) {
      this.data.blocks.push({ blockerId, blockedId, createdAt: new Date().toISOString() });
      this.unfollowUser(blockerId, blockedId);
      this.unfollowUser(blockedId, blockerId);
      this.persist();
    }
    return true;
  }

  public unblockUser(blockerId: string, blockedId: string): boolean {
    this.data.blocks = this.data.blocks.filter(
      (b) => !(b.blockerId === blockerId && b.blockedId === blockedId)
    );
    this.persist();
    return true;
  }

  // --- Posts & Feed ---
  public getFeed(currentUserId?: string, limit = 20, offset = 0): Post[] {
    const blockedUserIds = new Set<string>();
    if (currentUserId) {
      this.data.blocks.forEach((b) => {
        if (b.blockerId === currentUserId) blockedUserIds.add(b.blockedId);
        if (b.blockedId === currentUserId) blockedUserIds.add(b.blockerId);
      });
    }

    const filtered = this.data.posts
      .filter((p) => !blockedUserIds.has(p.userId))
      .filter((p) => {
        if (p.privacy === 'public') return true;
        if (!currentUserId) return false;
        if (p.userId === currentUserId) return true;
        if (p.privacy === 'followers') return this.isFollowing(currentUserId, p.userId);
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered.slice(offset, offset + limit);
  }

  public getPostById(id: string): Post | undefined {
    return this.data.posts.find((p) => p.id === id);
  }

  public createPost(post: Post): Post {
    this.data.posts.unshift(post);
    const user = this.findUserById(post.userId);
    if (user) user.postsCount = (user.postsCount || 0) + 1;
    this.persist();
    return post;
  }

  public deletePost(postId: string, userId: string, isAdmin = false): boolean {
    const index = this.data.posts.findIndex((p) => p.id === postId);
    if (index === -1) return false;
    const post = this.data.posts[index];
    if (post.userId !== userId && !isAdmin) return false;

    this.data.posts.splice(index, 1);
    this.data.comments = this.data.comments.filter((c) => c.postId !== postId);
    const user = this.findUserById(post.userId);
    if (user && user.postsCount > 0) user.postsCount -= 1;
    this.persist();
    return true;
  }

  public togglePostReaction(postId: string, reaction: Reaction): Post | null {
    const post = this.getPostById(postId);
    if (!post) return null;

    const existingIndex = post.reactions.findIndex((r) => r.userId === reaction.userId);
    if (existingIndex > -1) {
      if (post.reactions[existingIndex].type === reaction.type) {
        // remove
        post.reactions.splice(existingIndex, 1);
      } else {
        // change reaction type
        post.reactions[existingIndex] = reaction;
      }
    } else {
      post.reactions.push(reaction);
    }
    post.likesCount = post.reactions.length;
    this.persist();
    return post;
  }

  public getFollowingFeed(currentUserId: string, limit = 20, offset = 0): Post[] {
    const followingIds = new Set(
      this.data.follows.filter((f) => f.followerId === currentUserId).map((f) => f.followingId)
    );
    followingIds.add(currentUserId);

    const filtered = this.data.posts
      .filter((p) => followingIds.has(p.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered.slice(offset, offset + limit);
  }

  public updatePost(postId: string, userId: string, updates: Partial<Post>): Post | null {
    const post = this.getPostById(postId);
    if (!post || post.userId !== userId) return null;
    if (updates.content !== undefined) post.content = updates.content;
    if (updates.privacy !== undefined) post.privacy = updates.privacy;
    if (updates.location !== undefined) post.location = updates.location;
    post.updatedAt = new Date().toISOString();
    this.persist();
    return post;
  }

  public togglePinPost(postId: string, userId: string, isAdmin = false): Post | null {
    const post = this.getPostById(postId);
    if (!post) return null;
    if (post.userId !== userId && !isAdmin) return null;
    post.isPinned = !post.isPinned;
    post.updatedAt = new Date().toISOString();
    this.persist();
    return post;
  }

  public repostPost(originalPostId: string, user: User, quoteComment?: string): Post | null {
    const originalPost = this.getPostById(originalPostId);
    if (!originalPost) return null;

    originalPost.sharesCount = (originalPost.sharesCount || 0) + 1;

    const repost: Post = {
      id: `repost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      userDisplayName: user.displayName,
      userAvatar: user.avatarUrl,
      content: quoteComment || '',
      mediaUrls: originalPost.mediaUrls || [],
      mediaType: originalPost.mediaType || 'text',
      privacy: 'public',
      hashtags: originalPost.hashtags || [],
      mentions: originalPost.mentions || [],
      likesCount: 0,
      commentsCount: 0,
      reactions: [],
      sharesCount: 0,
      savesCount: 0,
      repostOf: originalPost,
      repostUserId: user.id,
      repostUsername: user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.posts.unshift(repost);
    const dbUser = this.findUserById(user.id);
    if (dbUser && dbUser.postsCount !== undefined) dbUser.postsCount += 1;
    this.persist();
    return repost;
  }

  // --- Comments ---
  public getPostComments(postId: string): Comment[] {
    return this.data.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(comment: Comment): Comment {
    this.data.comments.push(comment);
    const post = this.getPostById(comment.postId);
    if (post) post.commentsCount = (post.commentsCount || 0) + 1;
    this.persist();
    return comment;
  }

  // --- Stories (24h Ephemeral) ---
  public getActiveStories(viewerUserId?: string): Story[] {
    const now = new Date().getTime();
    const active = this.data.stories.filter((s) => new Date(s.expiresAt).getTime() > now);
    
    // If no viewer or viewer not logged in, only show public 'everyone' stories
    return active.filter((story) => {
      // Story creator can always see their own story
      if (viewerUserId && story.userId === viewerUserId) {
        return true;
      }

      // Check if viewer is blocked by or has blocked the story creator
      if (viewerUserId && this.isBlocked(viewerUserId, story.userId)) {
        return false;
      }

      // Check if viewer is explicitly excluded ("Hide Story From")
      if (viewerUserId && story.excludedUserIds && story.excludedUserIds.includes(viewerUserId)) {
        return false;
      }

      const audience = story.audienceType || 'everyone';

      if (audience === 'everyone') {
        return true;
      }

      // All restricted audiences require a logged-in viewer
      if (!viewerUserId) {
        return false;
      }

      if (audience === 'followers') {
        // Viewer must follow the story author
        return this.isFollowing(viewerUserId, story.userId);
      }

      if (audience === 'close_friends') {
        // Viewer must be in the creator's close friends list
        const creator = this.findUserById(story.userId);
        return Boolean(creator?.closeFriends && creator.closeFriends.includes(viewerUserId));
      }

      if (audience === 'selected') {
        // Viewer must be in the explicitly allowed list
        return Boolean(story.allowedUserIds && story.allowedUserIds.includes(viewerUserId));
      }

      return false;
    });
  }

  public createStory(story: Story): Story {
    this.data.stories.push(story);
    this.persist();
    return story;
  }

  public viewStory(storyId: string, userId: string, username: string): boolean {
    const story = this.data.stories.find((s) => s.id === storyId);
    if (!story) return false;
    if (!story.viewers.some((v) => v.userId === userId)) {
      story.viewers.push({ userId, username, viewedAt: new Date().toISOString() });
      this.persist();
    }
    return true;
  }

  public addStoryReaction(storyId: string, reaction: Reaction): Story | null {
    const story = this.data.stories.find((s) => s.id === storyId);
    if (!story) return null;
    if (!story.reactions) story.reactions = [];
    const idx = story.reactions.findIndex((r) => r.userId === reaction.userId);
    if (idx > -1) {
      story.reactions[idx] = reaction;
    } else {
      story.reactions.push(reaction);
    }
    this.persist();
    return story;
  }

  public getUserHighlights(userId: string): StoryHighlight[] {
    if (!this.data.highlights) this.data.highlights = [];
    return this.data.highlights
      .filter((h) => h.userId === userId)
      .map((h) => ({
        ...h,
        stories: (h.storyIds || [])
          .map((id) => this.data.stories.find((s) => s.id === id))
          .filter(Boolean) as Story[],
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createHighlight(highlight: StoryHighlight): StoryHighlight {
    if (!this.data.highlights) this.data.highlights = [];
    this.data.highlights.unshift(highlight);
    this.persist();
    return highlight;
  }

  public deleteHighlight(highlightId: string, userId: string): boolean {
    if (!this.data.highlights) return false;
    const index = this.data.highlights.findIndex((h) => h.id === highlightId);
    if (index === -1) return false;
    if (this.data.highlights[index].userId !== userId) return false;
    this.data.highlights.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Status (24h) ---
  public getActiveStatuses(): EphemeralStatus[] {
    const now = new Date().getTime();
    return this.data.statuses.filter((s) => new Date(s.expiresAt).getTime() > now);
  }

  public createStatus(status: EphemeralStatus): EphemeralStatus {
    this.data.statuses.push(status);
    this.persist();
    return status;
  }

  // --- Short Videos (Reels) ---
  public getShortVideos(limit = 20, offset = 0): ShortVideo[] {
    return this.data.shortVideos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  public createShortVideo(video: ShortVideo): ShortVideo {
    this.data.shortVideos.unshift(video);
    this.persist();
    return video;
  }

  public toggleShortVideoLike(videoId: string, userId: string): { video: ShortVideo; isLiked: boolean } | null {
    const video = this.data.shortVideos.find((v) => v.id === videoId);
    if (!video) return null;
    if (!video.likes) video.likes = [];
    const idx = video.likes.indexOf(userId);
    let isLiked = false;
    if (idx > -1) {
      video.likes.splice(idx, 1);
      video.likesCount = Math.max(0, (video.likesCount || 0) - 1);
      isLiked = false;
    } else {
      video.likes.push(userId);
      video.likesCount = (video.likesCount || 0) + 1;
      isLiked = true;
    }
    this.persist();
    return { video, isLiked };
  }

  public getShortVideoComments(videoId: string): Comment[] {
    const video = this.data.shortVideos.find((v) => v.id === videoId);
    return video?.comments || [];
  }

  public addShortVideoComment(videoId: string, comment: Comment): Comment | null {
    const video = this.data.shortVideos.find((v) => v.id === videoId);
    if (!video) return null;
    if (!video.comments) video.comments = [];
    video.comments.push(comment);
    video.commentsCount = (video.commentsCount || 0) + 1;
    this.persist();
    return comment;
  }

  public deleteShortVideo(videoId: string, userId: string, isAdmin = false): boolean {
    const index = this.data.shortVideos.findIndex((v) => v.id === videoId);
    if (index === -1) return false;
    const video = this.data.shortVideos[index];
    if (video.userId !== userId && !isAdmin) return false;
    this.data.shortVideos.splice(index, 1);
    this.persist();
    return true;
  }


  // --- Conversations & Messages ---
  public getUserConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.participants.includes(userId))
      .map((c) => {
        const participantDetails = c.participants
          .map((id) => this.findUserById(id))
          .filter(Boolean) as User[];
        return {
          ...c,
          participantDetails,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  public createConversation(conversation: Conversation): Conversation {
    this.data.conversations.unshift(conversation);
    this.persist();
    return conversation;
  }

  public getConversationMessages(conversationId: string, limit = 50): Message[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
  }

  public addMessage(message: Message): Message {
    this.data.messages.push(message);
    const convo = this.getConversationById(message.conversationId);
    if (convo) {
      convo.lastMessage = message;
      convo.updatedAt = message.createdAt;
    }
    this.persist();
    return message;
  }

  public getMessageById(messageId: string): Message | undefined {
    return this.data.messages.find((m) => m.id === messageId);
  }

  public deleteMessage(messageId: string, userId: string): boolean {
    const idx = this.data.messages.findIndex((m) => m.id === messageId && m.senderId === userId);
    if (idx === -1) return false;
    this.data.messages.splice(idx, 1);
    this.persist();
    return true;
  }

  public editMessage(messageId: string, userId: string, newContent: string): Message | null {
    const msg = this.data.messages.find((m) => m.id === messageId && m.senderId === userId);
    if (!msg) return null;
    msg.content = newContent;
    msg.isEdited = true;
    msg.updatedAt = new Date().toISOString();
    this.persist();
    return msg;
  }

  public reactToMessage(messageId: string, userId: string, username: string, emoji: string): Message | null {
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = [];
    const existingIdx = msg.reactions.findIndex((r) => r.userId === userId && (r.emoji === emoji || r.type === emoji));
    if (existingIdx > -1) {
      msg.reactions.splice(existingIdx, 1); // toggle off
    } else {
      msg.reactions.push({
        type: emoji,
        emoji,
        userId,
        username,
        createdAt: new Date().toISOString(),
      });
    }
    this.persist();
    return msg;
  }

  public markConversationRead(conversationId: string, userId: string): void {
    let changed = false;
    this.data.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId !== userId && m.status !== 'read') {
        m.status = 'read';
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }


  // --- Calls & Meetings ---
  public logCall(call: CallLog): CallLog {
    this.data.callLogs.unshift(call);
    this.persist();
    return call;
  }

  public getUserCallLogs(userId: string): CallLog[] {
    return this.data.callLogs
      .filter((c) => c.callerId === userId || c.receiverId === userId)
      .slice(0, 50);
  }

  public createMeeting(meeting: Meeting): Meeting {
    this.data.meetings.unshift(meeting);
    this.persist();
    return meeting;
  }

  public getMeetingByCode(code: string): Meeting | undefined {
    return this.data.meetings.find(
      (m) => m.meetingCode.toLowerCase() === code.toLowerCase() || m.id === code
    );
  }

  public getAllMeetings(): Meeting[] {
    return this.data.meetings;
  }

  // --- Communities & Channels ---
  public getCommunities(): Community[] {
    return this.data.communities;
  }

  public getCommunityById(id: string): Community | undefined {
    return this.data.communities.find((c) => c.id === id || c.handle === id);
  }

  public createCommunity(community: Community): Community {
    this.data.communities.push(community);
    this.persist();
    return community;
  }

  public getBroadcastChannels(): BroadcastChannel[] {
    return this.data.channels;
  }

  public getBroadcastChannelById(id: string): BroadcastChannel | undefined {
    return this.data.channels.find((c) => c.id === id || c.handle === id);
  }

  public createBroadcastChannel(channel: BroadcastChannel): BroadcastChannel {
    this.data.channels.push(channel);
    this.persist();
    return channel;
  }

  // --- Notifications ---
  public getUserNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: Notification): Notification {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.recipientId === userId);
    if (notif) {
      notif.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string): void {
    this.data.notifications
      .filter((n) => n.recipientId === userId)
      .forEach((n) => (n.isRead = true));
    this.persist();
  }

  // --- Saved Items ---
  public getSavedItems(userId: string): SavedItem[] {
    return this.data.savedItems.filter((s) => s.userId === userId);
  }

  public toggleSaveItem(item: SavedItem): boolean {
    const index = this.data.savedItems.findIndex(
      (s) => s.userId === item.userId && s.itemId === item.itemId
    );
    if (index > -1) {
      this.data.savedItems.splice(index, 1);
      this.persist();
      return false; // un-saved
    } else {
      this.data.savedItems.push(item);
      this.persist();
      return true; // saved
    }
  }

  // --- Reports & Moderation ---
  public addReport(report: Report): Report {
    this.data.reports.unshift(report);
    this.persist();
    return report;
  }

  public getReports(): Report[] {
    return this.data.reports;
  }

  public resolveReport(reportId: string, status: 'resolved' | 'dismissed'): boolean {
    const rep = this.data.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      rep.resolvedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  public logAudit(log: AuditLog): void {
    this.data.auditLogs.unshift(log);
    this.persist();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.slice(0, 100);
  }

  // --- System Stats ---
  public getAdminStats() {
    return {
      totalUsers: this.data.users.length,
      activeSessions: this.data.sessions.length,
      totalPosts: this.data.posts.length,
      totalComments: this.data.comments.length,
      totalShortVideos: this.data.shortVideos.length,
      totalConversations: this.data.conversations.length,
      totalMessages: this.data.messages.length,
      totalCommunities: this.data.communities.length,
      totalChannels: this.data.channels.length,
      totalMeetings: this.data.meetings.length,
      totalReports: this.data.reports.length,
      pendingReports: this.data.reports.filter((r) => r.status === 'pending').length,
    };
  }
  // --- Membership Settings ---
  public getMembershipSettings(): MembershipSettings {
    if (!this.data.membershipSettings) {
      this.data.membershipSettings = this.buildDefaultSettings();
      this.persist();
    }
    // Ensure new collections exist (migration for old db.json files)
    if (!this.data.subscriptions) this.data.subscriptions = [];
    if (!this.data.paymentTransactions) this.data.paymentTransactions = [];
    if (!this.data.verificationApplications) this.data.verificationApplications = [];
    return this.data.membershipSettings;
  }

  private buildDefaultSettings(): MembershipSettings {
    const now = new Date().toISOString();
    return {
      plans: {
        free: {
          id: 'free',
          name: 'Free',
          tagline: 'Get started with Dark Falcon',
          badgeTitle: '',
          priceLKR: 0,
          billingInterval: 'month',
          trialDays: 0,
          features: ['Basic messaging', 'Posts & Stories', 'Short Videos', 'Communities'],
          isActive: true,
        },
        premium: {
          id: 'premium',
          name: 'Dark Falcon Premium 👑',
          tagline: 'Fly higher with Premium',
          badgeTitle: 'Premium',
          priceLKR: 1500,
          billingInterval: 'month',
          trialDays: 30,
          features: [
            '1 Month FREE Trial',
            'Priority AI Assistance (500 queries/month)',
            'Upload up to 4K videos',
            'Premium Crown Badge 👑',
            'Advanced Analytics',
            'Read receipts & delivery confirmations',
            'Premium customer support',
          ],
          isPopular: true,
          isActive: true,
        },
        verified: {
          id: 'verified',
          name: 'Dark Falcon Verified 🦅',
          tagline: 'Build trust with a Verified badge',
          badgeTitle: 'Verified',
          priceLKR: 1200,
          billingInterval: 'month',
          trialDays: 0,
          features: [
            'Unique Eagle Verification Badge 🦅',
            'Verified status in Search & Discovery',
            'Content prioritization',
            'Anti-impersonation protection',
            'Direct admin support line',
          ],
          isActive: true,
        },
        premium_verified: {
          id: 'premium_verified',
          name: 'Dark Falcon Bundle 👑🦅',
          tagline: 'The ultimate Dark Falcon experience',
          badgeTitle: 'Premium + Verified',
          priceLKR: 2500,
          billingInterval: 'month',
          trialDays: 30,
          features: [
            '1 Month FREE Trial',
            'Everything in Premium 👑',
            'Unique Eagle Verification Badge 🦅',
            'Unlimited AI Assistance',
            'Upload 8K videos',
            'Priority content distribution',
            'Bundle price: Save LKR 200/month',
          ],
          isPopular: false,
          isActive: true,
        },
      },
      trialDurationDays: 30,
      oneTrialPerCustomer: true,
      gracePeriodDays: 7,
      provider: 'sandbox',
      paymentMode: 'test',
      currency: 'LKR',
      aiMonthlyQuota: { free: 20, premium: 500 },
      storageQuotaMB: { free: 500, premium: 5120 },
      updatedAt: now,
    };
  }

  public updateMembershipSettings(patch: Partial<MembershipSettings>): MembershipSettings {
    const current = this.getMembershipSettings();
    this.data.membershipSettings = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.membershipSettings;
  }

  // --- Subscriptions ---
  public findSubscriptionByUserId(userId: string): Subscription | undefined {
    return (this.data.subscriptions || []).find((s) => s.userId === userId);
  }

  public findSubscriptionById(id: string): Subscription | undefined {
    return (this.data.subscriptions || []).find((s) => s.id === id);
  }

  public createSubscription(sub: Subscription): Subscription {
    if (!this.data.subscriptions) this.data.subscriptions = [];
    this.data.subscriptions.push(sub);
    this.persist();
    return sub;
  }

  public updateSubscription(id: string, patch: Partial<Subscription>): Subscription | undefined {
    const idx = (this.data.subscriptions || []).findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.data.subscriptions[idx] = { ...this.data.subscriptions[idx], ...patch, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.subscriptions[idx];
  }

  public getAllSubscriptions(): Subscription[] {
    return this.data.subscriptions || [];
  }

  // --- Payment Transactions ---
  public createPaymentTransaction(tx: PaymentTransaction): PaymentTransaction {
    if (!this.data.paymentTransactions) this.data.paymentTransactions = [];
    this.data.paymentTransactions.unshift(tx);
    this.persist();
    return tx;
  }

  public getUserTransactions(userId: string): PaymentTransaction[] {
    return (this.data.paymentTransactions || []).filter((t) => t.userId === userId);
  }

  public getAllTransactions(): PaymentTransaction[] {
    return this.data.paymentTransactions || [];
  }

  public findTransactionByProviderTxId(providerTxId: string): PaymentTransaction | undefined {
    return (this.data.paymentTransactions || []).find((t) => t.providerTransactionId === providerTxId);
  }

  // --- Verification Applications ---
  public createVerificationApplication(app: VerificationApplication): VerificationApplication {
    if (!this.data.verificationApplications) this.data.verificationApplications = [];
    this.data.verificationApplications.unshift(app);
    this.persist();
    return app;
  }

  public updateVerificationApplication(id: string, patch: Partial<VerificationApplication>): VerificationApplication | undefined {
    const idx = (this.data.verificationApplications || []).findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.data.verificationApplications[idx] = {
      ...this.data.verificationApplications[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.verificationApplications[idx];
  }

  public getVerificationApplications(): VerificationApplication[] {
    return this.data.verificationApplications || [];
  }

  public getUserVerificationApplication(userId: string): VerificationApplication | undefined {
    return (this.data.verificationApplications || []).find((a) => a.userId === userId);
  }

  public getMembershipAdminStats() {
    const subs = this.data.subscriptions || [];
    const txs = this.data.paymentTransactions || [];
    const apps = this.data.verificationApplications || [];
    return {
      totalSubscriptions: subs.length,
      activeSubscriptions: subs.filter((s) => s.status === 'active' || s.status === 'trialing').length,
      totalRevenueLKR: txs.filter((t) => t.status === 'successful').reduce((sum, t) => sum + t.amountLKR, 0),
      pendingVerificationApplications: apps.filter((a) => a.status === 'pending' || a.status === 'under_review').length,
      premiumUsers: subs.filter((s) => (s.planId === 'premium' || s.planId === 'premium_verified') && s.status === 'active').length,
      verifiedUsers: subs.filter((s) => (s.planId === 'verified' || s.planId === 'premium_verified') && s.status === 'active').length,
    };
  }
}

export const db = new DatabaseService();


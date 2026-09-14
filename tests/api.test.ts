import { describe, it, expect } from 'vitest';
import { db } from '../src/server/services/dbService';

describe('Dark Falcon Social & Real-time Domain Operations', () => {
  it('creates a post and handles 6-type reaction toggles', () => {
    const post = db.createPost({
      id: 'test-post-1',
      userId: 'test-user-1',
      username: 'sovereign_falcon',
      userDisplayName: 'Test Aviator',
      content: 'Soaring above the digital realm #DarkFalcon #WebRTC',
      mediaUrls: [],
      mediaType: 'text',
      privacy: 'public',
      hashtags: ['DarkFalcon', 'WebRTC'],
      mentions: [],
      likesCount: 0,
      commentsCount: 0,
      reactions: [],
      sharesCount: 0,
      savesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(post.id).toBe('test-post-1');

    // Add Love reaction
    const reactedPost = db.togglePostReaction('test-post-1', {
      userId: 'user-demo-falcon',
      username: 'cyber_falcon',
      type: 'love',
      createdAt: new Date().toISOString(),
    });

    expect(reactedPost?.reactions.length).toBe(1);
    expect(reactedPost?.reactions[0].type).toBe('love');
    expect(reactedPost?.likesCount).toBe(1);

    // Change reaction to Haha
    const changedReaction = db.togglePostReaction('test-post-1', {
      userId: 'user-demo-falcon',
      username: 'cyber_falcon',
      type: 'haha',
      createdAt: new Date().toISOString(),
    });

    expect(changedReaction?.reactions.length).toBe(1);
    expect(changedReaction?.reactions[0].type).toBe('haha');
  });

  it('filters active 24-hour ephemeral stories properly', () => {
    // Story expiring in future
    db.createStory({
      id: 'active-story-1',
      userId: 'test-user-1',
      username: 'sovereign_falcon',
      mediaUrl: '/assets/brand/dark-falcon-logo.png',
      mediaType: 'image',
      viewers: [],
      reactions: [],
      expiresAt: new Date(Date.now() + 10 * 3600000).toISOString(), // 10h future
      createdAt: new Date().toISOString(),
    });

    // Expired story
    db.createStory({
      id: 'expired-story-1',
      userId: 'test-user-1',
      username: 'sovereign_falcon',
      mediaUrl: '',
      mediaType: 'text',
      viewers: [],
      reactions: [],
      expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1h past
      createdAt: new Date(Date.now() - 25 * 3600000).toISOString(),
    });

    const activeStories = db.getActiveStories();
    expect(activeStories.some((s) => s.id === 'active-story-1')).toBe(true);
    expect(activeStories.some((s) => s.id === 'expired-story-1')).toBe(false);
  });

  it('creates conversation, dispatches message, and manages PIN lock', () => {
    const convo = db.createConversation({
      id: 'test-convo-1',
      type: 'direct',
      participants: ['test-user-1', 'user-demo-falcon'],
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const msg = db.addMessage({
      id: 'test-msg-1',
      conversationId: 'test-convo-1',
      senderId: 'test-user-1',
      senderUsername: 'sovereign_falcon',
      type: 'text',
      content: 'Operational check on Dark Falcon real-time layer.',
      status: 'delivered',
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(msg.id).toBe('test-msg-1');
    const loadedConvo = db.getConversationById('test-convo-1');
    expect(loadedConvo?.lastMessage?.id).toBe('test-msg-1');

    // Test locking conversation
    loadedConvo!.isLocked = true;
    db.persist();
    expect(db.getConversationById('test-convo-1')?.isLocked).toBe(true);
  });
});

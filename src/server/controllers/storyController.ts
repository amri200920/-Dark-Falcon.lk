import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { socketService } from '../services/socketService';
import { Story, EphemeralStatus, ShortVideo, StoryHighlight, Comment, Message, Reaction, Conversation } from '../../shared/types';

export async function getStories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const viewerUserId = req.user?.id;
  const stories = db.getActiveStories(viewerUserId);
  res.json({ success: true, data: stories });
}

export async function createStory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const {
    mediaUrl,
    mediaType = 'image',
    textContent,
    backgroundColor,
    filter,
    stickers,
    audienceType = 'everyone',
    allowedUserIds = [],
    excludedUserIds = [],
  } = req.body;
  const user = req.user!;

  if (!mediaUrl && !textContent) {
    res.status(400).json({ success: false, message: 'Story must have media or text.' });
    return;
  }

  const story: Story = {
    id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatarUrl,
    mediaUrl: mediaUrl || '',
    mediaType,
    textContent,
    backgroundColor: backgroundColor || '#0c101a',
    filter,
    stickers,
    audienceType,
    allowedUserIds: Array.isArray(allowedUserIds) ? allowedUserIds : [],
    excludedUserIds: Array.isArray(excludedUserIds) ? excludedUserIds : [],
    viewers: [],
    reactions: [],
    expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(), // 24 hours
    createdAt: new Date().toISOString(),
  };

  const created = db.createStory(story);
  res.status(201).json({ success: true, data: created });
}

export async function viewStory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  db.viewStory(id, user.id, user.username);
  res.json({ success: true });
}

export async function reactToStory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { emoji = '🔥' } = req.body;
  const user = req.user!;

  const reaction: Reaction = {
    userId: user.id,
    username: user.username,
    type: 'emoji',
    emoji,
    createdAt: new Date().toISOString(),
  };

  const updatedStory = db.addStoryReaction(id, reaction);
  if (!updatedStory) {
    res.status(404).json({ success: false, message: 'Story not found.' });
    return;
  }

  if (updatedStory.userId !== user.id) {
    const notif = db.addNotification({
      id: `notif-${Date.now()}`,
      recipientId: updatedStory.userId,
      actorId: user.id,
      actorUsername: user.username,
      actorAvatar: user.avatarUrl,
      type: 'story_reaction',
      title: 'Story Reaction',
      body: `${user.displayName} reacted ${emoji} to your story.`,
      link: `/stories/${updatedStory.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    socketService.sendToUser(updatedStory.userId, { type: 'new_notification', payload: notif });
  }

  res.json({ success: true, data: updatedStory });
}

export async function replyToStory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { text } = req.body;
  const user = req.user!;

  if (!text || !text.trim()) {
    res.status(400).json({ success: false, message: 'Reply text cannot be empty.' });
    return;
  }

  const stories = db.getActiveStories();
  const story = stories.find((s) => s.id === id);
  if (!story) {
    res.status(404).json({ success: false, message: 'Story not found or expired.' });
    return;
  }

  // Find or create direct conversation between user and story author
  const userConversations = db.getUserConversations(user.id);
  let convo = userConversations.find(
    (c) => c.type === 'direct' && c.participants.includes(story.userId)
  );

  if (!convo) {
    const newConvo: Conversation = {
      id: `convo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'direct',
      participants: [user.id, story.userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    convo = db.createConversation(newConvo);
  }

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: convo.id,
    senderId: user.id,
    senderUsername: user.username,
    senderAvatar: user.avatarUrl,
    type: 'text',
    content: `Story Reply: "${text.trim()}"`,
    attachment: story.mediaUrl
      ? {
          url: story.mediaUrl,
          name: 'Story Attachment',
          size: 1024,
          mimeType: story.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        }
      : undefined,
    status: 'sent',
    reactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sentMessage = db.addMessage(message);

  // Send real-time socket message to recipient
  socketService.sendToUser(story.userId, {
    type: 'new_message',
    payload: { message: sentMessage, conversationId: convo.id },
  });

  // Also create notification
  if (story.userId !== user.id) {
    const notif = db.addNotification({
      id: `notif-${Date.now()}`,
      recipientId: story.userId,
      actorId: user.id,
      actorUsername: user.username,
      actorAvatar: user.avatarUrl,
      type: 'story_reply',
      title: 'Story Reply',
      body: `${user.displayName} replied to your story: "${text.slice(0, 50)}..."`,
      link: `/messages?c=${convo.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    socketService.sendToUser(story.userId, { type: 'new_notification', payload: notif });
  }

  res.status(201).json({ success: true, data: sentMessage, message: 'Story reply sent as message.' });
}

export async function getUserHighlights(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const highlights = db.getUserHighlights(userId);
  res.json({ success: true, data: highlights });
}

export async function createHighlight(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { title, coverUrl, storyIds = [] } = req.body;
  const user = req.user!;

  if (!title || storyIds.length === 0) {
    res.status(400).json({ success: false, message: 'Title and story items are required.' });
    return;
  }

  const highlight: StoryHighlight = {
    id: `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    username: user.username,
    title,
    coverUrl: coverUrl || '/assets/brand/dark-falcon-logo.png',
    storyIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createHighlight(highlight);
  res.status(201).json({ success: true, data: created });
}

export async function deleteHighlight(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const deleted = db.deleteHighlight(id, user.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Highlight not found or unauthorized.' });
    return;
  }
  res.json({ success: true, message: 'Highlight deleted.' });
}

export async function getStatuses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const statuses = db.getActiveStatuses();
  res.json({ success: true, data: statuses });
}

export async function createStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { text, mediaUrl } = req.body;
  const user = req.user!;

  if (!text && !mediaUrl) {
    res.status(400).json({ success: false, message: 'Status must have text or media.' });
    return;
  }

  const status: EphemeralStatus = {
    id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatarUrl,
    text: text || '',
    mediaUrl,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
  };

  const created = db.createStatus(status);
  res.status(201).json({ success: true, data: created });
}

export async function getShortVideos(req: AuthenticatedRequest, res: Response): Promise<void> {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const videos = db.getShortVideos(limit, offset);
  res.json({ success: true, data: videos });
}

export async function createShortVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { videoUrl, thumbnailUrl, caption = '', hashtags = [], filter, audioTitle, audioArtist } = req.body;
  const user = req.user!;

  if (!videoUrl) {
    res.status(400).json({ success: false, message: 'Video URL is required.' });
    return;
  }

  const video: ShortVideo = {
    id: `video-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    username: user.username,
    userDisplayName: user.displayName,
    userAvatar: user.avatarUrl,
    videoUrl,
    thumbnailUrl: thumbnailUrl || '/assets/brand/dark-falcon-logo.png',
    caption,
    hashtags,
    likesCount: 0,
    likes: [],
    commentsCount: 0,
    comments: [],
    sharesCount: 0,
    viewsCount: 1,
    filter,
    audioTitle,
    audioArtist,
    createdAt: new Date().toISOString(),
  };

  const created = db.createShortVideo(video);
  res.status(201).json({ success: true, data: created });
}

export async function likeShortVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const result = db.toggleShortVideoLike(id, user.id);
  if (!result) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  if (result.isLiked && result.video.userId !== user.id) {
    const notif = db.addNotification({
      id: `notif-${Date.now()}`,
      recipientId: result.video.userId,
      actorId: user.id,
      actorUsername: user.username,
      actorAvatar: user.avatarUrl,
      type: 'like',
      title: 'Reel Liked',
      body: `${user.displayName} liked your Reel.`,
      link: `/reels#${result.video.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    socketService.sendToUser(result.video.userId, { type: 'new_notification', payload: notif });
  }

  res.json({ success: true, data: result.video, isLiked: result.isLiked });
}

export async function getVideoComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const comments = db.getShortVideoComments(id);
  res.json({ success: true, data: comments });
}

export async function addVideoComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { content } = req.body;
  const user = req.user!;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
    return;
  }

  const comment: Comment = {
    id: `com-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    postId: id,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatarUrl,
    content: content.trim(),
    likesCount: 0,
    reactions: [],
    createdAt: new Date().toISOString(),
  };

  const created = db.addShortVideoComment(id, comment);
  if (!created) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  res.status(201).json({ success: true, data: created });
}

export async function deleteShortVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const isAdmin = ['admin', 'super_admin'].includes(user.role);

  const deleted = db.deleteShortVideo(id, user.id, isAdmin);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Video not found or unauthorized.' });
    return;
  }
  res.json({ success: true, message: 'Reel deleted.' });
}


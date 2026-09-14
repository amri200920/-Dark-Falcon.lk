import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { Story, EphemeralStatus, ShortVideo } from '../../shared/types';

export async function getStories(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stories = db.getActiveStories();
  res.json({ success: true, data: stories });
}

export async function createStory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { mediaUrl, mediaType = 'image', textContent, backgroundColor } = req.body;
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
  const { videoUrl, thumbnailUrl, caption = '', hashtags = [] } = req.body;
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
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 1,
    createdAt: new Date().toISOString(),
  };

  const created = db.createShortVideo(video);
  res.status(201).json({ success: true, data: created });
}

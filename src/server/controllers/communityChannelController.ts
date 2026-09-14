import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { Community, BroadcastChannel } from '../../shared/types';

// Communities
export async function getCommunities(req: AuthenticatedRequest, res: Response): Promise<void> {
  const communities = db.getCommunities();
  res.json({ success: true, data: communities });
}

export async function getCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const community = db.getCommunityById(id);
  if (!community) {
    res.status(404).json({ success: false, message: 'Community not found.' });
    return;
  }
  res.json({ success: true, data: community });
}

export async function createCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, handle, description, category, rules = [], isPrivate = false } = req.body;
  const user = req.user!;

  if (!name || !handle) {
    res.status(400).json({ success: false, message: 'Name and handle are required.' });
    return;
  }

  const community: Community = {
    id: `comm-${Date.now()}`,
    name,
    handle: handle.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    description: description || '',
    category: category || 'Technology',
    avatarUrl: '/assets/brand/dark-falcon-logo.png',
    rules,
    isPrivate,
    creatorId: user.id,
    membersCount: 1,
    channels: [
      { id: 'ch-announcements', name: 'announcements', topic: 'Official broadcasts' },
      { id: 'ch-general', name: 'general', topic: 'Open discussions' },
    ],
    createdAt: new Date().toISOString(),
  };

  const created = db.createCommunity(community);
  res.status(201).json({ success: true, data: created });
}

// Broadcast Channels
export async function getBroadcastChannels(req: AuthenticatedRequest, res: Response): Promise<void> {
  const channels = db.getBroadcastChannels();
  res.json({ success: true, data: channels });
}

export async function getBroadcastChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const channel = db.getBroadcastChannelById(id);
  if (!channel) {
    res.status(404).json({ success: false, message: 'Broadcast channel not found.' });
    return;
  }
  res.json({ success: true, data: channel });
}

export async function createBroadcastChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, handle, description } = req.body;
  const user = req.user!;

  if (!name || !handle) {
    res.status(400).json({ success: false, message: 'Channel name and handle are required.' });
    return;
  }

  const channel: BroadcastChannel = {
    id: `channel-${Date.now()}`,
    name,
    handle: handle.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    description: description || '',
    avatarUrl: '/assets/brand/dark-falcon-logo.png',
    ownerId: user.id,
    ownerUsername: user.username,
    subscribersCount: 1,
    isVerified: user.isVerified || false,
    posts: [],
    createdAt: new Date().toISOString(),
  };

  const created = db.createBroadcastChannel(channel);
  res.status(201).json({ success: true, data: created });
}

export async function createBroadcastPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, content, mediaUrls = [] } = req.body;
  const user = req.user!;

  const channel = db.getBroadcastChannelById(id);
  if (!channel) {
    res.status(404).json({ success: false, message: 'Broadcast channel not found.' });
    return;
  }

  if (channel.ownerId !== user.id) {
    res.status(403).json({ success: false, message: 'Only the channel owner can broadcast messages.' });
    return;
  }

  const post = {
    id: `bp-${Date.now()}`,
    title,
    content,
    mediaUrls,
    createdAt: new Date().toISOString(),
    reactions: [],
  };

  channel.posts.unshift(post);
  db.persist();

  res.status(201).json({ success: true, data: post });
}

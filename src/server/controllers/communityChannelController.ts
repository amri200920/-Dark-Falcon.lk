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

export async function joinCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const community = db.getCommunityById(id);
  if (!community) {
    res.status(404).json({ success: false, message: 'Community not found.' });
    return;
  }
  community.membersCount = (community.membersCount || 0) + 1;
  db.persist();
  res.json({ success: true, data: { joined: true, membersCount: community.membersCount } });
}

export async function leaveCommunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const community = db.getCommunityById(id);
  if (!community) {
    res.status(404).json({ success: false, message: 'Community not found.' });
    return;
  }
  community.membersCount = Math.max(1, (community.membersCount || 1) - 1);
  db.persist();
  res.json({ success: true, data: { joined: false, membersCount: community.membersCount } });
}

export async function subscribeChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const channel = db.getBroadcastChannelById(id);
  if (!channel) {
    res.status(404).json({ success: false, message: 'Broadcast channel not found.' });
    return;
  }
  channel.subscribersCount = (channel.subscribersCount || 0) + 1;
  db.persist();
  res.json({ success: true, data: { subscribed: true, subscribersCount: channel.subscribersCount } });
}

export async function unsubscribeChannel(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const channel = db.getBroadcastChannelById(id);
  if (!channel) {
    res.status(404).json({ success: false, message: 'Broadcast channel not found.' });
    return;
  }
  channel.subscribersCount = Math.max(1, (channel.subscribersCount || 1) - 1);
  db.persist();
  res.json({ success: true, data: { subscribed: false, subscribersCount: channel.subscribersCount } });
}

export async function reactBroadcastPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id, postId } = req.params;
  const channel = db.getBroadcastChannelById(id);
  if (!channel) {
    res.status(404).json({ success: false, message: 'Broadcast channel not found.' });
    return;
  }
  const post = channel.posts.find((p) => p.id === postId);
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found in channel.' });
    return;
  }
  if (!post.reactions) post.reactions = [];
  const user = req.user!;
  const existing = post.reactions.find((r) => r.userId === user.id);
  if (existing) {
    post.reactions = post.reactions.filter((r) => r.userId !== user.id);
  } else {
    post.reactions.push({
      userId: user.id,
      username: user.username,
      type: 'love',
      emoji: '❤️',
      createdAt: new Date().toISOString(),
    });
  }
  db.persist();
  res.json({ success: true, data: { reactions: post.reactions } });
}

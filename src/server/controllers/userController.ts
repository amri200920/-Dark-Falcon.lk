import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { isFirebaseConfigured } from '../../../firebase/config';
import { isGeminiConfigured } from '../services/geminiService';
import { SavedItem, SystemConfigStatus, Report } from '../../shared/types';
import { socketService } from '../services/socketService';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { username } = req.params;
  const user = db.findUserByUsername(username) || db.findUserById(username);

  if (!user) {
    res.status(404).json({ success: false, message: 'User profile not found.' });
    return;
  }

  const currentUserId = req.user?.id;
  const isFollowing = currentUserId ? db.isFollowing(currentUserId, user.id) : false;
  const isBlocked = currentUserId ? db.isBlocked(currentUserId, user.id) : false;

  res.json({
    success: true,
    data: {
      ...user,
      isFollowing,
      isBlocked,
    },
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const {
    displayName,
    bio,
    website,
    avatarUrl,
    coverUrl,
    isPrivate,
    e2eePublicKey,
    hideOnlineStatus,
    hideLastSeen,
    hideReadReceipts,
  } = req.body;

  const updates: any = {};
  if (displayName !== undefined) updates.displayName = displayName.trim();
  if (bio !== undefined) updates.bio = bio.trim();
  if (website !== undefined) updates.website = website.trim();
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (coverUrl !== undefined) updates.coverUrl = coverUrl;
  if (isPrivate !== undefined) updates.isPrivate = Boolean(isPrivate);
  if (e2eePublicKey !== undefined) updates.e2eePublicKey = e2eePublicKey;
  if (hideOnlineStatus !== undefined) updates.hideOnlineStatus = Boolean(hideOnlineStatus);
  if (hideLastSeen !== undefined) updates.hideLastSeen = Boolean(hideLastSeen);
  if (hideReadReceipts !== undefined) updates.hideReadReceipts = Boolean(hideReadReceipts);

  const updated = db.updateUser(user.id, updates);
  res.json({
    success: true,
    data: updated,
    message: 'Profile updated successfully.',
  });
}

export async function followUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  if (user.id === id) {
    res.status(400).json({ success: false, message: 'Cannot follow yourself.' });
    return;
  }

  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const success = db.followUser(user.id, id);
  if (success) {
    const notif = db.addNotification({
      id: `notif-${Date.now()}`,
      recipientId: id,
      actorId: user.id,
      actorUsername: user.username,
      actorAvatar: user.avatarUrl,
      type: 'follow',
      title: 'New Follower',
      body: `${user.displayName} is now following you.`,
      link: `/profile/${user.username}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    socketService.sendToUser(id, { type: 'new_notification', payload: notif });
  }

  res.json({ success: true, message: 'Followed successfully.' });
}

export async function unfollowUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const success = db.unfollowUser(user.id, id);
  res.json({ success, message: success ? 'Unfollowed.' : 'Could not unfollow.' });
}

export async function blockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  db.blockUser(user.id, id);
  res.json({ success: true, message: 'User has been blocked.' });
}

export async function unblockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  db.unblockUser(user.id, id);
  res.json({ success: true, message: 'User has been unblocked.' });
}

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const notifications = db.getUserNotifications(req.user!.id);
  res.json({ success: true, data: notifications });
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  if (id === 'all') {
    db.markAllNotificationsRead(req.user!.id);
  } else {
    db.markNotificationAsRead(id, req.user!.id);
  }
  res.json({ success: true });
}

export async function getSavedItems(req: AuthenticatedRequest, res: Response): Promise<void> {
  const saved = db.getSavedItems(req.user!.id);
  res.json({ success: true, data: saved });
}

export async function toggleSaveItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { itemType, itemId, collectionName = 'Favorites', itemData } = req.body;
  const user = req.user!;

  const item: SavedItem = {
    id: `saved-${Date.now()}`,
    userId: user.id,
    itemType,
    itemId,
    collectionName,
    itemData,
    savedAt: new Date().toISOString(),
  };

  const isSaved = db.toggleSaveItem(item);
  res.json({
    success: true,
    data: { isSaved },
    message: isSaved ? 'Item saved to collection.' : 'Item removed from saved collection.',
  });
}

export async function searchGlobal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (!q) {
    res.json({ success: true, data: { users: [], posts: [], communities: [], channels: [] } });
    return;
  }

  const users = db.getAllUsers()
    .filter((u) => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
    .slice(0, 10);

  const posts = db.getFeed(req.user?.id, 100, 0)
    .filter((p) => p.content.toLowerCase().includes(q) || p.hashtags.some((h) => h.toLowerCase().includes(q)))
    .slice(0, 15);

  const communities = db.getCommunities()
    .filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    .slice(0, 10);

  const channels = db.getBroadcastChannels()
    .filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q))
    .slice(0, 10);

  res.json({
    success: true,
    data: { users, posts, communities, channels },
  });
}

export async function getSystemConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const status: SystemConfigStatus = {
    firebaseConfigured: isFirebaseConfigured,
    geminiConfigured: isGeminiConfigured(),
    stunTurnConfigured: Boolean(process.env.TURN_URL && process.env.TURN_USERNAME),
    sfuConfigured: Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_WS_URL),
    smsConfigured: Boolean(process.env.SMS_PROVIDER_API_KEY && process.env.SMS_PROVIDER_ACCOUNT_SID),
    pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    environment: process.env.NODE_ENV || 'development',
  };

  res.json({ success: true, data: status });
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  socketService.disconnectUser(user.id, 'Account deleted by user');
  db.deleteUser(user.id);
  res.json({ success: true, message: 'Your Dark Falcon account has been permanently deleted.' });
}

export async function exportAccountData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const conversations = db.getUserConversations(user.id);
  const saved = db.getSavedItems(user.id);
  const notifications = db.getUserNotifications(user.id);

  res.json({
    success: true,
    data: {
      user,
      conversationsSummary: conversations.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        participantsCount: c.participants.length,
      })),
      savedItemsCount: saved.length,
      notificationsCount: notifications.length,
      exportedAt: new Date().toISOString(),
      platform: 'Dark Falcon 🦅 Sovereign Account Data',
    },
  });
}

// --- User-Submitted Content Reports ---
export async function submitReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const reporter = req.user!;
  const { targetId, targetType, reason, details } = req.body;

  if (!targetId || !targetType || !reason) {
    res.status(400).json({ success: false, message: 'targetId, targetType, and reason are required.' });
    return;
  }

  const report: Report = {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    reporterId: reporter.id,
    reporterUsername: reporter.username,
    targetId,
    targetType,
    reason,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.addReport(report);

  res.json({ success: true, message: 'Report submitted. Our moderation team will review it shortly.' });
}

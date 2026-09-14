import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { Post, Comment, Reaction, ReactionType } from '../../shared/types';
import { socketService } from '../services/socketService';

export async function getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const currentUserId = req.user?.id;

  const posts = db.getFeed(currentUserId, limit, offset);
  res.json({
    success: true,
    data: posts,
    meta: { limit, offset, count: posts.length },
  });
}

export async function getPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = db.getPostById(id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found.' });
    return;
  }
  res.json({ success: true, data: post });
}

export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { content, mediaUrls = [], mediaType = 'text', privacy = 'public', location } = req.body;
  const user = req.user!;

  if (!content && mediaUrls.length === 0) {
    res.status(400).json({ success: false, message: 'Post must have text or media.' });
    return;
  }

  // Extract hashtags & mentions
  const hashtags = (content?.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) => t.slice(1));
  const mentions = (content?.match(/@[a-zA-Z0-9_]+/g) || []).map((m: string) => m.slice(1));

  const post: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    username: user.username,
    userDisplayName: user.displayName,
    userAvatar: user.avatarUrl,
    content: content || '',
    mediaUrls,
    mediaType: mediaUrls.length > 0 ? (mediaUrls[0].endsWith('.mp4') ? 'video' : 'image') : 'text',
    privacy,
    hashtags,
    mentions,
    location,
    likesCount: 0,
    commentsCount: 0,
    reactions: [],
    sharesCount: 0,
    savesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createPost(post);

  // Notify mentions
  mentions.forEach((mentionUsername: string) => {
    const mentionedUser = db.findUserByUsername(mentionUsername);
    if (mentionedUser && mentionedUser.id !== user.id) {
      const notif = db.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        recipientId: mentionedUser.id,
        actorId: user.id,
        actorUsername: user.username,
        actorAvatar: user.avatarUrl,
        type: 'mention',
        title: 'Mentioned in post',
        body: `${user.displayName} mentioned you in a post.`,
        link: `/post/${created.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      socketService.sendToUser(mentionedUser.id, { type: 'new_notification', payload: notif });
    }
  });

  res.status(201).json({
    success: true,
    data: created,
    message: 'Post published successfully.',
  });
}

export async function deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const isAdmin = ['admin', 'super_admin', 'moderator'].includes(user.role);

  const deleted = db.deletePost(id, user.id, isAdmin);
  if (!deleted) {
    res.status(403).json({ success: false, message: 'Could not delete post or unauthorized.' });
    return;
  }

  res.json({ success: true, message: 'Post deleted successfully.' });
}

export async function toggleReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { type = 'like' } = req.body as { type: ReactionType };
  const user = req.user!;

  const reaction: Reaction = {
    userId: user.id,
    username: user.username,
    type,
    createdAt: new Date().toISOString(),
  };

  const updatedPost = db.togglePostReaction(id, reaction);
  if (!updatedPost) {
    res.status(404).json({ success: false, message: 'Post not found.' });
    return;
  }

  // If reaction was added and post belongs to another user, send notification
  if (updatedPost.userId !== user.id) {
    const hasReaction = updatedPost.reactions.some((r) => r.userId === user.id && r.type === type);
    if (hasReaction) {
      const notif = db.addNotification({
        id: `notif-${Date.now()}`,
        recipientId: updatedPost.userId,
        actorId: user.id,
        actorUsername: user.username,
        actorAvatar: user.avatarUrl,
        type: 'reaction',
        title: 'New Reaction',
        body: `${user.displayName} reacted to your post.`,
        link: `/post/${updatedPost.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      socketService.sendToUser(updatedPost.userId, { type: 'new_notification', payload: notif });
    }
  }

  res.json({ success: true, data: updatedPost });
}

export async function getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const comments = db.getPostComments(id);
  res.json({ success: true, data: comments });
}

export async function addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { content, parentId } = req.body;
  const user = req.user!;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    return;
  }

  const post = db.getPostById(id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found.' });
    return;
  }

  const comment: Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    postId: id,
    userId: user.id,
    username: user.username,
    userAvatar: user.avatarUrl,
    content: content.trim(),
    likesCount: 0,
    reactions: [],
    createdAt: new Date().toISOString(),
    parentId,
  };

  const created = db.addComment(comment);

  // Notify post author if not self
  if (post.userId !== user.id) {
    const notif = db.addNotification({
      id: `notif-${Date.now()}`,
      recipientId: post.userId,
      actorId: user.id,
      actorUsername: user.username,
      actorAvatar: user.avatarUrl,
      type: 'comment',
      title: 'New Comment',
      body: `${user.displayName} commented: "${content.slice(0, 50)}..."`,
      link: `/post/${post.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    socketService.sendToUser(post.userId, { type: 'new_notification', payload: notif });
  }

  res.status(201).json({ success: true, data: created });
}

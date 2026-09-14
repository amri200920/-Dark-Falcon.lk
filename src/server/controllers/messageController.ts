import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { Conversation, Message } from '../../shared/types';
import { socketService } from '../services/socketService';

export async function getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const conversations = db.getUserConversations(user.id);
  res.json({ success: true, data: conversations });
}

export async function getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const conversation = db.getConversationById(id);
  if (!conversation || !conversation.participants.includes(user.id)) {
    res.status(404).json({ success: false, message: 'Conversation not found or access denied.' });
    return;
  }

  // Populate participant details
  const participantDetails = conversation.participants
    .map((uid) => db.findUserById(uid))
    .filter(Boolean);

  res.json({
    success: true,
    data: { ...conversation, participantDetails },
  });
}

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const conversation = db.getConversationById(id);
  if (!conversation || !conversation.participants.includes(user.id)) {
    res.status(404).json({ success: false, message: 'Conversation not found.' });
    return;
  }

  const messages = db.getConversationMessages(id);
  res.json({ success: true, data: messages });
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { content, type = 'text', attachment, replyToId, replyToContent, isEncrypted, encryptedIv } = req.body;
  const user = req.user!;

  const conversation = db.getConversationById(id);
  if (!conversation || !conversation.participants.includes(user.id)) {
    res.status(404).json({ success: false, message: 'Conversation not found.' });
    return;
  }

  // Check if any recipient blocked the user
  const otherParticipants = conversation.participants.filter((p) => p !== user.id);
  const isBlocked = otherParticipants.some((p) => db.isBlocked(p, user.id));
  if (isBlocked) {
    res.status(403).json({ success: false, message: 'Message cannot be delivered.' });
    return;
  }

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversationId: id,
    senderId: user.id,
    senderUsername: user.username,
    senderAvatar: user.avatarUrl,
    type,
    content: content || '',
    attachment,
    status: 'delivered',
    reactions: [],
    replyToId,
    replyToContent,
    isEncrypted: Boolean(isEncrypted),
    encryptedIv: encryptedIv || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.addMessage(message);

  // Real-time WebSocket dispatch to all other participants
  socketService.broadcastToUsers(otherParticipants, {
    type: 'new_message',
    payload: created,
  });

  res.status(201).json({ success: true, data: created });
}

export async function createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { participantIds, type = 'direct', name, description } = req.body;
  const user = req.user!;

  if (!participantIds || !Array.isArray(participantIds)) {
    res.status(400).json({ success: false, message: 'Valid participantIds array is required.' });
    return;
  }

  const allParticipants = Array.from(new Set([user.id, ...participantIds]));

  // For 1-on-1 direct conversation, check if one already exists
  if (type === 'direct' && allParticipants.length === 2) {
    const existing = db.getUserConversations(user.id).find(
      (c) => c.type === 'direct' && c.participants.includes(participantIds[0])
    );
    if (existing) {
      res.json({ success: true, data: existing });
      return;
    }
  }

  const conversation: Conversation = {
    id: `convo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    name: type === 'group' ? (name || 'New Falcon Group') : undefined,
    description,
    avatarUrl: '/assets/brand/dark-falcon-logo.png',
    participants: allParticipants,
    admins: type === 'group' ? [user.id] : undefined,
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createConversation(conversation);

  res.status(201).json({ success: true, data: created });
}

export async function toggleLockConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { isLocked } = req.body;
  const user = req.user!;

  const convo = db.getConversationById(id);
  if (!convo || !convo.participants.includes(user.id)) {
    res.status(404).json({ success: false, message: 'Conversation not found.' });
    return;
  }

  convo.isLocked = Boolean(isLocked);
  db.persist();

  res.json({
    success: true,
    data: { isLocked: convo.isLocked },
    message: convo.isLocked ? 'Chat locked with security PIN protection.' : 'Chat unlocked.',
  });
}

export async function editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { messageId } = req.params;
  const { content } = req.body;
  const user = req.user!;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, message: 'Updated content is required.' });
    return;
  }

  const updated = db.editMessage(messageId, user.id, content.trim());
  if (!updated) {
    res.status(404).json({ success: false, message: 'Message not found or not authorized to edit.' });
    return;
  }

  const convo = db.getConversationById(updated.conversationId);
  if (convo) {
    const otherParticipants = convo.participants.filter((p) => p !== user.id);
    socketService.broadcastToUsers(otherParticipants, {
      type: 'message_edited',
      payload: updated,
    });
  }

  res.json({ success: true, data: updated });
}

export async function deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { messageId } = req.params;
  const user = req.user!;

  const msg = db.getMessageById(messageId);
  if (!msg) {
    res.status(404).json({ success: false, message: 'Message not found.' });
    return;
  }

  const convo = db.getConversationById(msg.conversationId);
  const deleted = db.deleteMessage(messageId, user.id);
  if (!deleted) {
    res.status(403).json({ success: false, message: 'Cannot delete message.' });
    return;
  }

  if (convo) {
    const otherParticipants = convo.participants.filter((p) => p !== user.id);
    socketService.broadcastToUsers(otherParticipants, {
      type: 'message_deleted',
      payload: { messageId, conversationId: msg.conversationId },
    });
  }

  res.json({ success: true, message: 'Message deleted successfully.' });
}

export async function reactMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const user = req.user!;

  if (!emoji) {
    res.status(400).json({ success: false, message: 'Emoji is required.' });
    return;
  }

  const updated = db.reactToMessage(messageId, user.id, user.username, emoji);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Message not found.' });
    return;
  }

  const convo = db.getConversationById(updated.conversationId);
  if (convo) {
    const otherParticipants = convo.participants.filter((p) => p !== user.id);
    socketService.broadcastToUsers(otherParticipants, {
      type: 'message_reaction',
      payload: updated,
    });
  }

  res.json({ success: true, data: updated });
}

export async function markMessagesRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params; // conversationId
  const user = req.user!;

  const convo = db.getConversationById(id);
  if (!convo || !convo.participants.includes(user.id)) {
    res.status(404).json({ success: false, message: 'Conversation not found.' });
    return;
  }

  db.markConversationRead(id, user.id);

  const otherParticipants = convo.participants.filter((p) => p !== user.id);
  socketService.broadcastToUsers(otherParticipants, {
    type: 'messages_read',
    payload: { conversationId: id, readByUserId: user.id },
  });

  res.json({ success: true, message: 'Marked as read.' });
}


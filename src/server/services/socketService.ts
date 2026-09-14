import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { db } from './dbService';
import { Message, CallLog } from '../../shared/types';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dark_falcon_ultra_secure_jwt_secret_key_2026_change_in_prod';

class SocketService {
  private wss: WebSocketServer | null = null;
  private userSockets = new Map<string, Set<AuthenticatedSocket>>();

  public initialize(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      // Extract token from query params: /ws?token=...
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            username: string;
            tokenVersion?: number;
          };
          const user = db.findUserById(decoded.id);

          if (user && !user.isBanned && !user.isSuspended) {
            // Check tokenVersion revocation
            if (!decoded.tokenVersion || !user.tokenVersion || decoded.tokenVersion >= user.tokenVersion) {
              ws.userId = decoded.id;
              ws.username = decoded.username;

              if (!this.userSockets.has(decoded.id)) {
                this.userSockets.set(decoded.id, new Set());
              }
              this.userSockets.get(decoded.id)!.add(ws);

              // Mark user online (unless ghost mode enabled)
              if (!user.hideOnlineStatus) {
                db.updateUser(decoded.id, { isOnline: true });
                this.broadcastPresence(decoded.id, true);
              }
            } else {
              ws.close(4401, 'Token revoked');
            }
          } else {
            ws.close(4403, 'Account banned or suspended');
          }
        } catch {
          // Token invalid, connection will be terminated for unauthorized socket
        }
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          this.handleSocketEvent(ws, data);
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          const sockets = this.userSockets.get(ws.userId);
          if (sockets) {
            sockets.delete(ws);
            if (sockets.size === 0) {
              this.userSockets.delete(ws.userId);
              db.updateUser(ws.userId, { isOnline: false, lastSeen: new Date().toISOString() });
              this.broadcastPresence(ws.userId, false);
            }
          }
        }
      });
    });

    // Heartbeat ping interval
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client: any) => {
        if (client.isAlive === false) return client.terminate();
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    console.log('🦅 Dark Falcon Real-time WebSocket Server attached to /ws');
  }

  private handleSocketEvent(ws: AuthenticatedSocket, event: { type: string; payload: any }) {
    if (!ws.userId && event.type !== 'authenticate') {
      return;
    }

    switch (event.type) {
      case 'authenticate': {
        const token = event.payload?.token;
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
            ws.userId = decoded.id;
            ws.username = decoded.username;
            if (!this.userSockets.has(decoded.id)) {
              this.userSockets.set(decoded.id, new Set());
            }
            this.userSockets.get(decoded.id)!.add(ws);
            db.updateUser(decoded.id, { isOnline: true });
            this.broadcastPresence(decoded.id, true);
            ws.send(JSON.stringify({ type: 'authenticated', payload: { userId: decoded.id } }));
          } catch {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
          }
        }
        break;
      }

      // Typing indicators
      case 'typing_start': {
        const { conversationId, recipientId } = event.payload;
        this.sendToUser(recipientId, {
          type: 'user_typing',
          payload: { conversationId, userId: ws.userId, username: ws.username, isTyping: true },
        });
        break;
      }

      case 'typing_stop': {
        const { conversationId, recipientId } = event.payload;
        this.sendToUser(recipientId, {
          type: 'user_typing',
          payload: { conversationId, userId: ws.userId, username: ws.username, isTyping: false },
        });
        break;
      }

      // WebRTC 1-to-1 Audio & Video Call Signaling
      case 'call_initiate': {
        const { receiverId, type } = event.payload;
        const caller = db.findUserById(ws.userId!);
        const callLog = db.logCall({
          id: `call-${Date.now()}`,
          callerId: ws.userId!,
          callerUsername: ws.username!,
          callerAvatar: caller?.avatarUrl,
          receiverId,
          receiverUsername: event.payload.receiverUsername || 'User',
          type,
          status: 'calling',
          duration: 0,
          startedAt: new Date().toISOString(),
        });

        this.sendToUser(receiverId, {
          type: 'call_incoming',
          payload: {
            callId: callLog.id,
            callerId: ws.userId,
            callerUsername: ws.username,
            callerAvatar: caller?.avatarUrl,
            type,
          },
        });
        break;
      }

      case 'call_accept': {
        const { callId, callerId } = event.payload;
        this.sendToUser(callerId, {
          type: 'call_accepted',
          payload: { callId, receiverId: ws.userId },
        });
        break;
      }

      case 'call_reject': {
        const { callId, callerId, reason } = event.payload;
        this.sendToUser(callerId, {
          type: 'call_rejected',
          payload: { callId, reason: reason || 'declined' },
        });
        break;
      }

      case 'call_end': {
        const { callId, targetUserId } = event.payload;
        this.sendToUser(targetUserId, {
          type: 'call_ended',
          payload: { callId },
        });
        break;
      }

      case 'webrtc_offer': {
        const { targetUserId, offer, callId } = event.payload;
        this.sendToUser(targetUserId, {
          type: 'webrtc_offer',
          payload: { callerId: ws.userId, offer, callId },
        });
        break;
      }

      case 'webrtc_answer': {
        const { targetUserId, answer, callId } = event.payload;
        this.sendToUser(targetUserId, {
          type: 'webrtc_answer',
          payload: { responderId: ws.userId, answer, callId },
        });
        break;
      }

      case 'ice_candidate': {
        const { targetUserId, candidate, callId } = event.payload;
        this.sendToUser(targetUserId, {
          type: 'ice_candidate',
          payload: { senderId: ws.userId, candidate, callId },
        });
        break;
      }

      // Dark Falcon Meetings Signaling
      case 'meeting_join': {
        const { meetingCode } = event.payload;
        this.broadcastToMeeting(meetingCode, {
          type: 'meeting_user_joined',
          payload: { userId: ws.userId, username: ws.username },
        }, ws.userId);
        break;
      }

      case 'meeting_leave': {
        const { meetingCode } = event.payload;
        this.broadcastToMeeting(meetingCode, {
          type: 'meeting_user_left',
          payload: { userId: ws.userId, username: ws.username },
        }, ws.userId);
        break;
      }
    }
  }

  public sendToUser(userId: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const msg = JSON.stringify(data);
      sockets.forEach((s) => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(msg);
        }
      });
    }
  }

  public broadcastToUsers(userIds: string[], data: any) {
    userIds.forEach((id) => this.sendToUser(id, data));
  }

  public broadcastPresence(userId: string, isOnline: boolean) {
    const msg = JSON.stringify({
      type: 'presence_change',
      payload: { userId, isOnline, lastSeen: new Date().toISOString() },
    });
    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  public broadcastToMeeting(meetingCode: string, data: any, excludeUserId?: string) {
    const meeting = db.getMeetingByCode(meetingCode);
    if (!meeting) return;
    const participantIds = meeting.participants
      .map((p) => p.userId)
      .filter((id) => id !== excludeUserId);
    this.broadcastToUsers(participantIds, data);
  }

  public disconnectUser(userId: string, reason = 'Session terminated') {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((s) => {
        try {
          s.send(JSON.stringify({ type: 'session_terminated', reason }));
          s.close(4403, reason);
        } catch {}
      });
      this.userSockets.delete(userId);
      this.broadcastPresence(userId, false);
    }
  }
}

export const socketService = new SocketService();

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { Meeting } from '../../shared/types';

export async function getCallLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user!;
  const logs = db.getUserCallLogs(user.id);
  res.json({ success: true, data: logs });
}

export async function createMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { title, isInstant = true, scheduledTime } = req.body;
  const user = req.user!;

  const codeSegment = Math.random().toString(36).substring(2, 6);
  const codeSegment2 = Math.random().toString(36).substring(2, 6);
  const meetingCode = `df-${codeSegment}-${codeSegment2}`;

  const meeting: Meeting = {
    id: `meet-${Date.now()}`,
    title: title || `${user.displayName}'s Falcon Meeting`,
    hostId: user.id,
    hostUsername: user.username,
    meetingCode,
    isInstant,
    scheduledTime,
    isLocked: false,
    participants: [
      {
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: 'host',
        audioMuted: false,
        videoMuted: false,
        joinedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const created = db.createMeeting(meeting);
  res.status(201).json({ success: true, data: created });
}

export async function getMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { code } = req.params;
  const meeting = db.getMeetingByCode(code);
  if (!meeting) {
    res.status(404).json({ success: false, message: 'Meeting not found.' });
    return;
  }
  res.json({ success: true, data: meeting });
}

export async function joinMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { code } = req.params;
  const user = req.user!;

  const meeting = db.getMeetingByCode(code);
  if (!meeting) {
    res.status(404).json({ success: false, message: 'Meeting not found.' });
    return;
  }

  if (meeting.isLocked && meeting.hostId !== user.id) {
    res.status(403).json({ success: false, message: 'This meeting is locked by the host.' });
    return;
  }

  const existingIdx = meeting.participants.findIndex((p) => p.userId === user.id);
  if (existingIdx === -1) {
    meeting.participants.push({
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: 'participant',
      audioMuted: false,
      videoMuted: false,
      joinedAt: new Date().toISOString(),
    });
    db.persist();
  }

  res.json({ success: true, data: meeting });
}

export async function getMeetings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const meetings = db.getAllMeetings();
  res.json({ success: true, data: meetings });
}

export async function getIceServers(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Return STUN & configured TURN servers
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    } as any);
  }

  res.json({
    success: true,
    data: {
      iceServers,
      sfuConfigured: Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_WS_URL),
    },
  });
}

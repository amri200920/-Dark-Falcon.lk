import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../services/dbService';
import { AuditLog } from '../../shared/types';
import { socketService } from '../services/socketService';

export async function getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stats = db.getAdminStats();
  res.json({ success: true, data: stats });
}

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const users = db.getAllUsers();
  res.json({ success: true, data: users });
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { role, isBanned, isSuspended } = req.body;
  const admin = req.user!;

  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const updates: any = {};
  if (role !== undefined) updates.role = role;
  if (isBanned !== undefined) updates.isBanned = Boolean(isBanned);
  if (isSuspended !== undefined) updates.isSuspended = Boolean(isSuspended);

  // If banning or suspending, revoke active sessions and disconnect sockets
  if (updates.isBanned || updates.isSuspended) {
    updates.tokenVersion = (target.tokenVersion || 1) + 1;
    updates.isOnline = false;
    db.removeOtherSessions(id, ''); // terminate all active sessions
    socketService.disconnectUser(
      id,
      updates.isBanned ? 'Account has been permanently banned' : 'Account has been temporarily suspended'
    );
  }

  const updated = db.updateUser(id, updates);

  // Log audit trail
  const log: AuditLog = {
    id: `audit-${Date.now()}`,
    adminId: admin.id,
    adminUsername: admin.username,
    action: 'UPDATE_USER_STATUS',
    targetId: id,
    targetType: 'user',
    details: `Updated user ${target.username} with ${JSON.stringify(updates)}`,
    timestamp: new Date().toISOString(),
  };
  db.logAudit(log);

  res.json({ success: true, data: updated, message: 'User updated successfully.' });
}

export async function getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  const reports = db.getReports();
  res.json({ success: true, data: reports });
}

export async function resolveReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status = 'resolved' } = req.body;
  const admin = req.user!;

  const success = db.resolveReport(id, status);
  if (!success) {
    res.status(404).json({ success: false, message: 'Report not found.' });
    return;
  }

  db.logAudit({
    id: `audit-${Date.now()}`,
    adminId: admin.id,
    adminUsername: admin.username,
    action: 'RESOLVE_REPORT',
    targetId: id,
    targetType: 'report',
    details: `Marked report ${id} as ${status}`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: `Report marked as ${status}.` });
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const logs = db.getAuditLogs();
  res.json({ success: true, data: logs });
}

import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, AlertTriangle, Activity, Check, Ban, Flag, ScrollText, Crown, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { User, Report, AuditLog } from '../../shared/types';
import { VerificationBadge } from '../components/common/VerificationBadge';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [membershipData, setMembershipData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'logs' | 'memberships'>('users');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, reportsRes, logsRes, memRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get<User[]>('/admin/users'),
        api.get<Report[]>('/admin/reports'),
        api.get<AuditLog[]>('/admin/audit-logs'),
        api.get<any>('/admin/memberships'),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
      if (memRes.success) setMembershipData(memRes.data);
    } catch (err) {
      console.warn('Admin load error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewVerification = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await api.put(`/admin/memberships/verification/${id}/review`, { status });
      if (res.success) {
        await loadAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleToggleBan = async (u: User) => {
    const nextBan = !u.isBanned;
    try {
      const res = await api.put(`/admin/users/${u.id}/status`, { isBanned: nextBan });
      if (res.success) {
        setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isBanned: nextBan } : item)));
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const res = await api.put(`/admin/reports/${reportId}/resolve`, { status });
      if (res.success) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading Sovereign Administration Console...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Dark Falcon Admin Command Console
          </h1>
          <p className="text-xs text-slate-400">Server-enforced role access, content moderation, and audit logs</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase">
          Super Admin Privileges
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Aviators', value: stats?.totalUsers || 0, icon: <Users className="w-4 h-4 text-falcon-blue" /> },
          { label: 'Total Posts', value: stats?.totalPosts || 0, icon: <FileText className="w-4 h-4 text-emerald-400" /> },
          { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
          { label: 'Active Meetings', value: stats?.totalMeetings || 0, icon: <Activity className="w-4 h-4 text-sky-400" /> },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#1b2438] pb-3 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-falcon-blue text-white' : 'bg-[#121826] text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
            activeTab === 'reports' ? 'bg-falcon-blue text-white' : 'bg-[#121826] text-slate-400 hover:text-white'
          }`}
        >
          <Flag className="w-4 h-4" /> Moderation Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
            activeTab === 'logs' ? 'bg-falcon-blue text-white' : 'bg-[#121826] text-slate-400 hover:text-white'
          }`}
        >
          <ScrollText className="w-4 h-4" /> Immutable Audit Logs ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${
            activeTab === 'memberships' ? 'bg-falcon-blue text-white' : 'bg-[#121826] text-slate-400 hover:text-white'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" /> Memberships & Eagle Badges (
          {membershipData?.verificationApplications?.length || 0})
        </button>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090d15] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1b2438]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Followers</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2438]/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#090d15]">
                  <td className="p-4 flex items-center gap-3">
                    <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" />
                    <div>
                      <p className="font-bold text-white">{u.displayName}</p>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge role={u.role} isVerified={u.isVerified} />
                  </td>
                  <td className="p-4">
                    {u.isBanned ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold text-[10px]">
                        BANNED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-4">{u.followersCount}</td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant={u.isBanned ? 'secondary' : 'danger'}
                      onClick={() => handleToggleBan(u)}
                    >
                      {u.isBanned ? 'Unban' : 'Ban User'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Moderation Reports */}
      {activeTab === 'reports' && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-sm p-4 space-y-3">
          {reports.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500">No moderation reports logged.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="p-3.5 bg-[#090d15] border border-[#1b2438] rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-xs">Reason: {r.reason.toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">Reporter: @{r.reporterUsername} • Target ID: {r.targetId}</p>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => handleResolveReport(r.id, 'resolved')}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleResolveReport(r.id, 'dismissed')}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-sm p-4 space-y-2 text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No administrative actions logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-[#090d15] border border-[#1b2438] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-falcon-blue mr-2">[{log.action}]</span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Memberships & Eagle Badge Management */}
      {activeTab === 'memberships' && (
        <div className="space-y-6">
          {/* Revenue & Stats overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl">
              <span className="text-xs text-slate-400">Total Subscriptions</span>
              <p className="text-xl font-black text-white mt-1">
                {membershipData?.stats?.totalSubscriptions || 0}
              </p>
            </div>
            <div className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl">
              <span className="text-xs text-slate-400">Active Subscriptions</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {membershipData?.stats?.activeSubscriptions || 0}
              </p>
            </div>
            <div className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl">
              <span className="text-xs text-slate-400">Total Revenue (LKR)</span>
              <p className="text-xl font-black text-amber-300 mt-1">
                LKR {(membershipData?.stats?.totalRevenueLKR || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl">
              <span className="text-xs text-slate-400">Pending Eagle Badges</span>
              <p className="text-xl font-black text-sky-400 mt-1">
                {membershipData?.stats?.pendingVerificationApplications || 0}
              </p>
            </div>
          </div>

          {/* Verification Applications Queue */}
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <VerificationBadge size="xs" showTooltip={false} /> Sovereign Eagle Verification Applications
              </h3>
              <span className="text-xs text-slate-400">
                {membershipData?.verificationApplications?.length || 0} total requests
              </span>
            </div>

            {(!membershipData?.verificationApplications ||
              membershipData.verificationApplications.length === 0) ? (
              <p className="text-center py-8 text-xs text-slate-500">
                No verification applications submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {membershipData.verificationApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 bg-[#090d15] border border-[#1b2438] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{app.displayName}</span>
                        <span className="text-xs text-slate-400">(@{app.username})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : app.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Legal Name: <strong className="text-white">{app.legalFullName}</strong> • Category: {app.category} • Doc: {app.documentType}
                      </p>
                      <p className="text-xs text-slate-400 italic">"{app.description}"</p>
                      {app.documentUrl && (
                        <p className="text-[11px] text-sky-400">
                          Document Link: {app.documentUrl}
                        </p>
                      )}
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleReviewVerification(app.id, 'approved')}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve & Award Eagle
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReviewVerification(app.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

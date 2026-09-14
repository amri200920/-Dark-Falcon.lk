import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Shield,
  Lock,
  Smartphone,
  Eye,
  Sun,
  Moon,
  Globe,
  Trash2,
  LogOut,
  Check,
  AlertTriangle,
  Server,
  Camera,
  Upload,
  KeyRound,
  Copy,
  Mail,
  Monitor,
  Tv,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { UserSession, SystemConfigStatus } from '../../shared/types';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, setAppLockPin, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'devices' | 'privacy' | 'appearance' | 'services'>('security');
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfigStatus | null>(null);

  // App lock pin state
  const [newPin, setNewPin] = useState('');
  const [pinTimeout, setPinTimeout] = useState(5);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Privacy toggles
  const [hideOnlineStatus, setHideOnlineStatus] = useState(user?.hideOnlineStatus || false);
  const [hideLastSeen, setHideLastSeen] = useState(user?.hideLastSeen || false);
  const [hideReadReceipts, setHideReadReceipts] = useState(user?.hideReadReceipts || false);
  const [privacySuccess, setPrivacySuccess] = useState(false);

  // Profile picture & info state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Recovery options state
  const [recoveryEmail, setRecoveryEmail] = useState(user?.recoveryEmail || '');
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [recoveryCopied, setRecoveryCopied] = useState(false);

  // Data export and deletion
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
    loadSystemConfig();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get<UserSession[]>('/auth/sessions');
      if (res.success) setSessions(res.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const res = await api.get<SystemConfigStatus>('/config/status');
      if (res.success) setSystemConfig(res.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    try {
      await setAppLockPin(newPin, pinTimeout);
      setPinSuccess(true);
      setNewPin('');
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to set PIN');
    }
  };

  const handleTerminateOthers = async () => {
    try {
      await api.post('/auth/sessions/terminate-others', {
        currentSessionId: sessions[0]?.id,
      });
      loadSessions();
      alert('All other devices have been logged out.');
    } catch (e: any) {
      alert(e.message || 'Failed to terminate sessions');
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await api.upload<{ url: string }>(file);
      if (res.success && res.data?.url) {
        await updateUser({ avatarUrl: res.data.url });
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  const handleSaveRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/recovery/configure', {
        recoveryEmail: recoveryEmail.trim(),
      });
      if (user) {
        await updateUser({ recoveryEmail: recoveryEmail.trim() });
      }
      setRecoverySaved(true);
      setTimeout(() => setRecoverySaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save recovery configuration');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e: any) {
      alert(e.message || 'Failed to terminate session');
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        hideOnlineStatus,
        hideLastSeen,
        hideReadReceipts,
      });
      setPrivacySuccess(true);
      setTimeout(() => setPrivacySuccess(false), 3000);
    } catch (e: any) {
      alert('Failed to update privacy settings: ' + e.message);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.get<any>('/users/data/export');
      if (res.success && res.data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `dark-falcon-account-data-${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (e: any) {
      alert('Failed to export data: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== user?.username.toLowerCase()) {
      alert(`Please type your exact username (${user?.username}) to confirm account deletion.`);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await api.delete('/users/account');
      if (res.success) {
        alert('Your Dark Falcon account and all associated data have been permanently deleted.');
        logout();
      }
    } catch (e: any) {
      alert('Account deletion failed: ' + e.message);
      setIsDeleting(false);
    }
  };

  const getDeviceIcon = (deviceStr: string) => {
    const d = (deviceStr || '').toLowerCase();
    if (d.includes('android') || d.includes('mobile') || d.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-emerald-400" />;
    }
    if (d.includes('tv') || d.includes('smarttv') || d.includes('google tv')) {
      return <Tv className="w-4 h-4 text-purple-400" />;
    }
    if (d.includes('windows') || d.includes('mac') || d.includes('desktop') || d.includes('linux')) {
      return <Monitor className="w-4 h-4 text-falcon-blue" />;
    }
    return <Globe className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 select-none">
      {/* Settings Header */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-white mb-1">Platform Settings</h1>
        <p className="text-xs text-slate-400">Manage security, app lock, sessions, appearance, and integrations</p>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto mt-4 pt-4 border-t border-[#1b2438] text-xs">
          {[
            { id: 'security', label: 'Security & PIN', icon: <Lock className="w-3.5 h-3.5" /> },
            { id: 'devices', label: 'Devices & Sessions', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'privacy', label: 'Privacy & Data Control', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'account', label: 'Account Profile', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'appearance', label: 'Appearance & TV Mode', icon: <Sun className="w-3.5 h-3.5" /> },
            { id: 'services', label: 'Infrastructure Status', icon: <Server className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-falcon-blue text-white shadow-neon-blue'
                  : 'bg-[#121826] text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security & App Lock Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* App Lock PIN Setup */}
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-falcon-blue" />
              App Lock PIN Protection
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Require a 4-digit PIN whenever opening Dark Falcon or accessing hidden locked chats.
            </p>

            {pinSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> App Lock PIN configured successfully!
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-4 max-w-sm">
              <Input
                label="Set 4-Digit Security PIN"
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Auto-Lock Inactivity Timer
                </label>
                <select
                  value={pinTimeout}
                  onChange={(e) => setPinTimeout(Number(e.target.value))}
                  className="w-full bg-[#090d15] text-xs text-white border border-[#1b2438] rounded-xl p-2.5"
                >
                  <option value={1}>1 Minute</option>
                  <option value={5}>5 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>

              <Button type="submit" variant="glow">
                Save App Lock PIN
              </Button>
            </form>
          </div>

          {/* Account Recovery & Master Key */}
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-falcon-blue" />
              Account Recovery & Sovereign Key
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure your emergency recovery options so you never lose access to your sovereign Dark Falcon account.
            </p>

            {recoverySaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> Recovery preferences saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveRecovery} className="space-y-4 max-w-md">
              <Input
                label="Backup Recovery Email"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="backup-recovery@domain.com"
                icon={<Mail className="w-4 h-4" />}
              />

              {user?.recoveryKey && (
                <div className="p-3.5 bg-[#090d15] rounded-xl border border-[#1b2438] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-falcon-blue" />
                      Sovereign Master Recovery Key
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (user.recoveryKey) {
                          navigator.clipboard.writeText(user.recoveryKey);
                          setRecoveryCopied(true);
                          setTimeout(() => setRecoveryCopied(false), 2000);
                        }
                      }}
                      className="text-[10px] text-falcon-blue hover:text-white flex items-center gap-1 bg-falcon-blue/20 hover:bg-falcon-blue/40 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {recoveryCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {recoveryCopied ? 'Copied' : 'Copy Key'}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-falcon-blue select-all break-all p-2 bg-black/50 rounded-lg">
                    {user.recoveryKey}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Store this key in a secure password vault. It can be used to override password loss anytime.
                  </p>
                </div>
              )}

              <Button type="submit" variant="glow">
                Save Recovery Settings
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Devices & Active Sessions Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1b2438] flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-falcon-blue" />
                  Authorized Hardware & Active Sessions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitor hardware authorized to access your Dark Falcon sovereign account. Terminate stale or unrecognized sessions.
                </p>
              </div>

              {sessions.length > 1 && (
                <Button variant="danger" size="sm" onClick={handleTerminateOthers}>
                  Log Out All Other Devices
                </Button>
              )}
            </div>

            <div className="divide-y divide-[#1b2438] pt-3">
              {sessions.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">No other active sessions detected.</div>
              ) : (
                sessions.map((sess) => (
                  <div key={sess.id} className="py-4 flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-[#090d15] border border-[#1b2438]">
                        {getDeviceIcon(sess.device)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-white flex items-center gap-2">
                          <span>{sess.device || 'Dark Falcon Client'}</span>
                          {sess.current ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                              Current Session
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                              Remote
                            </span>
                          )}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          IP Address: <span className="font-mono text-slate-300">{sess.ip}</span> • Browser: {sess.browser || 'Web Client'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Last activity: {new Date(sess.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!sess.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleTerminateSession(sess.id)}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Data Control Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy Toggles */}
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-falcon-blue" />
                Sovereign Privacy Controls
              </h2>
              <p className="text-xs text-slate-400">Manage who can see your online presence and read receipts across Dark Falcon.</p>
            </div>

            {privacySuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> Privacy settings updated and broadcasted!
              </div>
            )}

            <form onSubmit={handleSavePrivacy} className="space-y-4 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#090d15] border border-[#1b2438] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Hide Online Presence</span>
                  <span className="text-[11px] text-slate-400">Do not broadcast green active badges to peers on WebSocket.</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideOnlineStatus}
                  onChange={(e) => setHideOnlineStatus(e.target.checked)}
                  className="w-4 h-4 rounded text-falcon-blue focus:ring-falcon-blue"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#090d15] border border-[#1b2438] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Hide Last Seen Timestamp</span>
                  <span className="text-[11px] text-slate-400">Conceal the exact time you were last active on the platform.</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideLastSeen}
                  onChange={(e) => setHideLastSeen(e.target.checked)}
                  className="w-4 h-4 rounded text-falcon-blue focus:ring-falcon-blue"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#090d15] border border-[#1b2438] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Hide Message Read Receipts</span>
                  <span className="text-[11px] text-slate-400">Do not send blue double-check delivery indicators to message senders.</span>
                </div>
                <input
                  type="checkbox"
                  checked={hideReadReceipts}
                  onChange={(e) => setHideReadReceipts(e.target.checked)}
                  className="w-4 h-4 rounded text-falcon-blue focus:ring-falcon-blue"
                />
              </label>

              <Button type="submit" variant="glow">
                Save Privacy Settings
              </Button>
            </form>
          </div>

          {/* Data Portability Card */}
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Data Portability & Archive Export
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with GDPR Article 20 and Google Play Data Safety requirements, you may download a machine-readable JSON copy of your personal data, post summaries, contacts, and configuration.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? 'Generating JSON Archive...' : 'Export Account Data (JSON)'}
            </Button>
          </div>

          {/* Account Deletion Card */}
          <div className="bg-[#0c101a] border border-red-500/30 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Permanent Account De-Registration
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanently purge your account, credentials, cryptographic identity, and direct notifications from our database. This action is irreversible.
            </p>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
              Deactivate / Delete Account
            </Button>
          </div>
        </div>
      )}

      {/* Account Profile Tab */}
      {activeTab === 'account' && user && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Account & Profile Information</h2>
            <p className="text-xs text-slate-400">Update your avatar, public biography, and account details</p>
          </div>

          {/* Profile Picture Customizer */}
          <div className="p-4 bg-[#090d15] rounded-2xl border border-[#1b2438] space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-falcon-blue" />
              Profile Picture & Avatar
            </h3>

            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarFileSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName}
                size="xl"
                className="ring-2 ring-falcon-blue/50"
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateUser({ avatarUrl: '/assets/brand/dark-falcon-logo.png' })}
                  >
                    Reset to Falcon Logo
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Select any JPG, PNG, or GIF file from your computer to update your avatar.
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell other aviators about yourself..."
                  className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>
              <Input
                label="Website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
              <Button type="submit" variant="glow" size="sm">
                Save Profile Information
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#090d15] rounded-xl border border-[#1b2438]">
              <span className="text-slate-500 block">Sovereign Username</span>
              <span className="font-bold text-slate-200">@{user.username}</span>
            </div>
            <div className="p-3 bg-[#090d15] rounded-xl border border-[#1b2438]">
              <span className="text-slate-500 block">Email Address</span>
              <span className="font-bold text-slate-200">{user.email}</span>
            </div>
            <div className="p-3 bg-[#090d15] rounded-xl border border-[#1b2438]">
              <span className="text-slate-500 block">User Role</span>
              <span className="font-bold text-falcon-blue uppercase">{user.role}</span>
            </div>
            <div className="p-3 bg-[#090d15] rounded-xl border border-[#1b2438]">
              <span className="text-slate-500 block">Member Since</span>
              <span className="font-bold text-slate-200">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1b2438] flex items-center justify-between">
            <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
              Deactivate / Delete Account
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} icon={<LogOut className="w-4 h-4" />}>
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Appearance & Theme Tab */}
      {activeTab === 'appearance' && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white mb-1">Theme Preferences</h2>
          <p className="text-xs text-slate-400 mb-4">Choose your preferred visual presentation</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark (Default)', icon: <Moon className="w-5 h-5 text-falcon-blue" /> },
              { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5 text-amber-400" /> },
              { id: 'system', label: 'Follow System', icon: <Globe className="w-5 h-5 text-slate-400" /> },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTheme(mode.id as any)}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                  theme === mode.id
                    ? 'bg-[#121826] border-falcon-blue shadow-neon-blue'
                    : 'bg-[#090d15] border-[#1b2438] hover:border-slate-700'
                }`}
              >
                {mode.icon}
                <span className="text-xs font-bold text-white">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* External Services & Status Tab */}
      {activeTab === 'services' && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white mb-1">External Infrastructure Status</h2>
          <p className="text-xs text-slate-400 mb-4">Real-time status of connected cloud services and adapters</p>

          <div className="space-y-3 text-xs">
            {[
              {
                name: 'Persistence Engine (Firebase Firestore)',
                configured: systemConfig?.firebaseConfigured,
                desc: systemConfig?.firebaseConfigured
                  ? 'Connected to live Firebase Cloud Firestore'
                  : 'Operating in High-Fidelity Local Persistence Mode (Zero-Config JSON Store)',
              },
              {
                name: 'Dark Falcon AI (Google Gemini)',
                configured: systemConfig?.geminiConfigured,
                desc: systemConfig?.geminiConfigured
                  ? 'Active neural intelligence via server-side Gemini SDK'
                  : 'Standing by: Add GEMINI_API_KEY to .env to activate live API',
              },
              {
                name: 'WebRTC STUN/TURN Relays',
                configured: true,
                desc: 'Standard Google STUN active; custom TURN relays can be added in .env',
              },
              {
                name: 'SFU Group Video (LiveKit / Mediasoup)',
                configured: systemConfig?.sfuConfigured,
                desc: systemConfig?.sfuConfigured
                  ? 'LiveKit SFU cluster connected for large rooms'
                  : 'Ready for production SFU credentials in .env',
              },
              {
                name: 'SMS OTP Provider',
                configured: systemConfig?.smsConfigured,
                desc: systemConfig?.smsConfigured
                  ? 'SMS OTP provider connected'
                  : 'Configuration required for phone verification codes',
              },
            ].map((svc, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-[#090d15] border border-[#1b2438] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{svc.name}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{svc.desc}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    svc.configured
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {svc.configured ? 'Configured' : 'Local / Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Deactivate or Delete Account">
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Are you sure you wish to delete your Dark Falcon sovereign account? All your posts, cryptographic identities, active sessions, and direct messages will be permanently removed. This action cannot be undone.
          </p>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
            <p className="text-red-400 font-semibold">
              Type your username <span className="font-mono text-white font-bold">{user?.username}</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={user?.username || 'username'}
              className="bg-[#090d15] border-red-500/40 text-white"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={deleteConfirmText.trim().toLowerCase() !== user?.username?.toLowerCase() || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

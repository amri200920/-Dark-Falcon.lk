import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Globe, Calendar, Users, Phone, Video, MessageSquare, Shield, Check, Camera, Upload, Image, RefreshCw } from 'lucide-react';
import { User, Post } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import { useCall } from '../contexts/CallContext';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { PremiumBadge } from '../components/common/PremiumBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { PostCard } from '../components/feed/PostCard';
import { StoryHighlights } from '../components/stories/StoryHighlights';

interface ProfilePageProps {
  username?: string;
  onOpenDirectChat?: (targetUser: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ username, onOpenDirectChat }) => {
  const { user: currentUser, updateUser } = useAuth();
  const { startCall } = useCall();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const targetUsername = username || currentUser?.username;
  const isSelf = currentUser && profileUser && currentUser.id === profileUser.id;

  useEffect(() => {
    if (targetUsername) {
      loadProfile(targetUsername);
    }
  }, [targetUsername]);

  const loadProfile = async (u: string) => {
    try {
      const res = await api.get<any>(`/users/profile/${u}`);
      if (res.success && res.data) {
        setProfileUser(res.data);
        setIsFollowing(res.data.isFollowing || false);
        setEditName(res.data.displayName || '');
        setEditBio(res.data.bio || '');
        setEditWebsite(res.data.website || '');
        setEditAvatarUrl(res.data.avatarUrl || '/assets/brand/dark-falcon-logo.png');
        setEditCoverUrl(res.data.coverUrl || '');
      }

      // Load user posts
      const postsRes = await api.get<Post[]>('/posts/feed?limit=50');
      if (postsRes.success) {
        setUserPosts(postsRes.data.filter((p) => p.username === u));
      }
    } catch (e) {
      console.warn('Profile load error', e);
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await api.upload<{ url: string }>(file);
      if (res.success && res.data?.url) {
        const newUrl = res.data.url;
        await updateUser({ avatarUrl: newUrl });
        setProfileUser((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null));
        setEditAvatarUrl(newUrl);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const res = await api.upload<{ url: string }>(file);
      if (res.success && res.data?.url) {
        const newUrl = res.data.url;
        await updateUser({ coverUrl: newUrl });
        setProfileUser((prev) => (prev ? { ...prev, coverUrl: newUrl } : null));
        setEditCoverUrl(newUrl);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload cover banner.');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        displayName: editName.trim(),
        bio: editBio.trim(),
        website: editWebsite.trim(),
        avatarUrl: editAvatarUrl || undefined,
        coverUrl: editCoverUrl || undefined,
      });
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          displayName: editName.trim(),
          bio: editBio.trim(),
          website: editWebsite.trim(),
          avatarUrl: editAvatarUrl || profileUser.avatarUrl,
          coverUrl: editCoverUrl || profileUser.coverUrl,
        });
      }
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const toggleFollow = async () => {
    if (!profileUser) return;
    try {
      if (isFollowing) {
        await api.post(`/users/${profileUser.id}/unfollow`);
        setIsFollowing(false);
        setProfileUser((prev) => (prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null));
      } else {
        await api.post(`/users/${profileUser.id}/follow`);
        setIsFollowing(true);
        setProfileUser((prev) => (prev ? { ...prev, followersCount: prev.followersCount + 1 } : null));
      }
    } catch (e) {
      console.warn('Follow toggle error', e);
    }
  };

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 animate-page-enter">
        {/* Profile Card Skeleton */}
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-2xl">
          {/* Cover skeleton */}
          <div className="h-44 sm:h-56 skeleton-shimmer" />
          <div className="px-5 pb-5">
            {/* Avatar + actions row */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#0c101a] skeleton-shimmer flex-shrink-0" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
                <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
              </div>
            </div>
            {/* Name / handle */}
            <div className="space-y-2 mb-4">
              <div className="h-5 w-40 rounded-full skeleton-shimmer" />
              <div className="h-3 w-24 rounded-full skeleton-shimmer" />
              <div className="h-3 w-64 rounded-full skeleton-shimmer" />
              <div className="h-3 w-48 rounded-full skeleton-shimmer" />
            </div>
            {/* Stats row */}
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-4 w-8 rounded-full skeleton-shimmer" />
                  <div className="h-2 w-14 rounded-full skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Post grid skeleton */}
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Profile Card */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-2xl">
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={avatarInputRef}
          onChange={handleAvatarFileSelect}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Cover Banner */}
        <div className="h-44 sm:h-56 bg-gradient-to-r from-blue-950 via-slate-900 to-black relative group overflow-hidden">
          <img
            src={profileUser.coverUrl || '/assets/brand/dark-falcon-logo.png'}
            alt="Cover"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              profileUser.coverUrl ? 'opacity-70' : 'opacity-20'
            }`}
          />
          {isSelf && (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all opacity-80 hover:opacity-100 shadow-lg"
              title="Change Cover Banner"
            >
              {isUploadingCover ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-falcon-blue" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-falcon-blue" />
              )}
              <span>{isUploadingCover ? 'Uploading...' : 'Change Cover'}</span>
            </button>
          )}
        </div>

        {/* Profile Info Header */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar floating */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            <div className="relative group inline-block">
              <Avatar
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                size="2xl"
                isOnline={profileUser.isOnline}
                className="ring-4 ring-[#0c101a] shadow-xl"
              />
              {isSelf && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 bg-falcon-blue hover:bg-falcon-blueGlow text-white p-2 rounded-full shadow-neon-blue border-2 border-[#0c101a] transition-transform duration-200 hover:scale-110 active:scale-95 group/btn"
                  title="Upload profile picture"
                >
                  {isUploadingAvatar ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isSelf ? (
                <Button variant="secondary" size="sm" icon={<Edit3 className="w-4 h-4" />} onClick={() => setIsEditOpen(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'glow'}
                    size="sm"
                    onClick={toggleFollow}
                    className="transition-all duration-200 active:scale-95"
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1.5 animate-falcon-pulse">
                        <Check className="w-4 h-4 text-emerald-400" /> Following
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-falcon-blue" /> Follow
                      </span>
                    )}
                  </Button>
                  {onOpenDirectChat && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<MessageSquare className="w-4 h-4" />}
                      onClick={() => onOpenDirectChat(profileUser)}
                    >
                      Message
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Phone className="w-4 h-4" />}
                    onClick={() => startCall(profileUser.id, profileUser.username, 'voice', profileUser.avatarUrl)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Video className="w-4 h-4" />}
                    onClick={() => startCall(profileUser.id, profileUser.username, 'video', profileUser.avatarUrl)}
                  />
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-white">{profileUser.displayName}</h1>
              <Badge role={profileUser.role} isVerified={profileUser.isVerified} size="md" />
              {(profileUser.membershipTier === 'premium' || profileUser.membershipTier === 'premium_verified') && (
                <PremiumBadge size="md" />
              )}
            </div>
            <p className="text-xs text-slate-400">@{profileUser.username}</p>

            {profileUser.bio && (
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl whitespace-pre-line pt-1">
                {profileUser.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 flex-wrap">
              {profileUser.website && (
                <a
                  href={profileUser.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-falcon-blue hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Joined {new Date(profileUser.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Counters */}
            <div className="flex items-center gap-6 pt-3 border-t border-[#1b2438]/80 text-xs">
              <div>
                <span className="font-bold text-white text-sm">{profileUser.postsCount}</span>{' '}
                <span className="text-slate-400">Posts</span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">{profileUser.followersCount}</span>{' '}
                <span className="text-slate-400">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white text-sm">{profileUser.followingCount}</span>{' '}
                <span className="text-slate-400">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Story Highlights */}
      <StoryHighlights userId={profileUser.id} isSelf={Boolean(isSelf)} />

      {/* User's Posts Feed */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Posts</h3>
        {userPosts.length === 0 ? (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-8 text-center text-xs text-slate-500">
            No posts published by this user yet.
          </div>
        ) : (
          userPosts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Sovereign Profile">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar Edit Section */}
          <div className="p-4 bg-[#090d15] rounded-2xl border border-[#1b2438] space-y-3">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-falcon-blue" />
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                src={editAvatarUrl || profileUser.avatarUrl}
                alt="Preview"
                size="lg"
                className="ring-2 ring-falcon-blue/50"
              />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditAvatarUrl('/assets/brand/dark-falcon-logo.png')}
                  >
                    Falcon Logo
                  </Button>
                </div>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG, WebP up to 50MB</span>
              </div>
            </div>

            {/* Quick Falcon Avatar Presets */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">Or Choose an Aviator Preset:</span>
              <div className="flex gap-2">
                {[
                  { label: 'Dark Falcon', url: '/assets/brand/dark-falcon-logo.png' },
                  { label: 'Cyber Pilot', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
                  { label: 'Stealth Tech', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' },
                  { label: 'Neon Sentinel', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditAvatarUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden w-10 h-10 border transition-all ${
                      editAvatarUrl === preset.url
                        ? 'border-falcon-blue scale-110 shadow-neon-blue'
                        : 'border-[#1b2438] opacity-70 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Banner Edit Section */}
          <div className="p-4 bg-[#090d15] rounded-2xl border border-[#1b2438] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-falcon-blue" />
                Cover Banner
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? 'Uploading...' : 'Upload Banner'}
              </Button>
            </div>
            {editCoverUrl && (
              <div className="h-16 rounded-xl overflow-hidden border border-[#1b2438] relative">
                <img src={editCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setEditCoverUrl('')}
                  className="absolute top-1 right-1 bg-black/70 text-red-400 text-[10px] px-1.5 py-0.5 rounded-md"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <Input label="Display Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Bio</label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell other aviators about yourself..."
              className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white resize-none"
            />
          </div>
          <Input label="Website" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://..." />
          <Button type="submit" variant="glow" className="w-full">Save Changes</Button>
        </form>
      </Modal>
    </div>
  );
};

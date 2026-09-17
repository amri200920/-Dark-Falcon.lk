import React, { useState, useRef } from 'react';
import { Image, Sparkles, Globe, Users, Lock, X, Hash, MapPin, Zap, Film, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Post, PostPrivacy } from '../../../shared/types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  onSwitchToStory?: () => void;
  onSwitchToReel?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  onSwitchToStory,
  onSwitchToReel,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [location, setLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...selected]);
      const newPreviews = selected.map((f) => URL.createObjectURL(f));
      setMediaPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllMedia = () => {
    setMediaFiles([]);
    setMediaPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateAICaption = async () => {
    setIsAILoading(true);
    try {
      const topic = content.trim() || 'Dark Falcon sovereign communication platform';
      const res = await api.post<string[]>('/ai/caption', { topic });
      if (res.success && res.data && res.data.length > 0) {
        setContent(res.data[0]);
      }
    } catch (e: any) {
      alert('AI Caption error: ' + (e.message || 'Service unavailable'));
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateAIHashtags = async () => {
    setIsAILoading(true);
    try {
      const topic = content.trim() || 'Dark Falcon';
      const res = await api.post<string[]>('/ai/hashtags', { topic });
      if (res.success && res.data) {
        setContent((prev) => `${prev.trim()}\n\n${res.data.join(' ')}`);
      }
    } catch (e: any) {
      alert('AI Hashtags error: ' + (e.message || 'Service unavailable'));
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const uploadPromises = mediaFiles.map((file) => api.upload(file));
      const uploadResults = await Promise.all(uploadPromises);
      const mediaUrls = uploadResults
        .filter((r) => r.success && r.data?.url)
        .map((r) => r.data.url);

      const res = await api.post<Post>('/posts', {
        content: content.trim(),
        mediaUrls,
        mediaType: mediaUrls.length > 1 ? 'carousel' : mediaUrls.length === 1 ? (mediaUrls[0].endsWith('.mp4') ? 'video' : 'image') : 'text',
        privacy,
      });

      if (res.success && res.data) {
        onPostCreated(res.data);
        setContent('');
        clearAllMedia();
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dark Falcon Creation Studio 🦅" maxWidth="lg">
      <div className="space-y-4">
        {/* Format Selector: Post | Story | Reel */}
        {(onSwitchToStory || onSwitchToReel) && (
          <div className="flex items-center gap-1 p-1 bg-[#090d15] border border-[#1b2438] rounded-2xl">
            <button
              type="button"
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-falcon-blue text-white shadow-neon-blue flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Post
            </button>
            {onSwitchToStory && (
              <button
                type="button"
                onClick={onSwitchToStory}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Story
              </button>
            )}
            {onSwitchToReel && (
              <button
                type="button"
                onClick={onSwitchToReel}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <Film className="w-3.5 h-3.5 text-purple-400" /> Reel
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Author preview & privacy dropdown */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar src={user?.avatarUrl} alt={user?.displayName} size="sm" />
              <div>
                <p className="text-xs font-bold text-white">{user?.displayName}</p>
                <p className="text-[11px] text-slate-400">@{user?.username}</p>
              </div>
            </div>

            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
              className="bg-[#090d15] text-xs text-slate-300 border border-[#1b2438] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-falcon-blue"
            >
              <option value="public">🌐 Public</option>
              <option value="followers">👥 Followers</option>
              <option value="close_friends">⭐ Close Friends</option>
              <option value="only_me">🔒 Only Me</option>
            </select>
          </div>

          {/* Text Area */}
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening across the digital skies? Type #hashtags and @mentions..."
            className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue resize-none"
          />

          {/* Optional Location Input */}
          {showLocation && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#090d15] border border-[#1b2438] rounded-xl text-xs">
              <MapPin className="w-3.5 h-3.5 text-falcon-blue shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (e.g. Neo Tokyo, Global Mesh HQ)..."
                className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setShowLocation(false);
                }}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

        {/* Media Previews Grid */}
        {mediaPreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 bg-black/40 rounded-xl border border-[#1b2438]">
            {mediaPreviews.map((preview, idx) => {
              const isVideo = mediaFiles[idx]?.type.startsWith('video');
              return (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-[#1b2438] bg-black h-28 flex items-center justify-center group">
                  {isVideo ? (
                    <video src={preview} className="h-full w-full object-cover" />
                  ) : (
                    <img src={preview} alt="Upload preview" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/75 hover:bg-red-600 text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* AI Content Toolbar */}
        <div className="flex items-center gap-2 flex-wrap py-1 text-xs">
          <button
            type="button"
            onClick={handleGenerateAICaption}
            disabled={isAILoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-falcon-blue/15 hover:bg-falcon-blue/25 text-falcon-blue border border-falcon-blue/30 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAILoading ? 'AI Thinking...' : 'Dark Falcon AI Caption'}
          </button>
          <button
            type="button"
            onClick={handleGenerateAIHashtags}
            disabled={isAILoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            <Hash className="w-3.5 h-3.5" />
            AI Hashtags
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1b2438]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-falcon-blue transition-colors px-2 py-1"
            >
              <Image className="w-4 h-4" /> Add Photos/Videos {mediaFiles.length > 0 && `(${mediaFiles.length})`}
            </button>

            <button
              type="button"
              onClick={() => setShowLocation(!showLocation)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-falcon-blue transition-colors px-2 py-1"
            >
              <MapPin className="w-3.5 h-3.5" /> {location ? location : 'Location'}
            </button>
          </div>

          <Button
            type="submit"
            variant="glow"
            isLoading={isSubmitting}
            disabled={!content.trim() && mediaFiles.length === 0}
          >
            Publish Post
          </Button>
        </div>
        </form>
      </div>
    </Modal>
  );
};

import React, { useState, useRef } from 'react';
import { Image, Sparkles, Globe, Users, Lock, X, Hash } from 'lucide-react';
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
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
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
    if (!content.trim() && !mediaFile) return;

    setIsSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      if (mediaFile) {
        const uploadRes = await api.upload(mediaFile);
        if (uploadRes.success && uploadRes.data?.url) {
          mediaUrls.push(uploadRes.data.url);
        }
      }

      const res = await api.post<Post>('/posts', {
        content: content.trim(),
        mediaUrls,
        privacy,
      });

      if (res.success && res.data) {
        onPostCreated(res.data);
        setContent('');
        removeMedia();
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Dark Falcon Post" maxWidth="lg">
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

        {/* Media Preview if attached */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden border border-[#1b2438] bg-black max-h-60 flex items-center justify-center">
            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="max-h-60 w-full object-contain" />
            ) : (
              <img src={mediaPreview} alt="Upload preview" className="max-h-60 w-full object-cover" />
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-4 h-4" />
            </button>
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
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-falcon-blue transition-colors px-2 py-1"
          >
            <Image className="w-4 h-4" /> Add Photo/Video
          </button>

          <Button
            type="submit"
            variant="glow"
            isLoading={isSubmitting}
            disabled={!content.trim() && !mediaFile}
          >
            Publish Post
          </Button>
        </div>
      </form>
    </Modal>
  );
};

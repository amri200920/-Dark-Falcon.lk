import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Pin,
  Trash2,
  Flag,
} from 'lucide-react';
import { Post, ReactionType } from '../../../shared/types';
import { REACTION_ICONS } from '../../../shared/constants';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { ReactionPicker } from './ReactionPicker';
import { CommentSection } from './CommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted }) => {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const userReaction = user
    ? currentPost.reactions.find((r) => r.userId === user.id)?.type
    : undefined;

  const handleToggleReaction = async (type: ReactionType = 'like') => {
    setShowReactions(false);
    try {
      const res = await api.post<Post>(`/posts/${currentPost.id}/reactions`, { type });
      if (res.success && res.data) {
        setCurrentPost(res.data);
      }
    } catch (e) {
      console.warn('Reaction toggle error:', e);
    }
  };

  const handleToggleSave = async () => {
    try {
      const res = await api.post('/saved/toggle', {
        itemType: 'post',
        itemId: currentPost.id,
        itemData: currentPost,
      });
      if (res.success) {
        setIsSaved(res.data.isSaved);
      }
    } catch (e) {
      console.warn('Save toggle error:', e);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await api.delete(`/posts/${currentPost.id}`);
      if (res.success) {
        onPostDeleted?.(currentPost.id);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete post');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Dark Falcon post by ${currentPost.userDisplayName}`,
        text: currentPost.content,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Post link copied to clipboard!');
    }
  };

  const privacyIcon = {
    public: <Globe className="w-3 h-3 text-slate-400" aria-label="Public" />,
    followers: <Users className="w-3 h-3 text-slate-400" aria-label="Followers only" />,
    close_friends: <Users className="w-3 h-3 text-emerald-400" aria-label="Close friends" />,
    only_me: <Lock className="w-3 h-3 text-amber-400" aria-label="Only me" />,
  }[currentPost.privacy] || <Globe className="w-3 h-3 text-slate-400" />;

  const isAuthor = user && user.id === currentPost.userId;
  const canModerate = user && ['admin', 'super_admin', 'moderator'].includes(user.role);

  return (
    <article className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-falcon-card transition-all duration-200 hover:border-falcon-blue/30">
      {/* Pinned Tag */}
      {currentPost.isPinned && (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-falcon-blue mb-2.5">
          <Pin className="w-3 h-3" /> Pinned Post
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Avatar src={currentPost.userAvatar} alt={currentPost.userDisplayName} size="md" />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-100">{currentPost.userDisplayName}</span>
              <Badge isVerified={true} />
              <span className="text-xs text-slate-400">@{currentPost.username}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{new Date(currentPost.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              {privacyIcon}
              {currentPost.location && (
                <>
                  <span>•</span>
                  <span>{currentPost.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#090d15] border border-[#1b2438] rounded-xl shadow-xl py-1 z-30 animate-fade-in text-xs">
              {(isAuthor || canModerate) && (
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
              <button
                onClick={() => {
                  setShowMenu(false);
                  alert('Report received. Dark Falcon safety team will review this content.');
                }}
                className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <Flag className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Text with formatted tags */}
      <div className="text-sm text-slate-200 leading-relaxed mb-3 whitespace-pre-line">
        {currentPost.content.split(' ').map((word, i) => {
          if (word.startsWith('#')) {
            return (
              <span key={i} className="text-falcon-blue font-medium hover:underline cursor-pointer">
                {word}{' '}
              </span>
            );
          }
          if (word.startsWith('@')) {
            return (
              <span key={i} className="text-sky-400 font-medium hover:underline cursor-pointer">
                {word}{' '}
              </span>
            );
          }
          return word + ' ';
        })}
      </div>

      {/* Media Attachments */}
      {currentPost.mediaUrls && currentPost.mediaUrls.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-[#1b2438] mb-3 bg-black max-h-[480px] flex items-center justify-center">
          {currentPost.mediaType === 'video' || currentPost.mediaUrls[0].endsWith('.mp4') ? (
            <video
              src={currentPost.mediaUrls[0]}
              controls
              playsInline
              className="w-full max-h-[480px] object-contain"
            />
          ) : (
            <img
              src={currentPost.mediaUrls[0]}
              alt="Post attachment"
              className="w-full max-h-[480px] object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Interactions summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-2 mb-2 border-b border-[#1b2438]/80">
        <div className="flex items-center gap-1.5">
          {currentPost.reactions.length > 0 ? (
            <div className="flex items-center gap-1">
              <span className="flex -space-x-1">
                {Array.from(new Set(currentPost.reactions.map((r) => r.type)))
                  .slice(0, 3)
                  .map((t) => (
                    <span key={t} className="text-sm">
                      {REACTION_ICONS[t]?.emoji}
                    </span>
                  ))}
              </span>
              <span className="font-medium text-slate-300 ml-1">{currentPost.likesCount}</span>
            </div>
          ) : (
            <span>No reactions yet</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{currentPost.commentsCount} comments</span>
          <span>{currentPost.sharesCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-300 pt-1">
        {/* React Button with Picker */}
        <div
          className="relative"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {showReactions && <ReactionPicker onSelect={handleToggleReaction} />}
          <button
            onClick={() => handleToggleReaction(userReaction ? userReaction : 'like')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
              userReaction
                ? 'text-falcon-blue font-bold bg-falcon-blue/10'
                : 'hover:bg-[#121826] hover:text-white'
            }`}
          >
            {userReaction ? (
              <span className="text-base">{REACTION_ICONS[userReaction]?.emoji}</span>
            ) : (
              <Heart className="w-4 h-4" />
            )}
            <span>{userReaction ? REACTION_ICONS[userReaction]?.label : 'React'}</span>
          </button>
        </div>

        {/* Comments Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#121826] hover:text-white transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#121826] hover:text-white transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Bookmark / Save */}
        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
            isSaved ? 'text-amber-400 font-semibold' : 'hover:bg-[#121826] hover:text-white'
          }`}
          title="Save post"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Threaded Comments Section */}
      {showComments && <CommentSection postId={currentPost.id} />}
    </article>
  );
};

import React, { useState, useEffect } from 'react';
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
  Edit2,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Send,
  Link,
  Check,
} from 'lucide-react';
import { Post, ReactionType, Conversation } from '../../../shared/types';
import { REACTION_ICONS } from '../../../shared/constants';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ReactionPicker } from './ReactionPicker';
import { CommentSection } from './CommentSection';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (post: Post) => void;
  onOpenProfile?: (username: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostUpdated, onOpenProfile }) => {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Carousel state
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'scam' | 'other'>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [convoList, setConvoList] = useState<Conversation[]>([]);
  const [sendingToConvoId, setSendingToConvoId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const userReaction = user
    ? currentPost.reactions.find((r) => r.userId === user.id)?.type
    : undefined;

  const handleToggleReaction = async (type: ReactionType = 'like') => {
    setShowReactions(false);
    try {
      const res = await api.post<Post>(`/posts/${currentPost.id}/reactions`, { type });
      if (res.success && res.data) {
        setCurrentPost(res.data);
        onPostUpdated?.(res.data);
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

  const handleTogglePin = async () => {
    setShowMenu(false);
    try {
      const res = await api.post<Post>(`/posts/${currentPost.id}/pin`);
      if (res.success && res.data) {
        setCurrentPost(res.data);
        onPostUpdated?.(res.data);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to toggle pin');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await api.put<Post>(`/posts/${currentPost.id}`, { content: editContent });
      if (res.success && res.data) {
        setCurrentPost(res.data);
        onPostUpdated?.(res.data);
        setIsEditModalOpen(false);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update post');
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
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

  const handleSubmitReport = async () => {
    try {
      await api.post('/reports', {
        targetType: 'post',
        targetId: currentPost.id,
        targetSnippet: currentPost.content.slice(0, 100),
        reason: reportReason,
        details: reportDetails,
      });
      setIsReportModalOpen(false);
      alert('Report submitted. Dark Falcon safety team will review this content.');
    } catch (e: any) {
      alert(e.message || 'Failed to submit report');
    }
  };

  const handleOpenShareModal = async () => {
    setIsShareModalOpen(true);
    try {
      const res = await api.get<Conversation[]>('/conversations');
      if (res.success && res.data) {
        setConvoList(res.data);
      }
    } catch {}
  };

  const handleRepost = async () => {
    setReposting(true);
    try {
      const res = await api.post<Post>(`/posts/${currentPost.id}/repost`, {});
      if (res.success && res.data) {
        setIsShareModalOpen(false);
        alert('Post reposted to your sovereign profile!');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to repost');
    } finally {
      setReposting(false);
    }
  };

  const handleShareToDirect = async (convoId: string) => {
    setSendingToConvoId(convoId);
    try {
      await api.post(`/conversations/${convoId}/messages`, {
        content: `Check out this Dark Falcon post by @${currentPost.username}: ${currentPost.content.slice(0, 80)}...`,
        type: 'text',
      });
      alert('Post shared to conversation!');
      setIsShareModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Failed to share');
    } finally {
      setSendingToConvoId(null);
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/#post-${currentPost.id}`;
    navigator.clipboard.writeText(postUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const privacyIcon = {
    public: <Globe className="w-3 h-3 text-slate-400" aria-label="Public" />,
    followers: <Users className="w-3 h-3 text-slate-400" aria-label="Followers only" />,
    close_friends: <Users className="w-3 h-3 text-emerald-400" aria-label="Close friends" />,
    only_me: <Lock className="w-3 h-3 text-amber-400" aria-label="Only me" />,
  }[currentPost.privacy] || <Globe className="w-3 h-3 text-slate-400" />;

  const isAuthor = user && user.id === currentPost.userId;
  const canModerate = user && ['admin', 'super_admin', 'moderator'].includes(user.role);

  const mediaCount = currentPost.mediaUrls?.length || 0;

  return (
    <article className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-falcon-card transition-all duration-200 hover:border-falcon-blue/30 mb-4">
      {/* Repost Header if applicable */}
      {currentPost.repostOf && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 pb-2 border-b border-[#1b2438]/60">
          <Repeat className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-300">@{currentPost.username}</span>
          <span>reposted</span>
        </div>
      )}

      {/* Pinned Tag */}
      {currentPost.isPinned && (
        <div className="flex items-center gap-1 text-[11px] font-semibold text-falcon-blue mb-2.5">
          <Pin className="w-3 h-3" /> Pinned Post
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          onClick={() => onOpenProfile?.(currentPost.username)}
          className={`flex items-center gap-2.5 ${onOpenProfile ? 'cursor-pointer group' : ''}`}
        >
          <Avatar
            src={currentPost.userAvatar}
            alt={currentPost.userDisplayName}
            size="md"
            className="group-hover:ring-2 group-hover:ring-falcon-blue/50 transition-all"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-100 group-hover:text-falcon-blue transition-colors">
                {currentPost.userDisplayName}
              </span>
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
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#090d15] border border-[#1b2438] rounded-xl shadow-xl py-1 z-30 animate-fade-in text-xs">
              {(isAuthor || canModerate) && (
                <button
                  onClick={handleTogglePin}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Pin className="w-3.5 h-3.5 text-falcon-blue" />
                  {currentPost.isPinned ? 'Unpin Post' : 'Pin Post'}
                </button>
              )}

              {isAuthor && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setEditContent(currentPost.content);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit Post
                </button>
              )}

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
                  setIsReportModalOpen(true);
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
      {currentPost.content && (
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
      )}

      {/* Media Carousel / Single Viewer */}
      {mediaCount > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-[#1b2438] mb-3 bg-black max-h-[480px] flex items-center justify-center">
          {currentPost.mediaUrls[activeMediaIdx].endsWith('.mp4') ? (
            <video
              src={currentPost.mediaUrls[activeMediaIdx]}
              controls
              playsInline
              className="w-full max-h-[480px] object-contain"
            />
          ) : (
            <img
              src={currentPost.mediaUrls[activeMediaIdx]}
              alt={`Attachment ${activeMediaIdx + 1}`}
              className="w-full max-h-[480px] object-cover"
              loading="lazy"
            />
          )}

          {/* Carousel Arrows */}
          {mediaCount > 1 && (
            <>
              {activeMediaIdx > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMediaIdx((prev) => prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {activeMediaIdx < mediaCount - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveMediaIdx((prev) => prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Dots indicator */}
              <div className="absolute bottom-2 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full">
                {currentPost.mediaUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === activeMediaIdx ? 'w-3 bg-falcon-blue' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reposted Embedded Card */}
      {currentPost.repostOf && (
        <div className="rounded-xl border border-[#1b2438] bg-[#070a10] p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={currentPost.repostOf.userAvatar} alt={currentPost.repostOf.userDisplayName} size="sm" />
            <div>
              <p className="text-xs font-bold text-white">{currentPost.repostOf.userDisplayName}</p>
              <p className="text-[10px] text-slate-400">@{currentPost.repostOf.username}</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 line-clamp-3 mb-2">{currentPost.repostOf.content}</p>
          {currentPost.repostOf.mediaUrls?.length > 0 && (
            <div className="rounded-lg overflow-hidden max-h-48 border border-[#1b2438]">
              <img
                src={currentPost.repostOf.mediaUrls[0]}
                alt="Reposted media"
                className="w-full h-40 object-cover"
              />
            </div>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
              userReaction
                ? 'text-falcon-blue font-bold bg-falcon-blue/10 animate-like-pop'
                : 'hover:bg-[#121826] hover:text-white'
            }`}
          >
            {userReaction ? (
              <span className="text-base animate-like-pop">{REACTION_ICONS[userReaction]?.emoji}</span>
            ) : (
              <Heart className="w-4 h-4 transition-transform group-hover:scale-110" />
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
          onClick={handleOpenShareModal}
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
      {showComments && <CommentSection postId={currentPost.id} onOpenProfile={onOpenProfile} />}

      {/* Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Sovereign Post" maxWidth="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRepost}
              disabled={reposting}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Repeat className="w-4 h-4 text-emerald-400" />
              <span>{reposting ? 'Reposting...' : 'Repost to Feed'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] text-xs font-semibold text-slate-200 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-sky-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">Send in Sovereign Chat:</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar">
              {convoList.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2 text-center">No active chats found.</p>
              ) : (
                convoList.map((convo) => {
                  const other = convo.participantDetails?.find((p) => p.id !== user?.id);
                  const title = convo.type === 'group' ? convo.name : other?.displayName || other?.username || 'Falcon Pilot';
                  return (
                    <div
                      key={convo.id}
                      onClick={() => handleShareToDirect(convo.id)}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={other?.avatarUrl} alt={title} size="sm" />
                        <span className="text-xs font-medium text-slate-200">{title}</span>
                      </div>
                      <Button size="sm" variant="outline" disabled={sendingToConvoId === convo.id}>
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sovereign Post" maxWidth="sm">
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Report Content" maxWidth="sm">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Why are you reporting this post?</p>
          <div className="space-y-1.5">
            {(['spam', 'harassment', 'scam', 'other'] as const).map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer capitalize ${
                  reportReason === r ? 'border-falcon-blue bg-falcon-blue/10 text-white' : 'border-[#1b2438] text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="report_reason"
                  checked={reportReason === r}
                  onChange={() => setReportReason(r)}
                  className="hidden"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Additional details (optional)..."
            rows={2}
            className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitReport} className="bg-red-600 hover:bg-red-500">
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </article>
  );
};

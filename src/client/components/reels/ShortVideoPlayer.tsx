import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, Volume2, VolumeX, UserPlus, Check, X, Send } from 'lucide-react';
import { ShortVideo, Comment } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { api, getMediaUrl } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ShortVideoPlayerProps {
  videos: ShortVideo[];
}

export const ShortVideoPlayer: React.FC<ShortVideoPlayerProps> = ({ videos }) => {
  const { user } = useAuth();
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Comments drawer state
  const [activeCommentsVideo, setActiveCommentsVideo] = useState<ShortVideo | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Autoplay visible video
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (vid) {
        if (i === currentVideoIdx) {
          vid.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vid.pause();
        }
      }
    });
  }, [currentVideoIdx]);

  const togglePlay = (index: number) => {
    const vid = videoRefs.current[index];
    if (vid) {
      if (vid.paused) {
        vid.play();
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    }
  };

  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [isLikingMap, setIsLikingMap] = useState<Record<string, boolean>>({});

  const toggleLike = async (videoId: string) => {
    if (isLikingMap[videoId]) return;
    // Optimistic update
    const wasLiked = likedMap[videoId];
    setLikedMap((prev) => ({ ...prev, [videoId]: !wasLiked }));
    setIsLikingMap((prev) => ({ ...prev, [videoId]: true }));
    try {
      const res = await api.post<{ liked: boolean; likesCount: number }>(`/videos/${videoId}/like`);
      if (res.success) {
        setLikedMap((prev) => ({ ...prev, [videoId]: res.data.liked }));
        setLikesMap((prev) => ({ ...prev, [videoId]: res.data.likesCount }));
      }
    } catch (e) {
      // Roll back optimistic update on failure
      setLikedMap((prev) => ({ ...prev, [videoId]: wasLiked }));
      console.warn('Failed to toggle like', e);
    } finally {
      setIsLikingMap((prev) => ({ ...prev, [videoId]: false }));
    }
  };

  const handleToggleSave = async (video: ShortVideo) => {
    const next = !savedMap[video.id];
    setSavedMap((prev) => ({ ...prev, [video.id]: next }));
    try {
      await api.post('/saved/toggle', {
        itemId: video.id,
        itemType: 'video',
        title: video.caption,
      });
    } catch (e) {
      console.warn('Failed to toggle save for video', e);
    }
  };

  const handleFollowUser = async (creatorId: string) => {
    setFollowedMap((prev) => ({ ...prev, [creatorId]: true }));
    try {
      await api.post(`/users/${creatorId}/follow`);
    } catch (e) {
      console.warn('Failed to follow creator', e);
    }
  };

  const handleShare = (videoId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/reels#${videoId}`);
    setCopiedId(videoId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const openComments = async (video: ShortVideo) => {
    setActiveCommentsVideo(video);
    setComments([]);
    setIsLoadingComments(true);
    try {
      const res = await api.get<any[]>(`/videos/${video.id}/comments`);
      if (res.success) setComments(res.data);
    } catch (e) {
      console.warn('Failed to load comments', e);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user || !activeCommentsVideo) return;
    const text = newCommentText.trim();
    setNewCommentText('');
    setIsSubmittingComment(true);
    try {
      const res = await api.post<any>(`/videos/${activeCommentsVideo.id}/comments`, { content: text });
      if (res.success) {
        setComments((prev) => [res.data, ...prev]);
      }
    } catch (e) {
      console.warn('Failed to add comment', e);
      setNewCommentText(text); // restore on failure
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] max-w-md mx-auto overflow-y-scroll snap-y snap-mandatory no-scrollbar rounded-3xl bg-black border border-[#1b2438] shadow-2xl relative">
      {videos.map((video, idx) => {
        const isLiked = likedMap[video.id];
        const isSaved = savedMap[video.id];
        const isFollowed = followedMap[video.userId];
        const isCopied = copiedId === video.id;

        return (
          <div
            key={video.id}
            className="relative h-full w-full snap-start flex items-center justify-center bg-black overflow-hidden select-none"
            onMouseEnter={() => setCurrentVideoIdx(idx)}
          >
            {/* Background Video */}
            <video
              ref={(el) => (videoRefs.current[idx] = el)}
              src={getMediaUrl(video.videoUrl)}
              loop
              playsInline
              muted={isMuted}
              onClick={() => togglePlay(idx)}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Play/Pause icon indicator on pause */}
            {!isPlaying && currentVideoIdx === idx && (
              <div
                onClick={() => togglePlay(idx)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-auto cursor-pointer"
              >
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Volume toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Right Side Action Bar */}
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
              {/* Creator Avatar with Follow */}
              <div className="relative">
                <Avatar src={video.userAvatar} alt={video.username} size="md" className="ring-2 ring-falcon-blue" />
                {!isFollowed && (
                  <button
                    onClick={() => handleFollowUser(video.userId)}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-falcon-blue text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform"
                    title="Follow creator"
                  >
                    <UserPlus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Like */}
              <button
                onClick={() => toggleLike(video.id)}
                disabled={isLikingMap[video.id]}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-90 transition-transform disabled:opacity-70"
              >
                <div className={`p-2.5 rounded-full transition-colors ${isLiked ? 'bg-red-500/20 text-red-500 animate-like-pop' : 'bg-black/50 text-white'}`}>
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
                </div>
                <span className="text-[11px] font-bold">
                  {likesMap[video.id] ?? (video.likesCount + (isLiked ? 1 : 0))}
                </span>
              </button>

              {/* Comments */}
              <button
                onClick={() => openComments(video)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
              >
                <div className="p-2.5 rounded-full bg-black/50 text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold">{video.commentsCount + comments.length}</span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(video.id)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform relative"
                title="Copy share link"
              >
                <div className="p-2.5 rounded-full bg-black/50 text-white">
                  {isCopied ? <Check className="w-6 h-6 text-emerald-400" /> : <Share2 className="w-6 h-6" />}
                </div>
                <span className="text-[11px] font-bold">{isCopied ? 'Copied' : video.sharesCount}</span>
              </button>

              {/* Bookmark */}
              <button
                onClick={() => handleToggleSave(video)}
                className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                title={isSaved ? 'Remove from saved' : 'Save to bookmarks'}
              >
                <div className={`p-2.5 rounded-full ${isSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-black/50 text-white'}`}>
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-400' : ''}`} />
                </div>
              </button>
            </div>

            {/* Bottom Caption & Audio Bar */}
            <div className="absolute left-3 right-16 bottom-4 z-20 text-left pointer-events-auto">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold text-white leading-none">@{video.username}</span>
                <Badge isVerified={true} />
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 leading-snug mb-2">{video.caption}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-falcon-blue font-medium flex-wrap">
                {video.hashtags?.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Real Comments Drawer Modal */}
      {activeCommentsVideo && (
        <Modal
          isOpen={true}
          onClose={() => setActiveCommentsVideo(null)}
          title={`Comments (${comments.length})`}
        >
          <div className="flex flex-col h-80">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingComments ? (
                <div className="text-center py-10 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-falcon-blue" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No comments yet. Start the conversation! 💬
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <Avatar src={c.avatarUrl} alt={c.username} size="xs" />
                    <div className="flex-1 bg-[#0d131f] border border-[#1b2438] p-2.5 rounded-2xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-[11px]">@{c.username}</span>
                        <span className="text-[10px] text-slate-500">{c.createdAt}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-3 border-t border-[#1b2438] mt-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-[#090d15] border border-[#1b2438] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-falcon-blue"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2 bg-falcon-blue hover:bg-falcon-blue-dark disabled:opacity-50 text-white rounded-xl"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};


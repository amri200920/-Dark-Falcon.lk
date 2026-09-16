import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Volume2, VolumeX, Heart, Sparkles, Check } from 'lucide-react';
import { Story } from '../../../shared/types';
import { getFilterCss } from '../../../shared/constants';
import { Avatar } from '../common/Avatar';
import { api } from '../../services/api';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const STORY_REACTIONS = ['🔥', '❤️', '😂', '😮', '😢', '👏'];

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentStory = stories[currentIndex];

  // Mark viewed
  useEffect(() => {
    if (currentStory) {
      api.post(`/stories/${currentStory.id}/view`).catch(() => {});
    }
  }, [currentStory]);

  // 5-second story progress timer (pauses when held or sending)
  useEffect(() => {
    setProgress(0);
    if (isPaused || isSendingReply) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // ~5 seconds
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, isSendingReply]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      const res = await api.post(`/stories/${currentStory.id}/reply`, {
        text: replyText.trim(),
      });
      if (res.success) {
        setReplySuccess(true);
        setReplyText('');
        setTimeout(() => setReplySuccess(false), 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send story reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1500);
    try {
      await api.post(`/stories/${currentStory.id}/react`, { emoji });
    } catch {}
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-sm h-[82vh] max-h-[720px] bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5 pointer-events-none">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  idx === currentIndex ? 'story-progress-active' : 'bg-white/70'
                }`}
                style={{
                  width:
                    idx === currentIndex
                      ? `${progress}%`
                      : idx < currentIndex
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Avatar src={currentStory.userAvatar} alt={currentStory.username} size="sm" />
            <div>
              <p className="text-xs font-bold text-white leading-none">@{currentStory.username}</p>
              <span className="text-[10px] text-slate-400">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStory.mediaType === 'video' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Body */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {currentStory.mediaType === 'image' && (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
              style={{ filter: getFilterCss(currentStory.filter) }}
            />
          )}

          {currentStory.mediaType === 'video' && (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
              style={{ filter: getFilterCss(currentStory.filter) }}
            />
          )}

          {currentStory.mediaType === 'text' && (
            <div
              className="w-full h-full flex items-center justify-center p-6 text-center font-bold text-xl text-white shadow-inner"
              style={{ backgroundColor: currentStory.backgroundColor || '#00477a' }}
            >
              {currentStory.textContent}
            </div>
          )}

          {/* Stickers Overlay */}
          {currentStory.stickers &&
            currentStory.stickers.map((stk, idx) => (
              <span
                key={idx}
                className="absolute text-3xl select-none pointer-events-none drop-shadow-lg"
                style={{ top: `${stk.y}%`, left: `${stk.x}%` }}
              >
                {stk.content}
              </span>
            ))}

          {/* Floating Reaction Animation */}
          {floatingReaction && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce text-6xl">
              {floatingReaction}
            </div>
          )}

          {/* Navigation Click Hotspots */}
          <div
            className="absolute top-16 bottom-24 left-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="absolute top-16 bottom-24 right-0 w-2/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Bottom Reply Bar & Reactions */}
        <div className="p-3 bg-gradient-to-t from-black via-black/85 to-transparent z-30 space-y-2 pointer-events-auto">
          {/* Quick Emoji Reactions */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{currentStory.viewers?.length || 0} views</span>
            </div>

            <div className="flex items-center gap-2">
              {STORY_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendReaction(emoji);
                  }}
                  className="text-base hover:scale-130 active:scale-95 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Reply Form */}
          {replySuccess ? (
            <div className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Reply sent!</span>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${currentStory.username}...`}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-falcon-blue"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                className="p-2 rounded-full bg-falcon-blue hover:bg-falcon-blue-dark text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


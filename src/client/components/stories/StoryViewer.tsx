import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send } from 'lucide-react';
import { Story } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { api } from '../../services/api';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex];

  // Mark viewed
  useEffect(() => {
    if (currentStory) {
      api.post(`/stories/${currentStory.id}/view`).catch(() => {});
    }
  }, [currentStory]);

  // 5-second story progress timer
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2; // ~5 seconds (50 ticks * 100ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex]);

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

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    alert(`Reply sent to @${currentStory.username}!`);
    setReplyText('');
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm h-[80vh] max-h-[700px] bg-[#0c101a] border border-[#1b2438] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-falcon-blue transition-all duration-100"
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
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar src={currentStory.userAvatar} alt={currentStory.username} size="sm" />
            <div>
              <p className="text-xs font-bold text-white leading-none">@{currentStory.username}</p>
              <span className="text-[10px] text-slate-400">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/50 hover:bg-black text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Body */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {currentStory.mediaType === 'image' && (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {currentStory.mediaType === 'video' && (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
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

          {/* Navigation Click Hotspots */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-2/3 z-20 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {/* Bottom Reply Bar & Viewers */}
        <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-30 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Eye className="w-3.5 h-3.5" />
            <span>{currentStory.viewers?.length || 0} views</span>
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to @${currentStory.username}...`}
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-falcon-blue"
            />
            <button
              type="submit"
              className="p-2 rounded-full bg-falcon-blue hover:bg-falcon-blue-dark text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

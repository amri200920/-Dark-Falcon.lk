import React, { useState, useRef } from 'react';
import { Video, Sparkles, Hash, Music, Wand2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ShortVideo } from '../../../shared/types';
import { CINEMATIC_FILTERS, getFilterCss } from '../../../shared/constants';
import { api } from '../../services/api';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated: (reel: ShortVideo) => void;
}

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  isOpen,
  onClose,
  onReelCreated,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [audioTitle, setAudioTitle] = useState('Original Audio');
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleGenerateAICaption = async () => {
    setIsAILoading(true);
    try {
      const topic = caption.trim() || 'Dark Falcon sovereign reel video';
      const res = await api.post<string[]>('/ai/caption', { topic });
      if (res.success && res.data && res.data.length > 0) {
        setCaption(res.data[0]);
      }
    } catch (err: any) {
      alert(err.message || 'AI generation failed');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateAIHashtags = async () => {
    setIsAILoading(true);
    try {
      const topic = caption.trim() || 'Dark Falcon Reels';
      const res = await api.post<string[]>('/ai/hashtags', { topic });
      if (res.success && res.data) {
        setCaption((prev) => `${prev.trim()}\n\n${res.data.join(' ')}`);
      }
    } catch (err: any) {
      alert(err.message || 'AI generation failed');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsSubmitting(true);
    try {
      const uploadRes = await api.upload(videoFile);
      if (!uploadRes.success || !uploadRes.data?.url) {
        throw new Error('Video upload failed');
      }

      const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).map((t) => t.slice(1));

      const res = await api.post<ShortVideo>('/videos', {
        videoUrl: uploadRes.data.url,
        caption: caption.trim(),
        hashtags,
        filter: selectedFilter,
        audioTitle: audioTitle.trim() || 'Original Audio',
      });

      if (res.success && res.data) {
        onReelCreated(res.data);
        setVideoFile(null);
        setVideoPreview(null);
        setCaption('');
        setSelectedFilter('original');
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish Reel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Dark Falcon Reel" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Video Preview / Upload area */}
        <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#1b2438]">
          {videoPreview ? (
            <>
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-contain"
                style={{ filter: getFilterCss(selectedFilter) }}
              />
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 text-slate-400 hover:text-falcon-blue transition-colors"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#1b2438] flex items-center justify-center">
                <Video className="w-6 h-6 text-falcon-blue" />
              </div>
              <span className="text-xs font-semibold">Select Video File for Reel</span>
              <span className="text-[10px] text-slate-500">MP4, WebM or MOV up to 50MB</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="hidden"
        />

        {/* Cinematic Filters */}
        {videoPreview && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Wand2 className="w-3.5 h-3.5 text-falcon-blue" />
              <span>Cinematic Video Filter</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {CINEMATIC_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all border ${
                    selectedFilter === f.id
                      ? 'bg-falcon-blue text-white border-falcon-blue font-bold shadow-neon-blue'
                      : 'bg-[#090d15] text-slate-400 border-[#1b2438] hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio Track Info */}
        <div className="flex items-center gap-2 bg-[#090d15] border border-[#1b2438] rounded-xl px-3 py-2 text-xs">
          <Music className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={audioTitle}
            onChange={(e) => setAudioTitle(e.target.value)}
            placeholder="Audio / Sound Name (e.g. Original Audio)"
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Caption */}
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption... Type #hashtags and @mentions"
          className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue resize-none"
        />

        {/* AI Helper Tools */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={handleGenerateAICaption}
            disabled={isAILoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-falcon-blue/15 hover:bg-falcon-blue/25 text-falcon-blue border border-falcon-blue/30 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAILoading ? 'AI Thinking...' : 'AI Reel Caption'}
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

        <Button
          type="submit"
          variant="glow"
          className="w-full"
          isLoading={isSubmitting}
          disabled={!videoFile}
        >
          Publish Sovereign Reel
        </Button>
      </form>
    </Modal>
  );
};

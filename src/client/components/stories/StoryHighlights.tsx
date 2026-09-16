import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { StoryHighlight, Story } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StoryViewer } from './StoryViewer';
import { api } from '../../services/api';

interface StoryHighlightsProps {
  userId: string;
  isSelf: boolean;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ userId, isSelf }) => {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<StoryHighlight | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [availableStories, setAvailableStories] = useState<Story[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHighlights();
  }, [userId]);

  const loadHighlights = async () => {
    try {
      const res = await api.get<StoryHighlight[]>(`/users/${userId}/highlights`);
      if (res.success && res.data) {
        setHighlights(res.data);
      }
    } catch {}
  };

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    try {
      const res = await api.get<Story[]>('/stories');
      if (res.success && res.data) {
        // filter user stories
        const mine = res.data.filter((s) => s.userId === userId);
        setAvailableStories(mine);
        if (mine.length > 0) {
          setSelectedStoryIds([mine[0].id]);
        }
      }
    } catch {}
  };

  const toggleSelectStory = (id: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleCreateHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedStoryIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const firstStory = availableStories.find((s) => s.id === selectedStoryIds[0]);
      const coverUrl = firstStory?.mediaUrl || '/assets/brand/dark-falcon-logo.png';

      const res = await api.post<StoryHighlight>('/highlights', {
        title: title.trim(),
        coverUrl,
        storyIds: selectedStoryIds,
      });

      if (res.success && res.data) {
        setHighlights((prev) => [res.data, ...prev]);
        setIsCreateOpen(false);
        setTitle('');
        setSelectedStoryIds([]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHighlight = async (highlightId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this highlight?')) return;
    try {
      await api.delete(`/highlights/${highlightId}`);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="py-3 border-b border-[#1b2438]/70">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
        {/* New Highlight Button for profile owner */}
        {isSelf && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#1b2438] group-hover:border-falcon-blue flex items-center justify-center transition-colors bg-[#090d15]">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-falcon-blue transition-colors" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">New</span>
          </button>
        )}

        {/* Highlights List */}
        {highlights.map((hl) => (
          <div
            key={hl.id}
            onClick={() => setActiveHighlight(hl)}
            className="relative flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group cursor-pointer"
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 ring-2 ring-[#1b2438] group-hover:ring-falcon-blue transition-all flex items-center justify-center overflow-hidden bg-black">
              <Avatar src={hl.coverUrl} alt={hl.title} size="lg" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[64px]">
              {hl.title}
            </span>

            {isSelf && (
              <button
                type="button"
                onClick={(e) => handleDeleteHighlight(hl.id, e)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-black/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Viewer Modal */}
      {activeHighlight && activeHighlight.stories && activeHighlight.stories.length > 0 && (
        <StoryViewer
          stories={activeHighlight.stories}
          initialIndex={0}
          onClose={() => setActiveHighlight(null)}
        />
      )}

      {/* Create Highlight Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Story Highlight" maxWidth="sm">
        <form onSubmit={handleCreateHighlight} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Highlight Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Travels, Aviation, Coding..."
              className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Select Stories to Include</label>
            {availableStories.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-3 text-center">No active stories available to add.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {availableStories.map((story) => {
                  const isSelected = selectedStoryIds.includes(story.id);
                  return (
                    <div
                      key={story.id}
                      onClick={() => toggleSelectStory(story.id)}
                      className={`relative rounded-xl overflow-hidden border h-24 cursor-pointer transition-all ${
                        isSelected ? 'border-falcon-blue ring-2 ring-falcon-blue' : 'border-[#1b2438]'
                      }`}
                    >
                      {story.mediaType === 'image' ? (
                        <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                      ) : story.mediaType === 'video' ? (
                        <video src={story.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center p-2 text-center text-[10px] text-white"
                          style={{ backgroundColor: story.backgroundColor || '#0c101a' }}
                        >
                          {story.textContent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="glow"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!title.trim() || selectedStoryIds.length === 0}
          >
            Create Highlight
          </Button>
        </form>
      </Modal>
    </div>
  );
};

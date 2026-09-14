import React from 'react';
import { Plus } from 'lucide-react';
import { Story } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface StoryTrayProps {
  stories: Story[];
  onOpenStory: (storyIndex: number) => void;
  onAddStory: () => void;
}

export const StoryTray: React.FC<StoryTrayProps> = ({
  stories,
  onOpenStory,
  onAddStory,
}) => {
  const { user } = useAuth();

  // Group stories by user so multiple stories per user show under one circle
  const userStoriesMap = new Map<string, Story[]>();
  stories.forEach((s) => {
    if (!userStoriesMap.has(s.userId)) {
      userStoriesMap.set(s.userId, []);
    }
    userStoriesMap.get(s.userId)!.push(s);
  });

  const uniqueUserStories = Array.from(userStoriesMap.values());

  return (
    <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-3 shadow-sm mb-4">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {/* Add Story Button for Current User */}
        {user && (
          <button
            onClick={onAddStory}
            className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group"
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-falcon-blue/60 group-hover:border-falcon-blue transition-colors flex items-center justify-center">
              <Avatar src={user.avatarUrl} alt="Add Story" size="lg" />
              <div className="absolute bottom-0 right-0 p-1 bg-falcon-blue text-white rounded-full ring-2 ring-[#0c101a] shadow-sm">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-[64px]">Your Story</span>
          </button>
        )}

        {/* Stories list */}
        {uniqueUserStories.map((storyGroup, idx) => {
          const firstStory = storyGroup[0];
          return (
            <button
              key={firstStory.userId}
              onClick={() => onOpenStory(idx)}
              className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group"
            >
              <div className="relative w-14 h-14 rounded-full p-0.5 ring-2 ring-falcon-blue shadow-neon-blue group-hover:scale-105 transition-transform flex items-center justify-center">
                <Avatar src={firstStory.userAvatar} alt={firstStory.username} size="lg" />
              </div>
              <span className="text-[11px] text-slate-300 truncate max-w-[64px]">
                {firstStory.username}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Home, Compass, PlusSquare, Film, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  unreadMessagesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  unreadMessagesCount = 0,
}) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#06080d]/90 backdrop-blur-md border-t border-[#1b2438] py-2 px-3 flex items-center justify-around select-none">
      <button
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center gap-1 ${
          currentTab === 'home' ? 'text-falcon-blue' : 'text-slate-400'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => onSelectTab('explore')}
        className={`flex flex-col items-center gap-1 ${
          currentTab === 'explore' ? 'text-falcon-blue' : 'text-slate-400'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Explore</span>
      </button>

      <button
        onClick={onOpenCreate}
        className="flex flex-col items-center justify-center -mt-4 bg-falcon-blue text-white w-11 h-11 rounded-full shadow-neon-blue border border-cyan-300 active:scale-95 transition-transform"
      >
        <PlusSquare className="w-6 h-6" />
      </button>

      <button
        onClick={() => onSelectTab('reels')}
        className={`flex flex-col items-center gap-1 ${
          currentTab === 'reels' ? 'text-falcon-blue' : 'text-slate-400'
        }`}
      >
        <Film className="w-5 h-5" />
        <span className="text-[10px]">Reels</span>
      </button>

      <button
        onClick={() => onSelectTab('messages')}
        className={`relative flex flex-col items-center gap-1 ${
          currentTab === 'messages' ? 'text-falcon-blue' : 'text-slate-400'
        }`}
      >
        <MessageSquare className="w-5 h-5" />
        {unreadMessagesCount > 0 && (
          <span className="absolute -top-1 right-2 px-1 bg-falcon-blue text-[9px] font-bold text-white rounded-full">
            {unreadMessagesCount}
          </span>
        )}
        <span className="text-[10px]">Chat</span>
      </button>
    </nav>
  );
};

import React, { useState } from 'react';
import { Home, Compass, PlusSquare, Film, MessageSquare, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MobileMenuModal } from './MobileMenuModal';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#06080d]/95 backdrop-blur-md border-t border-[#1b2438] py-2 px-2 flex items-center justify-around select-none">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 transition-transform ${
            currentTab === 'home' ? 'text-falcon-blue scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 transition-all ${currentTab === 'home' ? 'nav-icon-active' : ''}`} />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('explore')}
          className={`flex flex-col items-center gap-1 transition-transform ${
            currentTab === 'explore' ? 'text-falcon-blue scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className={`w-5 h-5 transition-all ${currentTab === 'explore' ? 'nav-icon-active' : ''}`} />
          <span className="text-[10px]">Explore</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="flex flex-col items-center justify-center -mt-4 bg-falcon-blue text-white w-11 h-11 rounded-full shadow-neon-blue border border-cyan-300 active:scale-95 transition-transform"
          title="Create"
        >
          <PlusSquare className="w-6 h-6" />
        </button>

        <button
          onClick={() => onSelectTab('messages')}
          className={`relative flex flex-col items-center gap-1 transition-transform ${
            currentTab === 'messages' ? 'text-falcon-blue scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className={`w-5 h-5 transition-all ${currentTab === 'messages' ? 'nav-icon-active' : ''}`} />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 right-2 px-1 bg-falcon-blue text-[9px] font-bold text-white rounded-full">
              {unreadMessagesCount}
            </span>
          )}
          <span className="text-[10px]">Chat</span>
        </button>

        <button
          onClick={() => setIsMenuOpen(true)}
          className={`relative flex flex-col items-center gap-1 transition-transform ${
            isMenuOpen ? 'text-falcon-blue scale-105' : 'text-slate-400 hover:text-white'
          }`}
          title="More Features"
        >
          <Menu className={`w-5 h-5 transition-all ${isMenuOpen ? 'nav-icon-active' : ''}`} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 right-1.5 w-2 h-2 bg-falcon-blue rounded-full" />
          )}
          <span className="text-[10px]">Hub 🦅</span>
        </button>
      </nav>

      {/* Full-Screen Sovereign Mobile Menu / Feature Drawer */}
      <MobileMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        unreadNotificationsCount={unreadNotificationsCount}
      />
    </>
  );
};

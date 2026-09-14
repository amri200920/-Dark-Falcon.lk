import React, { useState } from 'react';
import { Search, PlusCircle, Bell, MessageSquare, Menu, Tv } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onSearch: (q: string) => void;
  onOpenCreate: () => void;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenCreate,
  onSelectTab,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onSelectTab('explore');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#06080d]/80 backdrop-blur-md border-b border-[#1b2438] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Mobile Brand Logo */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => onSelectTab('home')} className="focus:outline-none">
            <BrandLogo variant="compact" />
          </button>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, hashtags, communities..."
            className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl py-1.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue focus:ring-1 focus:ring-falcon-blue/40"
          />
        </form>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5 ml-auto">
          <Button
            variant="glow"
            size="sm"
            onClick={onOpenCreate}
            icon={<PlusCircle className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            Create
          </Button>

          <button
            onClick={() => onSelectTab('tv')}
            className="p-2 rounded-xl text-purple-400 hover:text-white hover:bg-purple-500/20 transition-colors"
            title="Switch to 10-Foot TV Remote Experience"
          >
            <Tv className="w-5 h-5" />
          </button>

          <button
            onClick={() => onSelectTab('notifications')}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#121826] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-falcon-blue rounded-full ring-2 ring-[#06080d]" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('messages')}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#121826] transition-colors md:hidden"
            title="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-falcon-blue rounded-full ring-2 ring-[#06080d]" />
            )}
          </button>

          {user && (
            <button
              onClick={() => onSelectTab('profile')}
              className="md:hidden focus:outline-none ml-1"
            >
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline={user.isOnline} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

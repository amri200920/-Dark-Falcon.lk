import React, { useState } from 'react';
import {
  Home,
  Compass,
  Film,
  MessageSquare,
  Phone,
  Video,
  Users,
  Radio,
  Bell,
  Bookmark,
  Sparkles,
  User as UserIcon,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Crown,
  Lock,
  Tv,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BrandLogo } from '../common/BrandLogo';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const { user, logout, lockApp } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const isAdmin = user && ['admin', 'super_admin'].includes(user.role);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'explore', label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { id: 'reels', label: 'Reels', icon: <Film className="w-5 h-5" /> },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadMessagesCount,
    },
    { id: 'calls', label: 'Calls', icon: <Phone className="w-5 h-5" /> },
    { id: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
    { id: 'communities', label: 'Communities', icon: <Users className="w-5 h-5" /> },
    { id: 'channels', label: 'Channels', icon: <Radio className="w-5 h-5" /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount,
    },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="w-5 h-5" /> },
    {
      id: 'ai',
      label: 'Dark Falcon AI 🦅',
      icon: <Sparkles className="w-5 h-5 text-falcon-blue animate-pulse-subtle" />,
      highlight: true,
    },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'tv', label: 'TV Experience', icon: <Tv className="w-5 h-5 text-purple-400" /> },
    {
      id: 'membership',
      label: 'Membership 👑🦅',
      icon: <Crown className="w-5 h-5 text-amber-400" />,
      highlight: true,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'help', label: 'Help & Safety', icon: <HelpCircle className="w-5 h-5 text-slate-400" /> },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Console',
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      highlight: true,
    });
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-[#1b2438] bg-[#070a10] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1b2438] flex items-center justify-between">
        {!collapsed ? (
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <BrandLogo variant="compact" glow />
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('home')}
            className="mx-auto focus:outline-none"
          >
            <BrandLogo variant="emblem" glow />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-falcon-blue/15 text-falcon-blue border border-falcon-blue/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#121826]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-falcon-blue text-[10px] font-bold text-white rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </div>
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Controls & User Profile Footer */}
      <div className="p-3 border-t border-[#1b2438] space-y-2">
        {/* Lock App & Theme toggles */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between px-2'}`}>
          {user?.appLockPinHash && (
            <button
              onClick={lockApp}
              className="p-1.5 rounded-lg text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
              title="Lock Application Now"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121826] transition-colors"
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-[#121826] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Card */}
        {user && (
          <button
            onClick={() => onSelectTab('profile')}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#121826] transition-colors text-left ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" isOnline={user.isOnline} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{user.displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

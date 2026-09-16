import React from 'react';
import {
  X,
  Phone,
  Video,
  Users,
  Radio,
  Bookmark,
  Sparkles,
  User as UserIcon,
  Tv,
  Crown,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  Compass,
  Film,
  Home,
  MessageSquare
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../contexts/AuthContext';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount?: number;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  unreadNotificationsCount = 0,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  if (!isOpen) return null;

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  const menuSections = [
    {
      title: 'Communication & Calling',
      items: [
        { id: 'calls', label: 'Audio & Video Calls', icon: <Phone className="w-5 h-5 text-emerald-400" /> },
        { id: 'meetings', label: 'Meetings & Rooms', icon: <Video className="w-5 h-5 text-blue-400" /> },
        { id: 'communities', label: 'Communities & Groups', icon: <Users className="w-5 h-5 text-indigo-400" /> },
        { id: 'channels', label: 'Broadcast Channels', icon: <Radio className="w-5 h-5 text-amber-400" /> },
      ],
    },
    {
      title: 'AI & Intelligence',
      items: [
        {
          id: 'ai',
          label: 'Dark Falcon AI Assistant 🦅',
          icon: <Sparkles className="w-5 h-5 text-falcon-blue animate-pulse-subtle" />,
          highlight: true,
        },
      ],
    },
    {
      title: 'Premium & Media',
      items: [
        {
          id: 'membership',
          label: 'Membership & Verification 👑',
          icon: <Crown className="w-5 h-5 text-amber-400" />,
          highlight: true,
        },
        { id: 'tv', label: '10-Foot TV Experience', icon: <Tv className="w-5 h-5 text-purple-400" /> },
        { id: 'saved', label: 'Saved Posts & Bookmarks', icon: <Bookmark className="w-5 h-5 text-cyan-400" /> },
      ],
    },
    {
      title: 'Account & Settings',
      items: [
        { id: 'profile', label: 'My Sovereign Profile', icon: <UserIcon className="w-5 h-5 text-slate-300" /> },
        {
          id: 'notifications',
          label: 'Activity & Notifications',
          icon: <Bell className="w-5 h-5 text-slate-300" />,
          badge: unreadNotificationsCount,
        },
        { id: 'settings', label: 'Security & App Lock', icon: <Settings className="w-5 h-5 text-slate-300" /> },
        { id: 'help', label: 'Help Center & Safety', icon: <HelpCircle className="w-5 h-5 text-slate-400" /> },
      ],
    },
  ];

  if (isAdmin) {
    menuSections.push({
      title: 'Administration',
      items: [
        {
          id: 'admin',
          label: 'Admin Sovereign Console',
          icon: <Shield className="w-5 h-5 text-amber-400" />,
          highlight: true,
        },
      ],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fade-in select-none md:hidden">
      <div className="w-full bg-[#0c101a] border-t border-[#1b2438] rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Hub Header */}
        <div className="p-4 border-b border-[#1b2438] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo variant="compact" />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Dark Falcon Hub <span className="text-falcon-blue text-xs">🦅</span>
              </h2>
              <p className="text-[10px] text-slate-400">All Sovereign Features & Modes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#121826] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hub Body with Scrollable Categories */}
        <div className="overflow-y-auto p-4 space-y-4 no-scrollbar">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                {section.title}
              </span>
              <div className="grid grid-cols-1 gap-1">
                {section.items.map((item: any) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-xs font-medium ${
                        isActive
                          ? 'bg-falcon-blue/20 text-falcon-blue border border-falcon-blue/40 font-bold'
                          : item.highlight
                          ? 'bg-[#121826] hover:bg-[#1a2337] text-white border border-[#232f48]'
                          : 'bg-[#090d15] hover:bg-[#121826] text-slate-200 border border-[#172032]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-falcon-blue text-white rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

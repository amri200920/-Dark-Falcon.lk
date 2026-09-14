import React, { useState } from 'react';
import { Search, Plus, Lock, Users, Pin } from 'lucide-react';
import { Conversation, User } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelectConversation: (convo: Conversation) => void;
  onNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  onNewChat,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    if (c.type === 'group') {
      return (c.name || '').toLowerCase().includes(search.toLowerCase());
    }
    const otherUser = c.participantDetails?.find((p) => p.id !== user?.id);
    return (
      (otherUser?.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (otherUser?.username || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="w-full md:w-80 h-full flex flex-col border-r border-[#1b2438] bg-[#070a10]">
      {/* Header */}
      <div className="p-3.5 border-b border-[#1b2438] flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Direct Messages</h2>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-xl bg-falcon-blue hover:bg-falcon-blue-dark text-white transition-colors"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-2.5 border-b border-[#1b2438]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1b2438]/50">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No conversations found. Click + to start one.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = selectedId === c.id;
            const otherUser = c.participantDetails?.find((p) => p.id !== user?.id);
            const title = c.type === 'group' ? c.name : otherUser?.displayName || otherUser?.username || 'Falcon User';
            const avatar = c.type === 'group' ? c.avatarUrl : otherUser?.avatarUrl;

            return (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  isSelected ? 'bg-falcon-blue/15 border-l-2 border-falcon-blue' : 'hover:bg-[#0c101a]'
                }`}
              >
                <div className="relative">
                  <Avatar
                    src={avatar}
                    alt={title}
                    size="md"
                    isOnline={c.type === 'direct' ? otherUser?.isOnline : undefined}
                  />
                  {c.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#06080d] text-slate-400">
                      <Users className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-slate-100 truncate">{title}</span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {c.isLocked ? '🔒 Chat Protected' : c.lastMessage ? c.lastMessage.content : 'Started conversation'}
                  </p>
                </div>

                {/* Badges / Indicators */}
                <div className="flex flex-col items-end gap-1">
                  {c.isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                  {c.isPinned && <Pin className="w-3 h-3 text-falcon-blue" />}
                  {c.unreadCount && c.unreadCount > 0 ? (
                    <span className="px-1.5 py-0.2 bg-falcon-blue text-[10px] font-bold text-white rounded-full">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

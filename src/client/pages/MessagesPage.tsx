import React, { useState, useEffect } from 'react';
import { Conversation, User } from '../../shared/types';
import { api } from '../services/api';
import { ChatList } from '../components/messages/ChatList';
import { ChatWindow } from '../components/messages/ChatWindow';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MessagesPageProps {
  onOpenProfile?: (username: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onOpenProfile }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [availablePilots, setAvailablePilots] = useState<User[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get<Conversation[]>('/conversations');
      if (res.success) {
        setConversations(res.data);
        if (res.data.length > 0 && !selectedConvo) {
          setSelectedConvo(res.data[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load conversations', e);
    }
  };

  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    try {
      const res = await api.get<any>('/search?q=a'); // get list of pilots
      if (res.success && res.data?.users) {
        setAvailablePilots(res.data.users.filter((u: User) => u.id !== user?.id));
      }
    } catch (e) {
      console.warn('Error loading pilots', e);
    }
  };

  const handleStartDirectChat = async (targetUser: User) => {
    try {
      const res = await api.post<Conversation>('/conversations', {
        type: 'direct',
        participantIds: [targetUser.id],
      });
      if (res.success && res.data) {
        setConversations((prev) => {
          if (!prev.some((c) => c.id === res.data.id)) return [res.data, ...prev];
          return prev;
        });
        setSelectedConvo(res.data);
        setIsNewChatOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Could not start chat');
    }
  };

  return (
    <div className="h-full max-w-6xl mx-auto rounded-none md:rounded-3xl overflow-hidden border-0 md:border border-[#1b2438] bg-[#0c101a] flex shadow-2xl">
      {/* Sidebar Chat List */}
      <div className={`${selectedConvo ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full`}>
        <ChatList
          conversations={conversations}
          selectedId={selectedConvo?.id || null}
          onSelectConversation={(convo) => setSelectedConvo(convo)}
          onNewChat={handleOpenNewChat}
        />
      </div>

      {/* Main Conversation Window */}
      <div className={`${!selectedConvo ? 'hidden md:flex' : 'flex'} flex-1 h-full`}>
        {selectedConvo ? (
          <ChatWindow
            conversation={selectedConvo}
            onBack={() => setSelectedConvo(null)}
            onOpenProfile={onOpenProfile}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Your Sovereign Inbox</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select an active conversation or start a new encrypted channel.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} title="Start New Sovereign Chat" maxWidth="sm">
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Choose a pilot to start a private conversation:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {availablePilots.map((pilot) => (
              <div
                key={pilot.id}
                onClick={() => handleStartDirectChat(pilot)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar src={pilot.avatarUrl} alt={pilot.displayName} size="sm" isOnline={pilot.isOnline} />
                  <div>
                    <p className="text-xs font-bold text-white">{pilot.displayName}</p>
                    <p className="text-[10px] text-slate-400">@{pilot.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Chat
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

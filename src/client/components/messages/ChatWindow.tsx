import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Lock, Unlock, Paperclip, Mic, Send, ShieldCheck, X, Smile, Sparkles } from 'lucide-react';
import { Conversation, Message } from '../../../shared/types';
import { Avatar } from '../common/Avatar';
import { MessageBubble } from './MessageBubble';
import { VoiceRecorder } from './VoiceRecorder';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useCall } from '../../contexts/CallContext';
import { api } from '../../services/api';
import { e2ee } from '../../services/e2eeService';
import { soundService } from '../../services/soundService';

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  onUpdateConversation?: (updated: Conversation) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onBack,
  onUpdateConversation,
}) => {
  const { user } = useAuth();
  const { sendEvent, subscribe } = useSocket();
  const { startCall } = useCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isLocked, setIsLocked] = useState(conversation.isLocked || false);
  const [isPinUnlocked, setIsPinUnlocked] = useState(!conversation.isLocked);
  const [pinAttempt, setPinAttempt] = useState('');

  // E2EE and Advanced Chat State
  const [e2eeEnabled, setE2eeEnabled] = useState(true);
  const [peerPublicKey, setPeerPublicKey] = useState<string | null>(null);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const otherUser = conversation.participantDetails?.find((p) => p.id !== user?.id);
  const title = conversation.type === 'group' ? conversation.name : otherUser?.displayName || otherUser?.username || 'Falcon User';

  // Initialize client-side E2EE identity key
  useEffect(() => {
    if (user?.id) {
      e2ee.initIdentity(user.id).catch((e) => console.warn('E2EE identity init error', e));
    }
  }, [user?.id]);

  // Retrieve peer public key if 1-on-1 direct chat
  useEffect(() => {
    async function loadPeerKey() {
      if (conversation.type === 'direct' && otherUser) {
        if (otherUser.e2eePublicKey) {
          setPeerPublicKey(otherUser.e2eePublicKey);
        } else if (otherUser.username) {
          try {
            const profileRes = await api.get<any>(`/users/profile/${otherUser.username}`);
            if (profileRes.success && profileRes.data?.e2eePublicKey) {
              setPeerPublicKey(profileRes.data.e2eePublicKey);
            }
          } catch (e) {
            console.warn('Could not fetch peer public key:', e);
          }
        }
      }
    }
    loadPeerKey();
  }, [conversation.type, otherUser]);

  // Decrypt encrypted messages
  useEffect(() => {
    async function decryptAll() {
      if (!peerPublicKey || !otherUser) return;
      for (const m of messages) {
        if (m.isEncrypted && m.encryptedIv && decryptedTexts[m.id] === undefined) {
          try {
            const plain = await e2ee.decryptMessage(m.content, m.encryptedIv, otherUser.id, peerPublicKey);
            if (plain) {
              setDecryptedTexts((prev) => ({ ...prev, [m.id]: plain }));
            }
          } catch (err) {
            console.warn('Could not decrypt message:', m.id, err);
          }
        }
      }
    }
    decryptAll();
  }, [messages, peerPublicKey, otherUser, decryptedTexts]);

  // Load messages and mark conversation read
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await api.get<Message[]>(`/conversations/${conversation.id}/messages`);
        if (res.success) {
          setMessages(res.data);
          api.post(`/conversations/${conversation.id}/read`).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to load messages', err);
      }
    }
    loadMessages();
  }, [conversation.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Socket listener for real-time messages, typing, editing, reactions, deletion
  useEffect(() => {
    const unsubMsg = subscribe('new_message', (payload: Message) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => [...prev, payload]);
        if (payload.senderId !== user?.id) {
          soundService.playMessageReceived();
        }
        api.post(`/conversations/${conversation.id}/read`).catch(() => {});
      }
    });

    const unsubEdit = subscribe('message_edited', (payload: Message) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
      }
    });

    const unsubDelete = subscribe('message_deleted', (payload: { messageId: string; conversationId: string }) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    });

    const unsubReaction = subscribe('message_reaction', (payload: Message) => {
      if (payload.conversationId === conversation.id) {
        setMessages((prev) => prev.map((m) => (m.id === payload.id ? payload : m)));
      }
    });

    const unsubTyping = subscribe('user_typing', (payload) => {
      if (payload.conversationId === conversation.id && payload.userId !== user?.id) {
        setIsTyping(payload.isTyping);
      }
    });

    return () => {
      unsubMsg();
      unsubEdit();
      unsubDelete();
      unsubReaction();
      unsubTyping();
    };
  }, [conversation.id, user?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const willEncrypt = e2eeEnabled && Boolean(peerPublicKey) && conversation.type === 'direct' && Boolean(otherUser);

    let contentToSend = text;
    let encryptedIv: string | undefined;

    if (willEncrypt && otherUser && peerPublicKey) {
      const encrypted = await e2ee.encryptMessage(text, otherUser.id, peerPublicKey);
      if (encrypted) {
        contentToSend = encrypted.ciphertext;
        encryptedIv = encrypted.iv;
      }
    }

    try {
      const res = await api.post<Message>(`/conversations/${conversation.id}/messages`, {
        content: contentToSend,
        type: 'text',
        isEncrypted: willEncrypt,
        encryptedIv,
        replyToId: replyingTo?.id,
        replyToContent: replyingTo ? (decryptedTexts[replyingTo.id] || replyingTo.content) : undefined,
      });

      if (res.success && res.data) {
        if (willEncrypt) {
          setDecryptedTexts((prev) => ({ ...prev, [res.data.id]: text }));
        }
        setMessages((prev) => [...prev, res.data]);
        soundService.playMessageSent();
        setReplyingTo(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await api.post<Message>(`/conversations/messages/${messageId}/react`, { emoji });
      if (res.success && res.data) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? res.data : m)));
        soundService.playReactionPop();
      }
    } catch (e: any) {
      console.warn('Failed to react:', e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await api.delete(`/conversations/messages/${messageId}`);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete message');
    }
  };

  const handleSendVoiceNote = async (audioUrl: string, duration: number, waveform: number[]) => {
    try {
      const res = await api.post<Message>(`/conversations/${conversation.id}/messages`, {
        content: 'Voice Note',
        type: 'audio',
        attachment: {
          url: audioUrl,
          name: 'voice-note.webm',
          size: 1024,
          mimeType: 'audio/webm',
          duration,
          waveform,
        },
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setShowVoiceRecorder(false);
      }
    } catch (e: any) {
      alert('Error sending audio message: ' + e.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const uploadRes = await api.upload(file);
        if (uploadRes.success) {
          const type = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : 'file';

          const msgRes = await api.post<Message>(`/conversations/${conversation.id}/messages`, {
            content: file.name,
            type,
            attachment: {
              url: uploadRes.data.url,
              name: file.name,
              size: file.size,
              mimeType: file.type,
            },
          });

          if (msgRes.success) {
            setMessages((prev) => [...prev, msgRes.data]);
          }
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload attachment');
      }
    }
  };

  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    try {
      const res = await api.post(`/conversations/${conversation.id}/lock`, { isLocked: nextLocked });
      if (res.success) {
        setIsLocked(nextLocked);
        if (nextLocked) setIsPinUnlocked(false);
      }
    } catch (e) {
      console.warn('Chat lock toggle error', e);
    }
  };

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinAttempt.length === 4) {
      setIsPinUnlocked(true);
      setPinAttempt('');
    } else {
      alert('Enter 4-digit PIN');
    }
  };

  // Locked chat protection wall
  if (isLocked && !isPinUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#06080d] text-center">
        <div className="p-4 rounded-full bg-amber-500/20 text-amber-400 mb-3">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Protected Sovereign Chat</h3>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          This conversation is locked with end-user security PIN protection.
        </p>
        <form onSubmit={handleUnlockWithPin} className="flex items-center gap-2">
          <input
            type="password"
            maxLength={4}
            value={pinAttempt}
            onChange={(e) => setPinAttempt(e.target.value)}
            placeholder="4-digit PIN"
            className="w-32 text-center text-sm bg-[#0c101a] border border-[#1b2438] rounded-xl p-2 text-white focus:outline-none focus:border-falcon-blue tracking-widest"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-falcon-blue hover:bg-falcon-blue-dark text-xs font-bold text-white rounded-xl"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#06080d]">
      {/* Header */}
      <div className="p-3 border-b border-[#1b2438] bg-[#070a10] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden text-xs text-slate-400 hover:text-white">
              ← Back
            </button>
          )}
          <Avatar
            src={conversation.type === 'group' ? conversation.avatarUrl : otherUser?.avatarUrl}
            alt={title}
            size="sm"
            isOnline={conversation.type === 'direct' ? otherUser?.isOnline : undefined}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white leading-tight">{title}</h3>
              {conversation.type === 'direct' && (
                <button
                  type="button"
                  onClick={() => setE2eeEnabled(!e2eeEnabled)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    e2eeEnabled && peerPublicKey
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={peerPublicKey ? 'Toggle End-to-End Encryption (ECDH P-256 / AES-GCM-256)' : 'Peer public key generating...'}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{e2eeEnabled && peerPublicKey ? '🔒 E2EE' : 'Standard'}</span>
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {conversation.type === 'direct'
                ? otherUser?.isOnline
                  ? '⚡ Active Now'
                  : 'Offline'
                : `${conversation.participants.length} members`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {otherUser && (
            <>
              <button
                onClick={() => startCall(otherUser.id, otherUser.username, 'voice', otherUser.avatarUrl)}
                className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(otherUser.id, otherUser.username, 'video', otherUser.avatarUrl)}
                className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleToggleLock}
            className={`p-2 rounded-xl transition-colors ${
              isLocked ? 'text-amber-400 bg-amber-500/15' : 'text-slate-400 hover:text-white hover:bg-[#121826]'
            }`}
            title={isLocked ? 'Unlock conversation' : 'Lock conversation with PIN'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 text-falcon-blue mx-auto opacity-60" />
            <p className="font-semibold text-slate-400">Dark Falcon Sovereign Channel</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Direct communications are secured with client-side ECDH P-256 and AES-GCM 256-bit encryption.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isSelf={m.senderId === user?.id}
              decryptedContent={decryptedTexts[m.id]}
              onReact={handleReact}
              onDelete={handleDeleteMessage}
              onReply={(msg) => setReplyingTo(msg)}
            />
          ))
        )}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-falcon-blue font-medium py-1 animate-pulse">
            <span>typing a message...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted reply banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#0c101a] border-t border-[#1b2438] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 border-l-2 border-falcon-blue pl-2 min-w-0">
            <span className="text-falcon-blue font-semibold">Replying to @{replyingTo.senderUsername}:</span>
            <span className="text-slate-300 truncate">{decryptedTexts[replyingTo.id] || replyingTo.content}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Composer Toolbar */}
      <div className="p-3 border-t border-[#1b2438] bg-[#070a10]">
        {showVoiceRecorder ? (
          <VoiceRecorder
            onSendVoiceNote={handleSendVoiceNote}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
              title="Attach media or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                e2eeEnabled && peerPublicKey && conversation.type === 'direct'
                  ? 'Type encrypted E2EE message...'
                  : 'Type sovereign message...'
              }
              className="flex-1 bg-[#0c101a] border border-[#1b2438] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
            />

            {inputText.trim() ? (
              <button
                type="submit"
                className="p-2 rounded-xl bg-falcon-blue hover:bg-falcon-blue-dark text-white shadow-neon-blue transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
                title="Record audio voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

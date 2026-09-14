import React, { useState, useRef } from 'react';
import { Check, CheckCheck, Play, Pause, FileText, Download, Lock, Reply, Trash2, Smile } from 'lucide-react';
import { Message } from '../../../shared/types';
import { Avatar } from '../common/Avatar';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  decryptedContent?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
}

const QUICK_EMOJIS = ['🦅', '⚡', '❤️', '🔥', '👍'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  decryptedContent,
  onReact,
  onDelete,
  onReply,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const statusTicks = {
    sending: <span className="text-[9px] text-slate-500">•••</span>,
    sent: <Check className="w-3 h-3 text-slate-400" />,
    delivered: <CheckCheck className="w-3 h-3 text-slate-400" />,
    read: <CheckCheck className="w-3 h-3 text-falcon-blue" />,
  }[message.status] || <Check className="w-3 h-3 text-slate-400" />;

  const displayContent = message.isEncrypted
    ? decryptedContent !== undefined
      ? decryptedContent
      : '🔒 Encrypted message (deriving key...)'
    : message.content;

  return (
    <div className={`group relative flex items-end gap-2 mb-3 select-none ${isSelf ? 'justify-end' : 'justify-start'}`}>
      {!isSelf && <Avatar src={message.senderAvatar} alt={message.senderUsername} size="xs" />}

      {/* Floating Action Menu (Hover) */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute top-0 z-20 ${
          isSelf ? 'right-[calc(100%+0.5rem)]' : 'left-[calc(100%+0.5rem)]'
        }`}
      >
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 rounded-full bg-[#121826] border border-[#1b2438] text-slate-400 hover:text-white"
          title="React"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-full bg-[#121826] border border-[#1b2438] text-slate-400 hover:text-white"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        )}
        {isSelf && onDelete && (
          <button
            onClick={() => onDelete(message.id)}
            className="p-1 rounded-full bg-[#121826] border border-[#1b2438] text-slate-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Emoji Quick Picker Popup */}
      {showEmojiPicker && (
        <div
          className={`absolute -top-9 z-30 flex items-center gap-1 bg-[#090d15] border border-[#1b2438] p-1 rounded-2xl shadow-xl ${
            isSelf ? 'right-0' : 'left-8'
          }`}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(message.id, emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1 text-sm hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative max-w-[78%] sm:max-w-md rounded-2xl p-3 text-sm shadow-sm ${
          isSelf
            ? 'bg-falcon-blue text-white rounded-br-none border border-cyan-400/30'
            : 'bg-[#121826] text-slate-200 rounded-bl-none border border-[#1b2438]'
        }`}
      >
        {/* Quoted reply banner */}
        {message.replyToContent && (
          <div
            className={`text-xs px-2.5 py-1 rounded-lg mb-2 border-l-2 ${
              isSelf
                ? 'bg-black/20 text-slate-100 border-white/60'
                : 'bg-black/40 text-slate-300 border-falcon-blue'
            }`}
          >
            <p className="truncate">{message.replyToContent}</p>
          </div>
        )}

        {/* Text Message */}
        {message.type === 'text' && (
          <p className="whitespace-pre-wrap break-words">{displayContent}</p>
        )}

        {/* Image Attachment */}
        {message.type === 'image' && message.attachment && (
          <div className="rounded-xl overflow-hidden mb-1 max-h-64 bg-black">
            <img src={message.attachment.url} alt="Image attachment" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Video Attachment */}
        {message.type === 'video' && message.attachment && (
          <div className="rounded-xl overflow-hidden mb-1 max-h-64 bg-black">
            <video src={message.attachment.url} controls className="w-full h-full object-contain" />
          </div>
        )}

        {/* Voice Note with Waveform */}
        {message.type === 'audio' && message.attachment && (
          <div className="flex items-center gap-2.5 py-1">
            <audio
              ref={audioRef}
              src={message.attachment.url}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
            <button
              onClick={togglePlayAudio}
              className={`p-2 rounded-full ${
                isSelf ? 'bg-white text-falcon-blue' : 'bg-falcon-blue text-white'
              } transition-transform hover:scale-105`}
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Visual Waveform Bars */}
            <div className="flex items-center gap-0.5 h-6 flex-1 px-1">
              {(message.attachment.waveform || [40, 60, 30, 80, 50, 90, 70, 45, 60, 30, 75, 40]).map(
                (h, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full ${isSelf ? 'bg-white/80' : 'bg-falcon-blue'}`}
                    style={{ height: `${Math.max(15, h)}%` }}
                  />
                )
              )}
            </div>

            {/* Speed toggle */}
            <button
              onClick={cycleSpeed}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isSelf ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {playbackSpeed}x
            </button>
          </div>
        )}

        {/* File Document Attachment */}
        {message.type === 'file' && message.attachment && (
          <a
            href={message.attachment.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 rounded-xl bg-black/25 hover:bg-black/40 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{message.attachment.name}</p>
              <p className="text-[10px] opacity-75">
                {(message.attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Download className="w-4 h-4 opacity-75" />
          </a>
        )}

        {/* Reactions pills */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-white/10">
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => {
              const count = message.reactions.filter((r) => r.emoji === emoji).length;
              return (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message.id, emoji)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] hover:bg-black/50 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer: Timestamp, E2EE Badge & Delivery Status */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
            isSelf ? 'text-white/80' : 'text-slate-400'
          }`}
        >
          {message.isEncrypted && (
            <span
              className="flex items-center gap-0.5 text-[9px] font-mono px-1 rounded bg-black/30 text-emerald-400"
              title="End-to-End Encrypted (AES-GCM-256)"
            >
              <Lock className="w-2.5 h-2.5" />
              E2EE
            </span>
          )}
          {message.isEdited && <span className="italic text-[9px] opacity-80">(edited)</span>}
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isSelf && <span>{statusTicks}</span>}
        </div>
      </div>
    </div>
  );
};

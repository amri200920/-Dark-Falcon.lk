import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MessageSquare,
  Copy,
  Check,
  Shield,
  Lock,
} from 'lucide-react';
import { Meeting } from '../../../shared/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Avatar } from '../common/Avatar';
import { BrandLogo } from '../common/BrandLogo';

interface MeetingRoomProps {
  meeting: Meeting;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ meeting, onLeave }) => {
  const { user } = useAuth();
  const { sendEvent, subscribe } = useSocket();

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [participants, setParticipants] = useState(meeting.participants);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const isHost = user?.id === meeting.hostId;

  // Start local media
  useEffect(() => {
    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Meeting media access warning:', err);
      }
    }
    startMedia();

    // Signal joined meeting
    sendEvent('meeting_join', { meetingCode: meeting.meetingCode });

    const unsubJoin = subscribe('meeting_user_joined', (payload) => {
      setParticipants((prev) => {
        if (!prev.some((p) => p.userId === payload.userId)) {
          return [
            ...prev,
            {
              userId: payload.userId,
              username: payload.username,
              role: 'participant',
              audioMuted: false,
              videoMuted: false,
              joinedAt: new Date().toISOString(),
            },
          ];
        }
        return prev;
      });
    });

    const unsubLeave = subscribe('meeting_user_left', (payload) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== payload.userId));
    });

    return () => {
      unsubJoin();
      unsubLeave();
      sendEvent('meeting_leave', { meetingCode: meeting.meetingCode });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [meeting.meetingCode]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const copyInvite = () => {
    const link = `${window.location.origin}/meet/${meeting.meetingCode}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a] text-white select-none">
      {/* Top Navbar */}
      <div className="p-3 border-b border-[#1b2438] bg-[#070a10] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <BrandLogo variant="emblem" className="w-8 h-8" />
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {meeting.title}
              {meeting.isLocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-falcon-blue">{meeting.meetingCode}</span>
              <button
                onClick={copyInvite}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCode ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg transition-colors flex items-center gap-1.5"
        >
          <PhoneOff className="w-4 h-4" /> Leave Meeting
        </button>
      </div>

      {/* Main Stage / Grid Area */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center justify-center overflow-y-auto">
          {/* Local User Preview Card */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0c101a] border-2 border-falcon-blue/50 aspect-video flex items-center justify-center shadow-lg">
            {!isVideoMuted ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Avatar src={user?.avatarUrl} alt={user?.displayName} size="xl" />
                <span className="text-xs text-slate-300">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
              <span>{user?.displayName} (You)</span>
              {isAudioMuted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>
          </div>

          {/* Remote Participants Previews */}
          {participants
            .filter((p) => p.userId !== user?.id)
            .map((p) => (
              <div
                key={p.userId}
                className="relative rounded-2xl overflow-hidden bg-[#0c101a] border border-[#1b2438] aspect-video flex flex-col items-center justify-center shadow-lg"
              >
                <Avatar src={p.avatarUrl} alt={p.username} size="xl" />
                <span className="text-xs font-semibold text-slate-300 mt-2">{p.username}</span>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <span>{p.username}</span>
                  {p.role === 'host' && <Shield className="w-3 h-3 text-amber-400" />}
                </div>
              </div>
            ))}
        </div>

        {/* Sidebar Roster if open */}
        {showParticipants && (
          <div className="w-64 bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 flex flex-col shadow-xl">
            <h3 className="text-xs font-bold text-white mb-3">Participants ({participants.length})</h3>
            <div className="space-y-2 overflow-y-auto flex-1 text-xs">
              {participants.map((p) => (
                <div key={p.userId} className="flex items-center justify-between p-2 rounded-xl bg-[#121826]">
                  <div className="flex items-center gap-2 truncate">
                    <Avatar src={p.avatarUrl} alt={p.username} size="xs" />
                    <span className="truncate">{p.username}</span>
                  </div>
                  {p.role === 'host' && <span className="text-[10px] text-amber-400 font-bold">HOST</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="p-4 border-t border-[#1b2438] bg-[#070a10] flex items-center justify-center gap-4 z-20">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-2xl transition-all ${
            isAudioMuted ? 'bg-red-600 text-white' : 'bg-[#121826] hover:bg-[#1b2438] text-slate-200'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-2xl transition-all ${
            isVideoMuted ? 'bg-red-600 text-white' : 'bg-[#121826] hover:bg-[#1b2438] text-slate-200'
          }`}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`p-3 rounded-2xl transition-all ${
            showParticipants ? 'bg-falcon-blue text-white' : 'bg-[#121826] hover:bg-[#1b2438] text-slate-200'
          }`}
          title="Toggle participant roster"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

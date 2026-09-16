import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Maximize2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { Avatar } from '../common/Avatar';
import { BrandLogo } from '../common/BrandLogo';

export const CallOverlay: React.FC = () => {
  const {
    callState,
    activeCall,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    callDuration,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlocked, setAudioBlocked] = useState<boolean>(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && activeCall?.type === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // Remote audio track for voice calls (and video calls audio channel)
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current
        .play()
        .then(() => setAudioBlocked(false))
        .catch((err) => {
          console.warn('Falcon: Remote audio autoplay blocked by policy:', err);
          setAudioBlocked(true);
        });
    }
  }, [remoteStream, activeCall?.type]);

  if (callState === 'idle') return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Incoming Call Screen with Falcon Wing Silhouette Pulse
  if (callState === 'incoming' && activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg select-none">
        <div className="w-full max-w-sm bg-[#0c101a] border border-cyan-500/40 rounded-3xl p-6 text-center shadow-neon-blue-lg flex flex-col items-center relative overflow-hidden">
          {/* Glowing Falcon Wings Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-falcon-blue/10 pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-falcon-blue/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Animated Avatar with Pulsing Radar Ring */}
          <div className="relative mb-5 mt-2">
            <div className="absolute -inset-3 rounded-full border-2 border-falcon-blue/40 animate-ping pointer-events-none" />
            <div className="absolute -inset-1 rounded-full border border-cyan-400 animate-pulse pointer-events-none" />
            <Avatar src={activeCall.targetAvatar} alt={activeCall.targetUsername} size="2xl" className="ring-4 ring-falcon-blue" />
            <span className="absolute -bottom-1 -right-1 p-1.5 bg-[#090d15] rounded-full border border-falcon-blue/50 text-xs">
              🦅
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white mb-1 tracking-wide">
            {activeCall.targetUsername}
          </h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Incoming Dark Falcon {activeCall.type === 'video' ? 'Video' : 'Audio'} Call</span>
          </div>

          {/* Call Controls: Reject & Answer */}
          <div className="flex items-center gap-8 w-full justify-center relative z-10">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={rejectCall}
                className="p-4 bg-red-600/90 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border border-red-400/40"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-[11px] text-slate-400">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={answerCall}
                className="p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all border border-emerald-300 animate-bounce"
                title="Answer Call"
              >
                <Phone className="w-6 h-6" />
              </button>
              <span className="text-[11px] text-emerald-400 font-semibold">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call or Calling Screen
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a] text-white select-none">
      {/* Call Top Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#1b2438]">
          <BrandLogo variant="emblem" className="w-6 h-6" />
          <div>
            <h4 className="text-sm font-semibold">{activeCall?.targetUsername || 'Dark Falcon Call'}</h4>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <p className="text-xs text-falcon-blue font-medium">
                {callState === 'calling'
                  ? activeCall?.isCaller
                    ? 'Calling...'
                    : 'Connecting...'
                  : callState === 'connected'
                  ? `Connected • ${formatDuration(callDuration)}`
                  : 'Call Ended'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Autoplay Blocked Floating Recovery Banner */}
      {audioBlocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={() => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current
                  .play()
                  .then(() => setAudioBlocked(false))
                  .catch(console.error);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-falcon-blue hover:from-cyan-400 hover:to-falcon-blue-light text-white text-xs font-bold rounded-full shadow-neon-blue animate-bounce border border-cyan-300/40"
          >
            <Volume2 className="w-4 h-4" />
            <span>Tap to Enable Audio</span>
          </button>
        </div>
      )}

      {/* Main Video / Audio Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Remote audio element — offscreen instead of display:none so mobile OS does not suppress audio */}
        <audio
          ref={(el) => {
            remoteAudioRef.current = el;
            if (el && remoteStream) {
              el.srcObject = remoteStream;
              el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
            }
          }}
          autoPlay
          playsInline
          style={{ position: 'fixed', top: '-100px', left: '-100px', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none' }}
        />

        {activeCall?.type === 'video' && remoteStream ? (
          <video
            ref={(el) => {
              remoteVideoRef.current = el;
              if (el && remoteStream) {
                el.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="relative">
              <Avatar
                src={activeCall?.targetAvatar}
                alt={activeCall?.targetUsername}
                size="2xl"
                className="ring-4 ring-falcon-blue/50"
              />
              {callState === 'calling' && (
                <div className="absolute inset-0 rounded-full border-4 border-falcon-blue animate-ping" />
              )}
            </div>
            <p className="text-xl font-bold tracking-wide">{activeCall?.targetUsername}</p>
            <span className="text-xs px-3 py-1 rounded-full bg-[#121826] border border-[#1b2438] text-slate-300">
              {callState === 'calling'
                ? activeCall?.isCaller ? 'Ringing...' : 'Connecting...'
                : '🛡️ End-to-End Encrypted Call'}
            </span>
          </div>
        )}

        {/* Local Video Thumbnail (Picture in Picture) */}
        {activeCall?.type === 'video' && localStream && (
          <div className="absolute bottom-24 right-4 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-falcon-blue/40 shadow-2xl bg-black z-20">
            <video
              ref={(el) => {
                localVideoRef.current = el;
                if (el && localStream) {
                  el.srcObject = localStream;
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoMuted && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-red-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Call Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0c101a]/90 backdrop-blur-md px-6 py-3 rounded-full border border-[#1b2438] shadow-2xl">
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-full transition-colors ${
            isAudioMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#1b2438] text-white hover:bg-[#25324d]'
          }`}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {activeCall?.type === 'video' && (
          <>
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-colors ${
                isVideoMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#1b2438] text-white hover:bg-[#25324d]'
              }`}
              title={isVideoMuted ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-full transition-colors ${
                isScreenSharing ? 'bg-falcon-blue text-white' : 'bg-[#1b2438] text-white hover:bg-[#25324d]'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={endCall}
          className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all ml-2"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

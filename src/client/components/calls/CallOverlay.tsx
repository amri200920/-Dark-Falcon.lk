import React, { useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Maximize2 } from 'lucide-react';
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

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Incoming Call Modal
  if (callState === 'incoming' && activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="w-full max-w-sm bg-[#0c101a] border border-falcon-blue/40 rounded-3xl p-6 text-center shadow-neon-blue-lg flex flex-col items-center">
          <div className="animate-pulse-subtle mb-4">
            <Avatar src={activeCall.targetAvatar} alt={activeCall.targetUsername} size="2xl" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{activeCall.targetUsername}</h3>
          <p className="text-sm text-falcon-blue font-medium mb-6">
            Incoming {activeCall.type === 'video' ? 'Video' : 'Voice'} Call...
          </p>

          <div className="flex items-center gap-6 w-full justify-center">
            <button
              onClick={rejectCall}
              className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={answerCall}
              className="p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="Answer"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call or Calling Screen
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070a] text-white">
      {/* Call Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#1b2438]">
          <BrandLogo variant="emblem" className="w-6 h-6" />
          <div>
            <h4 className="text-sm font-semibold">{activeCall?.targetUsername || 'Falcon Call'}</h4>
            <p className="text-xs text-falcon-blue">
              {callState === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Video / Audio Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {activeCall?.type === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
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
            <p className="text-lg font-bold">{activeCall?.targetUsername}</p>
            <p className="text-xs text-slate-400">
              {callState === 'calling' ? 'Ringing sovereign connection...' : 'Secure WebRTC Connected'}
            </p>
          </div>
        )}

        {/* Local Video Thumbnail (Picture in Picture) */}
        {activeCall?.type === 'video' && localStream && (
          <div className="absolute bottom-24 right-4 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-falcon-blue/40 shadow-2xl bg-black z-20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}
      </div>

      {/* Call Controls Toolbar */}
      <div className="pb-8 pt-4 flex items-center justify-center gap-4 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-full transition-all ${
            isAudioMuted ? 'bg-red-600 text-white' : 'bg-[#121826] hover:bg-[#1c2438] text-slate-200'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {activeCall?.type === 'video' && (
          <>
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-all ${
                isVideoMuted ? 'bg-red-600 text-white' : 'bg-[#121826] hover:bg-[#1c2438] text-slate-200'
              }`}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-full transition-all ${
                isScreenSharing ? 'bg-falcon-blue text-white' : 'bg-[#121826] hover:bg-[#1c2438] text-slate-200'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={endCall}
          className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all ml-2"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

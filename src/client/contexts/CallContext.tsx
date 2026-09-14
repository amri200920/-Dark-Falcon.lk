import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { CallType } from '../../shared/types';

export type CallStatusState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface ActiveCallInfo {
  callId: string;
  targetUserId: string;
  targetUsername: string;
  targetAvatar?: string;
  type: CallType;
  isCaller: boolean;
}

interface CallContextType {
  callState: CallStatusState;
  activeCall: ActiveCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  startCall: (targetUserId: string, targetUsername: string, type: CallType, targetAvatar?: string) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// Web Audio Ringtone Generator (no external assets needed)
class RingtoneSynth {
  private ctx: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: any = null;

  public play() {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ring = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.oscillator1 = this.ctx.createOscillator();
        this.oscillator2 = this.ctx.createOscillator();
        this.gainNode = this.ctx.createGain();

        this.oscillator1.type = 'sine';
        this.oscillator1.frequency.setValueAtTime(440, now); // 440 Hz
        this.oscillator2.type = 'sine';
        this.oscillator2.frequency.setValueAtTime(480, now); // 480 Hz

        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(0.08, now + 0.1);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 1.8);

        this.oscillator1.connect(this.gainNode);
        this.oscillator2.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        this.oscillator1.start(now);
        this.oscillator2.start(now);
        this.oscillator1.stop(now + 1.8);
        this.oscillator2.stop(now + 1.8);
      };

      ring();
      this.intervalId = setInterval(ring, 3000);
    } catch (e) {
      console.warn('AudioContext ringtone warning:', e);
    }
  }

  public stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
    }
    this.ctx = null;
  }
}

const ringtone = new RingtoneSynth();

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { sendEvent, subscribe } = useSocket();

  const [callState, setCallState] = useState<CallStatusState>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const durationTimerRef = useRef<any>(null);

  const setupPeerConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall) {
        sendEvent('ice_candidate', {
          targetUserId: activeCall.targetUserId,
          candidate: event.candidate,
          callId: activeCall.callId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🦅 Received remote media track:', event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        ringtone.stop();
        startDurationTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startDurationTimer = () => {
    setCallDuration(0);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  // Socket event listeners
  useEffect(() => {
    const unsubIncoming = subscribe('call_incoming', (payload) => {
      setActiveCall({
        callId: payload.callId,
        targetUserId: payload.callerId,
        targetUsername: payload.callerUsername,
        targetAvatar: payload.callerAvatar,
        type: payload.type,
        isCaller: false,
      });
      setCallState('incoming');
      ringtone.play();
    });

    const unsubAccepted = subscribe('call_accepted', async () => {
      ringtone.stop();
      setCallState('connected');
      startDurationTimer();

      // Caller creates WebRTC Offer
      const pc = pcRef.current;
      if (pc && activeCall) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendEvent('webrtc_offer', {
          targetUserId: activeCall.targetUserId,
          offer,
          callId: activeCall.callId,
        });
      }
    });

    const unsubOffer = subscribe('webrtc_offer', async (payload) => {
      const pc = setupPeerConnection();

      // Add local media tracks to pc if we answered
      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendEvent('webrtc_answer', {
        targetUserId: payload.callerId,
        answer,
        callId: payload.callId,
      });
    });

    const unsubAnswer = subscribe('webrtc_answer', async (payload) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });

    const unsubIce = subscribe('ice_candidate', async (payload) => {
      if (pcRef.current && payload.candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.warn('ICE candidate error:', e);
        }
      }
    });

    const unsubRejected = subscribe('call_rejected', () => {
      ringtone.stop();
      cleanupMedia();
      setCallState('ended');
      setTimeout(() => setCallState('idle'), 2000);
    });

    const unsubEnded = subscribe('call_ended', () => {
      ringtone.stop();
      cleanupMedia();
      setCallState('ended');
      setTimeout(() => setCallState('idle'), 2000);
    });

    return () => {
      unsubIncoming();
      unsubAccepted();
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubRejected();
      unsubEnded();
    };
  }, [activeCall, localStream]);

  const cleanupMedia = () => {
    stopDurationTimer();
    ringtone.stop();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((t) => t.stop());
      setRemoteStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const startCall = async (targetUserId: string, targetUsername: string, type: CallType, targetAvatar?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      setLocalStream(stream);

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const callId = `call-${Date.now()}`;
      setActiveCall({
        callId,
        targetUserId,
        targetUsername,
        targetAvatar,
        type,
        isCaller: true,
      });

      setCallState('calling');
      ringtone.play();

      sendEvent('call_initiate', {
        receiverId: targetUserId,
        receiverUsername: targetUsername,
        type,
      });
    } catch (err: any) {
      console.error('Microphone/Camera permission error:', err);
      alert(`Could not start call: ${err.message || 'Media permission denied'}`);
    }
  };

  const answerCall = async () => {
    if (!activeCall) return;
    ringtone.stop();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === 'video',
      });
      setLocalStream(stream);

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setCallState('connected');
      startDurationTimer();

      sendEvent('call_accept', {
        callId: activeCall.callId,
        callerId: activeCall.targetUserId,
      });
    } catch (err: any) {
      alert(`Could not answer call: ${err.message || 'Media permission denied'}`);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (activeCall) {
      sendEvent('call_reject', {
        callId: activeCall.callId,
        callerId: activeCall.targetUserId,
      });
    }
    cleanupMedia();
    setCallState('idle');
    setActiveCall(null);
  };

  const endCall = () => {
    if (activeCall) {
      sendEvent('call_end', {
        callId: activeCall.callId,
        targetUserId: activeCall.targetUserId,
      });
    }
    cleanupMedia();
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveCall(null);
    }, 1500);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall?.type === 'video',
      });
      setLocalStream(stream);
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current && localStream) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };

        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        activeCall,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        callDuration,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};

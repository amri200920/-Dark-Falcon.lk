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

class RingtoneSynth {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  public play() {
    this.stop();
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ring = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(480, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 1.8);
        osc1.connect(gain); osc2.connect(gain); gain.connect(this.ctx.destination);
        osc1.start(now); osc2.start(now); osc1.stop(now + 1.8); osc2.stop(now + 1.8);
      };
      ring();
      this.intervalId = setInterval(ring, 3000);
    } catch (e) { console.warn('Ringtone error:', e); }
  }

  public stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.ctx && this.ctx.state !== 'closed') { try { this.ctx.close(); } catch {} }
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
  // Refs for use in socket closures (avoids ALL stale state captures)
  const activeCallRef = useRef<ActiveCallInfo | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStateRef = useRef<CallStatusState>('idle');

  // Keep refs in sync
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const setupPeerConnection = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    });

    // FIX: use activeCallRef.current — never stale state
    pc.onicecandidate = (event) => {
      if (event.candidate && activeCallRef.current) {
        sendEvent('ice_candidate', {
          targetUserId: activeCallRef.current.targetUserId,
          candidate: event.candidate,
          callId: activeCallRef.current.callId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Falcon: remote track received', event.streams[0]);
      if (event.streams && event.streams[0]) setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('Falcon: WebRTC state =', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected'); callStateRef.current = 'connected';
        ringtone.stop(); startDurationTimer();
      } else if (pc.connectionState === 'failed') {
        console.warn('Falcon: WebRTC failed — ending call');
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startDurationTimer = () => {
    setCallDuration(0);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
  };

  const stopDurationTimer = () => {
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
  };

  // Register socket handlers ONCE — use refs inside closures, never state
  useEffect(() => {
    const unsubIncoming = subscribe('call_incoming', (payload) => {
      if (callStateRef.current !== 'idle') return;
      const info: ActiveCallInfo = {
        callId: payload.callId,
        targetUserId: payload.callerId,
        targetUsername: payload.callerUsername,
        targetAvatar: payload.callerAvatar,
        type: payload.type,
        isCaller: false,
      };
      activeCallRef.current = info;
      setActiveCall(info);
      setCallState('incoming'); callStateRef.current = 'incoming';
      ringtone.play();
    });

    // Caller receives: receiver accepted — caller now creates offer
    const unsubAccepted = subscribe('call_accepted', async () => {
      ringtone.stop();
      const pc = pcRef.current;
      const call = activeCallRef.current;
      if (!pc || !call) { console.warn('call_accepted: missing PC or activeCall'); return; }
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: call.type === 'video' });
        await pc.setLocalDescription(offer);
        sendEvent('webrtc_offer', { targetUserId: call.targetUserId, offer, callId: call.callId });
      } catch (err) { console.error('Failed to create offer:', err); }
    });

    // Receiver gets offer from caller — FIX: do NOT call setupPeerConnection() here
    // answerCall() already set up the PC with tracks. Just use pcRef.current.
    const unsubOffer = subscribe('webrtc_offer', async (payload) => {
      let pc = pcRef.current;
      if (!pc) {
        console.warn('webrtc_offer: no existing PC — creating fallback');
        pc = setupPeerConnection();
        const stream = localStreamRef.current;
        if (stream) stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const call = activeCallRef.current;
        sendEvent('webrtc_answer', { targetUserId: payload.callerId, answer, callId: call?.callId || payload.callId });
      } catch (err) { console.error('webrtc_offer handling error:', err); }
    });

    const unsubAnswer = subscribe('webrtc_answer', async (payload) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      } catch (err) { console.error('webrtc_answer error:', err); }
    });

    const unsubIce = subscribe('ice_candidate', async (payload) => {
      const pc = pcRef.current;
      if (!pc || !payload.candidate) return;
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (e) { console.warn('ICE candidate error:', e); }
    });

    const unsubRejected = subscribe('call_rejected', () => {
      ringtone.stop(); cleanupMedia();
      setCallState('ended'); callStateRef.current = 'ended';
      setTimeout(() => { setCallState('idle'); callStateRef.current = 'idle'; setActiveCall(null); activeCallRef.current = null; }, 2000);
    });

    const unsubEnded = subscribe('call_ended', () => {
      ringtone.stop(); cleanupMedia();
      setCallState('ended'); callStateRef.current = 'ended';
      setTimeout(() => { setCallState('idle'); callStateRef.current = 'idle'; setActiveCall(null); activeCallRef.current = null; }, 2000);
    });

    return () => { unsubIncoming(); unsubAccepted(); unsubOffer(); unsubAnswer(); unsubIce(); unsubRejected(); unsubEnded(); };
  }, []); // FIX: register ONCE with empty deps — all state accessed via refs

  const cleanupMedia = () => {
    stopDurationTimer(); ringtone.stop();
    const stream = localStreamRef.current;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setLocalStream(null); localStreamRef.current = null; }
    setRemoteStream(null);
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setIsScreenSharing(false); setIsAudioMuted(false); setIsVideoMuted(false);
  };

  const startCall = async (targetUserId: string, targetUsername: string, type: CallType, targetAvatar?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream); localStreamRef.current = stream;

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const callId = `call-${Date.now()}`;
      const info: ActiveCallInfo = { callId, targetUserId, targetUsername, targetAvatar, type, isCaller: true };
      activeCallRef.current = info;
      setActiveCall(info);
      setCallState('calling'); callStateRef.current = 'calling';
      ringtone.play();

      sendEvent('call_initiate', { receiverId: targetUserId, receiverUsername: targetUsername, type });
    } catch (err: any) {
      console.error('Call start error:', err);
      alert(`Could not start call: ${err.message || 'Media permission denied'}`);
    }
  };

  const answerCall = async () => {
    const call = activeCallRef.current;
    if (!call) return;
    ringtone.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.type === 'video' });
      setLocalStream(stream); localStreamRef.current = stream;

      // Set up PC and add tracks BEFORE sending call_accept.
      // When caller gets call_accepted, they send webrtc_offer.
      // Our unsubOffer handler will then use THIS same PC (pcRef.current).
      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setCallState('calling'); callStateRef.current = 'calling'; // Connecting...
      sendEvent('call_accept', { callId: call.callId, callerId: call.targetUserId });
    } catch (err: any) {
      alert(`Could not answer call: ${err.message || 'Media permission denied'}`);
      rejectCall();
    }
  };

  const rejectCall = () => {
    const call = activeCallRef.current;
    if (call) sendEvent('call_reject', { callId: call.callId, callerId: call.targetUserId });
    ringtone.stop(); cleanupMedia();
    setCallState('idle'); callStateRef.current = 'idle';
    setActiveCall(null); activeCallRef.current = null;
  };

  const endCall = () => {
    const call = activeCallRef.current;
    if (call) sendEvent('call_end', { callId: call.callId, targetUserId: call.targetUserId });
    cleanupMedia();
    setCallState('ended'); callStateRef.current = 'ended';
    setTimeout(() => { setCallState('idle'); callStateRef.current = 'idle'; setActiveCall(null); activeCallRef.current = null; }, 1500);
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const t = stream.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsAudioMuted(!t.enabled); }
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const t = stream.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoMuted(!t.enabled); }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const call = activeCallRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call?.type === 'video' });
      setLocalStream(stream); localStreamRef.current = stream;
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && stream.getVideoTracks()[0]) await sender.replaceTrack(stream.getVideoTracks()[0]);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => setIsScreenSharing(false);
        setLocalStream(screenStream); localStreamRef.current = screenStream;
        setIsScreenSharing(true);
      } catch (err) { console.warn('Screen share cancelled:', err); }
    }
  };

  return (
    <CallContext.Provider value={{ callState, activeCall, localStream, remoteStream, isAudioMuted, isVideoMuted, isScreenSharing, callDuration, startCall, answerCall, rejectCall, endCall, toggleAudio, toggleVideo, toggleScreenShare }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};

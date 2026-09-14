import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';
import { api } from '../../services/api';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string, duration: number, waveform: number[]) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {}
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio analysis for live visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      drawWaveform();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone permission error: ${err.message || 'Microphone unavailable'}`);
      onCancel();
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = '#00a6ff';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    render();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  };

  const togglePreview = () => {
    if (!previewAudioRef.current && recordedUrl) {
      const audio = new Audio(recordedUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }

    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    try {
      const file = new File([recordedBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      const res = await api.upload(file);
      if (res.success && res.data?.url) {
        // Generate pseudo-random waveform representation
        const waveform = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20);
        onSendVoiceNote(res.data.url, duration, waveform);
      }
    } catch (e: any) {
      alert('Failed to send audio note: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-[#0c101a] border border-falcon-blue/40 rounded-2xl p-2.5 shadow-neon-blue animate-fade-in">
      {/* Delete / Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        title="Discard voice message"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Recording Indicator or Preview */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording ? (
          <>
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-400">{formatTime(duration)}</span>
            <canvas ref={canvasRef} width={140} height={24} className="rounded" />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePreview}
              className="p-1.5 rounded-full bg-falcon-blue text-white"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs font-mono text-slate-300">Preview: {formatTime(duration)}</span>
          </div>
        )}
      </div>

      {/* Stop or Send Controls */}
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
          title="Stop recording"
        >
          <Square className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={isUploading}
          className="p-2 rounded-xl bg-falcon-blue hover:bg-falcon-blue-dark text-white shadow-neon-blue transition-colors"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

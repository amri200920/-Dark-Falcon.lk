import React, { useState, useEffect } from 'react';
import { Video, Plus, Key, Calendar, Shield, ExternalLink, Copy, Check, Clock } from 'lucide-react';
import { Meeting } from '../../shared/types';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { MeetingRoom } from '../components/meetings/MeetingRoom';
import { Modal } from '../components/common/Modal';

export const MeetingsPage: React.FC = () => {
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await api.get<Meeting[]>('/meetings');
      if (res.success && Array.isArray(res.data)) {
        setMeetingsList(res.data);
      }
    } catch (e) {
      console.warn('Failed to load meetings list:', e);
    }
  };

  const handleStartInstant = async () => {
    setIsLoading(true);
    try {
      const res = await api.post<Meeting>('/meetings', {
        title: meetingTitle.trim() || 'Dark Falcon Instant Meeting',
        isInstant: true,
      });
      if (res.success && res.data) {
        setActiveMeeting(res.data);
        loadMeetings();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.post<Meeting>('/meetings', {
        title: meetingTitle.trim(),
        isInstant: false,
        scheduledTime: scheduleTime || new Date(Date.now() + 3600000).toISOString(),
      });
      if (res.success && res.data) {
        setMeetingsList((prev) => [res.data, ...prev]);
        setIsScheduleOpen(false);
        setMeetingTitle('');
        setScheduleTime('');
        alert(`Meeting scheduled! Meeting code: ${res.data.meetingCode}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to schedule meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async (e?: React.FormEvent, codeToJoin?: string) => {
    if (e) e.preventDefault();
    const code = (codeToJoin || joinCode).trim();
    if (!code) return;

    setIsLoading(true);
    try {
      const res = await api.post<Meeting>(`/meetings/${code}/join`);
      if (res.success && res.data) {
        setActiveMeeting(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Meeting not found or locked');
    } finally {
      setIsLoading(false);
    }
  };

  const copyMeetingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (activeMeeting) {
    return (
      <MeetingRoom
        meeting={activeMeeting}
        onLeave={() => {
          setActiveMeeting(null);
          loadMeetings();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 select-none">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0c101a] to-[#121826] border border-falcon-blue/30 rounded-3xl p-6 sm:p-8 shadow-neon-blue text-left relative overflow-hidden">
        <div className="max-w-xl z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-falcon-blue/20 text-falcon-blue text-xs font-bold mb-3 border border-falcon-blue/30">
            <Shield className="w-3.5 h-3.5" /> Encrypted WebRTC Video Conferences
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Dark Falcon Meetings 🦅
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Conduct secure video conferences with participant grid, active speaker highlighting, screen sharing, and host moderation controls.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="glow"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleStartInstant}
              isLoading={isLoading}
            >
              Start Instant Meeting
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => setIsScheduleOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* Join Section */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-falcon-blue" />
          Join Meeting with Code
        </h2>
        <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter meeting code (e.g. df-abcd-1234)..."
            className="flex-1 bg-[#090d15] border border-[#1b2438] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
          <Button type="submit" variant="glow" disabled={!joinCode.trim()} isLoading={isLoading}>
            Join Room
          </Button>
        </form>
      </div>

      {/* Recent & Scheduled Meetings List */}
      {meetingsList.length > 0 && (
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-falcon-blue" />
            Active & Scheduled Meetings
          </h3>
          <div className="divide-y divide-[#1b2438]">
            {meetingsList.slice(0, 5).map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{m.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Code: <span className="font-mono text-falcon-blue">{m.meetingCode}</span> • Host: @{m.hostUsername}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyMeetingCode(m.meetingCode)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                    title="Copy code"
                  >
                    {copiedCode === m.meetingCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleJoinByCode(undefined, m.meetingCode)}
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Dark Falcon Meeting" maxWidth="sm">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Input
            label="Meeting Title"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g. Weekly Architecture Review"
            required
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
          <Button
            type="submit"
            variant="glow"
            className="w-full"
            isLoading={isLoading}
          >
            Create Scheduled Meeting
          </Button>
        </form>
      </Modal>
    </div>
  );
};

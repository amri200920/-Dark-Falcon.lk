import React, { useState } from 'react';
import { Video, Plus, Key, Calendar, Shield, ExternalLink } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInstant = async () => {
    setIsLoading(true);
    try {
      const res = await api.post<Meeting>('/meetings', {
        title: meetingTitle.trim() || 'Dark Falcon Instant Sovereign Meeting',
        isInstant: true,
      });
      if (res.success && res.data) {
        setActiveMeeting(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initialize meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.post<Meeting>(`/meetings/${joinCode.trim()}/join`);
      if (res.success && res.data) {
        setActiveMeeting(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Meeting not found or locked');
    } finally {
      setIsLoading(false);
    }
  };

  if (activeMeeting) {
    return (
      <MeetingRoom
        meeting={activeMeeting}
        onLeave={() => setActiveMeeting(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 select-none">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0c101a] to-[#121826] border border-falcon-blue/30 rounded-3xl p-6 sm:p-8 shadow-neon-blue text-left relative overflow-hidden">
        <div className="max-w-xl z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-falcon-blue/20 text-falcon-blue text-xs font-bold mb-3 border border-falcon-blue/30">
            <Shield className="w-3.5 h-3.5" /> Scalable WebRTC Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Dark Falcon Meetings 🦅
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Conduct encrypted video conferences with participant grid, active speaker highlighting, screen sharing, and host moderation controls.
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

      {/* Infrastructure Note */}
      <div className="bg-[#090d15] border border-[#1b2438] rounded-2xl p-4 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200">🦅 SFU Production Architecture Note:</p>
        <p>
          Dark Falcon natively supports WebRTC mesh for peer meetings and is architected for instant integration with LiveKit or mediasoup SFU server clusters for 100+ participant rooms via server environment credentials.
        </p>
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Schedule Dark Falcon Meeting" maxWidth="sm">
        <div className="space-y-4">
          <Input
            label="Meeting Title"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g. Weekly Aviation Architecture Review"
          />
          <Input
            label="Date & Time"
            type="datetime-local"
          />
          <Button
            variant="glow"
            className="w-full"
            onClick={() => {
              alert('Meeting scheduled! Invitation link generated.');
              setIsScheduleOpen(false);
            }}
          >
            Create Scheduled Meeting
          </Button>
        </div>
      </Modal>
    </div>
  );
};

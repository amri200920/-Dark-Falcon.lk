import React, { useState, useEffect } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react';
import { CallLog } from '../../shared/types';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { useCall } from '../contexts/CallContext';
import { useAuth } from '../contexts/AuthContext';

export const CallsPage: React.FC = () => {
  const { user } = useAuth();
  const { startCall } = useCall();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  useEffect(() => {
    async function loadCalls() {
      try {
        const res = await api.get<CallLog[]>('/calls/history');
        if (res.success) setCallLogs(res.data);
      } catch (e) {
        console.warn('Call history error', e);
      }
    }
    loadCalls();
  }, []);

  const filtered = callLogs.filter((c) => (filter === 'missed' ? c.status === 'missed' : true));

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Call History</h2>
          <p className="text-xs text-slate-400">Encrypted Audio & Video Calls</p>
        </div>

        <div className="flex rounded-xl bg-[#090d15] p-1 border border-[#1b2438] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium ${
              filter === 'all' ? 'bg-falcon-blue text-white' : 'text-slate-400'
            }`}
          >
            All Calls
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-3 py-1 rounded-lg font-medium ${
              filter === 'missed' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl divide-y divide-[#1b2438]/50 shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No call history yet. Start a voice or video call with a contact.
          </div>
        ) : (
          filtered.map((log) => {
            const isCaller = log.callerId === user?.id;
            const targetUsername = isCaller ? log.receiverUsername : log.callerUsername;
            const targetAvatar = isCaller ? log.receiverAvatar : log.callerAvatar;
            const targetId = isCaller ? log.receiverId : log.callerId;

            return (
              <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-[#090d15] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar src={targetAvatar} alt={targetUsername} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{targetUsername}</span>
                      {log.status === 'missed' ? (
                        <span className="text-[10px] text-red-400 flex items-center gap-1 font-semibold">
                          <PhoneMissed className="w-3 h-3" /> Missed
                        </span>
                      ) : isCaller ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <PhoneOutgoing className="w-3 h-3" /> Outgoing
                        </span>
                      ) : (
                        <span className="text-[10px] text-sky-400 flex items-center gap-1">
                          <PhoneIncoming className="w-3 h-3" /> Incoming
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{new Date(log.startedAt).toLocaleString()}</span>
                      {log.duration > 0 && <span>• {log.duration}s</span>}
                    </div>
                  </div>
                </div>

                {/* Quick Call Triggers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startCall(targetId, targetUsername, 'voice', targetAvatar)}
                    className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
                    title="Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall(targetId, targetUsername, 'video', targetAvatar)}
                    className="p-2 rounded-xl text-slate-400 hover:text-falcon-blue hover:bg-[#121826] transition-colors"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

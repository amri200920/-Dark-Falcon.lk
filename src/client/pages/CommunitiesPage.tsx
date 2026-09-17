import React, { useState, useEffect } from 'react';
import { Users, Plus, Hash, Shield, Check } from 'lucide-react';
import { Community } from '../../shared/types';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { COMMUNITY_CATEGORIES } from '../../shared/constants';

export const CommunitiesPage: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadCommunities() {
      try {
        const res = await api.get<Community[]>('/communities');
        if (res.success) {
          setCommunities(res.data);
          if (res.data.length > 0) setSelectedCommunity(res.data[0]);
        }
      } catch (e) {
        console.warn('Communities load error', e);
      }
    }
    loadCommunities();
  }, []);

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    try {
      const res = await api.post<Community>('/communities', {
        name: name.trim(),
        handle: handle.trim(),
        description: desc.trim(),
        category,
      });

      if (res.success && res.data) {
        setCommunities((prev) => [...prev, res.data]);
        setSelectedCommunity(res.data);
        setIsCreateOpen(false);
        setName('');
        setHandle('');
        setDesc('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create community');
    }
  };

  const toggleJoin = async (id: string) => {
    const nextState = !joinedMap[id];
    setJoinedMap((prev) => ({ ...prev, [id]: nextState }));
    try {
      if (nextState) {
        await api.post(`/communities/${id}/join`);
      } else {
        await api.post(`/communities/${id}/leave`);
      }
    } catch (e) {
      console.warn('Failed to toggle community membership:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 pb-20 md:pb-8">
      {/* Left List of Communities */}
      <div className="w-full md:w-80 space-y-4 shrink-0">
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Communities</h2>
            <p className="text-[11px] text-slate-400">Join sovereign collectives</p>
          </div>
          <Button
            size="sm"
            variant="glow"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New
          </Button>
        </div>

        <div className="space-y-2">
          {communities.map((c) => {
            const isSelected = selectedCommunity?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCommunity(c)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#121826] border-falcon-blue shadow-neon-blue'
                    : 'bg-[#0c101a] border-[#1b2438] hover:border-slate-700'
                }`}
              >
                <Avatar src={c.avatarUrl} alt={c.name} size="md" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">@{c.handle}</p>
                  <span className="text-[10px] text-falcon-blue">{c.membersCount} members</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Selected Community Details & Channels */}
      <div className="flex-1">
        {selectedCommunity ? (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-6">
            {/* Banner Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-[#1b2438]">
              <div className="flex items-center gap-4">
                <Avatar src={selectedCommunity.avatarUrl} alt={selectedCommunity.name} size="xl" />
                <div>
                  <h2 className="text-xl font-extrabold text-white">{selectedCommunity.name}</h2>
                  <p className="text-xs text-slate-400">@{selectedCommunity.handle} • {selectedCommunity.category}</p>
                  <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">{selectedCommunity.description}</p>
                </div>
              </div>

              <Button
                variant={joinedMap[selectedCommunity.id] ? 'secondary' : 'glow'}
                size="sm"
                onClick={() => toggleJoin(selectedCommunity.id)}
              >
                {joinedMap[selectedCommunity.id] ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Joined
                  </>
                ) : (
                  'Join Community'
                )}
              </Button>
            </div>

            {/* Discussion Channels */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Discussion Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCommunity.channels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => alert(`Opened #${ch.name} chatroom`)}
                    className="p-3 bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-falcon-blue mb-1">
                      <Hash className="w-3.5 h-3.5" />
                      <span>{ch.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{ch.topic || 'General community discussion'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            {selectedCommunity.rules && selectedCommunity.rules.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#090d15] border border-[#1b2438]">
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-falcon-blue" /> Community Guidelines
                </h4>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {selectedCommunity.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">Select a community to view.</div>
        )}
      </div>

      {/* Create Community Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Sovereign Community">
        <form onSubmit={handleCreateCommunity} className="space-y-4">
          <Input label="Community Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Dark Falcon Aviators" />
          <Input label="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} required placeholder="falcon-aviators" />
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white"
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this community about?"
              className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white resize-none"
            />
          </div>
          <Button type="submit" variant="glow" className="w-full">Create Community</Button>
        </form>
      </Modal>
    </div>
  );
};

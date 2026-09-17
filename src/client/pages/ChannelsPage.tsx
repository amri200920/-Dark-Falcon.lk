import React, { useState, useEffect } from 'react';
import { Radio, Plus, Check, Bell, Heart } from 'lucide-react';
import { BroadcastChannel } from '../../shared/types';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../contexts/AuthContext';

export const ChannelsPage: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [desc, setDesc] = useState('');
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await api.get<BroadcastChannel[]>('/channels');
        if (res.success) {
          setChannels(res.data);
          if (res.data.length > 0) setSelectedChannel(res.data[0]);
        }
      } catch (e) {
        console.warn('Channels load error', e);
      }
    }
    loadChannels();
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    try {
      const res = await api.post<BroadcastChannel>('/channels', {
        name: name.trim(),
        handle: handle.trim(),
        description: desc.trim(),
      });

      if (res.success && res.data) {
        setChannels((prev) => [...prev, res.data]);
        setSelectedChannel(res.data);
        setIsCreateOpen(false);
        setName('');
        setHandle('');
        setDesc('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create channel');
    }
  };

  const toggleSubscribe = async (id: string) => {
    const nextState = !subscribedMap[id];
    setSubscribedMap((prev) => ({ ...prev, [id]: nextState }));
    try {
      if (nextState) {
        await api.post(`/channels/${id}/subscribe`);
      } else {
        await api.post(`/channels/${id}/unsubscribe`);
      }
    } catch (e) {
      console.warn('Failed to toggle channel subscription:', e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 pb-20 md:pb-8">
      {/* Left List of Broadcast Channels */}
      <div className="w-full md:w-80 space-y-4 shrink-0">
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Broadcast Channels</h2>
            <p className="text-[11px] text-slate-400">1-to-many official updates</p>
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
          {channels.map((ch) => {
            const isSelected = selectedChannel?.id === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#121826] border-falcon-blue shadow-neon-blue'
                    : 'bg-[#0c101a] border-[#1b2438] hover:border-slate-700'
                }`}
              >
                <Avatar src={ch.avatarUrl} alt={ch.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                    {ch.isVerified && <Badge isVerified={true} />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">@{ch.handle}</p>
                  <span className="text-[10px] text-cyan-400">{ch.subscribersCount} subscribers</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Selected Channel Feed */}
      <div className="flex-1">
        {selectedChannel ? (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-3xl p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-[#1b2438]">
              <div className="flex items-center gap-4">
                <Avatar src={selectedChannel.avatarUrl} alt={selectedChannel.name} size="xl" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-extrabold text-white">{selectedChannel.name}</h2>
                    {selectedChannel.isVerified && <Badge isVerified={true} />}
                  </div>
                  <p className="text-xs text-slate-400">@{selectedChannel.handle} • Owner: @{selectedChannel.ownerUsername}</p>
                  <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">{selectedChannel.description}</p>
                </div>
              </div>

              <Button
                variant={subscribedMap[selectedChannel.id] ? 'secondary' : 'glow'}
                size="sm"
                onClick={() => toggleSubscribe(selectedChannel.id)}
              >
                {subscribedMap[selectedChannel.id] ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Subscribed
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" /> Subscribe
                  </>
                )}
              </Button>
            </div>

            {/* Broadcast Posts */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Announcements & Timeline
              </h3>
              {selectedChannel.posts?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No broadcasts published yet.</p>
              ) : (
                selectedChannel.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 bg-[#090d15] border border-[#1b2438] rounded-2xl space-y-2 shadow-sm"
                  >
                    {post.title && <h4 className="text-sm font-bold text-white">{post.title}</h4>}
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="rounded-xl overflow-hidden max-h-60 bg-black">
                        <img src={post.mediaUrls[0]} alt="Broadcast attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1b2438]">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.post(`/channels/${selectedChannel.id}/posts/${post.id}/react`);
                            if (res.success && res.data?.reactions) {
                              post.reactions = res.data.reactions;
                              setSelectedChannel({ ...selectedChannel });
                            }
                          } catch (e) {
                            console.warn('Failed to react to broadcast post:', e);
                          }
                        }}
                        className="flex items-center gap-1 hover:text-red-400 text-slate-300"
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.reactions && post.reactions.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{post.reactions?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">Select a broadcast channel to view.</div>
        )}
      </div>

      {/* Create Broadcast Channel Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Broadcast Channel">
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <Input label="Channel Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Cyber Aviation Alerts" />
          <Input label="Channel Handle" value={handle} onChange={(e) => setHandle(e.target.value)} required placeholder="aviation-alerts" />
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What will you broadcast?"
              className="w-full bg-[#0c101a] border border-[#1b2438] rounded-xl p-2.5 text-xs text-white resize-none"
            />
          </div>
          <Button type="submit" variant="glow" className="w-full">Create Broadcast Channel</Button>
        </form>
      </Modal>
    </div>
  );
};

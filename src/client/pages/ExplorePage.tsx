import React, { useState, useEffect } from 'react';
import { Search, Compass, Users, Radio, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';
import { Post, User, Community, BroadcastChannel } from '../../shared/types';
import { Avatar } from '../components/common/Avatar';

interface ExplorePageProps {
  onOpenProfile?: (username: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onOpenProfile }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    users: User[];
    posts: Post[];
    communities: Community[];
    channels: BroadcastChannel[];
  }>({ users: [], posts: [], communities: [], channels: [] });
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'communities' | 'channels'>('posts');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      handleSearch(query.trim());
    } else {
      // Default load recent posts
      api.get<Post[]>('/posts/feed?limit=15').then((res) => {
        if (res.success) setResults((prev) => ({ ...prev, posts: res.data }));
      });
    }
  }, [query]);

  const handleSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      if (res.success) {
        setResults(res.data);
      }
    } catch (e) {
      console.warn('Search error', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-8">
      {/* Search Header */}
      <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pilots, posts, #hashtags, communities..."
            className="w-full bg-[#090d15] border border-[#1b2438] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-falcon-blue"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto text-xs">
          {[
            { id: 'posts', label: `Posts (${results.posts.length})`, icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'users', label: `Pilots (${results.users.length})`, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'communities', label: `Communities (${results.communities.length})`, icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'channels', label: `Channels (${results.channels.length})`, icon: <Radio className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-falcon-blue text-white'
                  : 'bg-[#121826] text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-500">Searching Dark Falcon sovereign index...</div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {results.posts.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">No posts matching query.</p>
              ) : (
                results.posts.map((p) => <PostCard key={p.id} post={p} />)
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.users.map((u) => (
                <div key={u.id} className="p-3 bg-[#0c101a] border border-[#1b2438] rounded-2xl flex items-center justify-between">
                  <div
                    onClick={() => onOpenProfile?.(u.username)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Avatar src={u.avatarUrl} alt={u.displayName} size="md" className="group-hover:ring-2 group-hover:ring-falcon-blue/50 transition-all" />
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-falcon-blue transition-colors">{u.displayName}</p>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenProfile?.(u.username)}
                    className="px-3 py-1 bg-falcon-blue/15 hover:bg-falcon-blue text-falcon-blue hover:text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.communities.map((c) => (
                <div key={c.id} className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={c.avatarUrl} alt={c.name} size="md" />
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <span className="text-[10px] text-slate-400">{c.membersCount} members</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{c.description}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.channels.map((ch) => (
                <div key={ch.id} className="p-4 bg-[#0c101a] border border-[#1b2438] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={ch.avatarUrl} alt={ch.name} size="md" />
                    <div>
                      <p className="text-xs font-bold text-white">{ch.name}</p>
                      <span className="text-[10px] text-slate-400">{ch.subscribersCount} subscribers</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{ch.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

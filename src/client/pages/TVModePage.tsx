import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Film,
  Compass,
  Radio,
  Users,
  Sparkles,
  ArrowLeft,
  Play,
  Heart,
  Volume2,
  VolumeX,
  Maximize,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Post, ShortVideo, BroadcastChannel, Community } from '../../shared/types';
import { api } from '../services/api';
import { BrandLogo } from '../components/common/BrandLogo';
import { Avatar } from '../components/common/Avatar';

interface TVModePageProps {
  onExitTV: () => void;
}

export const TVModePage: React.FC<TVModePageProps> = ({ onExitTV }) => {
  const [activeRailIndex, setActiveRailIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'home' | 'reels' | 'channels' | 'communities' | 'ai'>('home');

  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<BroadcastChannel[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeVideoModal, setActiveVideoModal] = useState<ShortVideo | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Load TV Content
  useEffect(() => {
    async function loadTVData() {
      try {
        const [vRes, pRes, chRes, cmRes] = await Promise.all([
          api.get<ShortVideo[]>('/videos'),
          api.get<Post[]>('/posts/feed'),
          api.get<BroadcastChannel[]>('/channels'),
          api.get<Community[]>('/communities'),
        ]);

        if (vRes.success) setVideos(vRes.data);
        if (pRes.success) setPosts(pRes.data);
        if (chRes.success) setChannels(chRes.data);
        if (cmRes.success) setCommunities(cmRes.data);
      } catch (err) {
        console.warn('TV mode data fetch:', err);
      }
    }
    loadTVData();
  }, []);

  // TV D-Pad & Keyboard Remote Navigation (Arrow keys, Enter, Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open
      if (activeVideoModal) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          setActiveVideoModal(null);
        } else if (e.key === 'm' || e.key === 'M') {
          setIsMuted((prev) => !prev);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveRailIndex((prev) => Math.min(prev + 1, 3));
          setActiveItemIndex(0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveRailIndex((prev) => Math.max(prev - 1, 0));
          setActiveItemIndex(0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setActiveItemIndex((prev) => prev + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setActiveItemIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          // Open active selected item
          if (activeRailIndex === 0 && videos[activeItemIndex]) {
            setActiveVideoModal(videos[activeItemIndex]);
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onExitTV();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRailIndex, activeItemIndex, activeVideoModal, videos, onExitTV]);

  return (
    <div className="min-h-screen w-screen bg-[#04060a] text-white overflow-x-hidden select-none flex flex-col font-sans">
      {/* TV Top Bar */}
      <header className="px-10 py-6 flex items-center justify-between border-b border-[#141d30]/60 bg-[#06080e]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <BrandLogo variant="emblem" glow className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-black tracking-wider flex items-center gap-2">
              DARK FALCON <span className="px-2 py-0.5 rounded bg-falcon-blue/20 text-falcon-blue text-xs font-mono">TV 10-FOOT UI</span>
            </h1>
            <p className="text-xs text-slate-400">Remote D-Pad Navigation • Use Arrow Keys & Enter</p>
          </div>
        </div>

        {/* TV Mode Categories */}
        <div className="flex items-center gap-3">
          {[
            { id: 'home', label: 'Home Feed', icon: <Tv className="w-4 h-4" /> },
            { id: 'reels', label: 'Watch & Reels', icon: <Film className="w-4 h-4" /> },
            { id: 'channels', label: 'Broadcast Channels', icon: <Radio className="w-4 h-4" /> },
            { id: 'communities', label: 'Communities', icon: <Users className="w-4 h-4" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-falcon-blue text-white shadow-neon-blue scale-105'
                  : 'bg-[#0f1726] text-slate-400 hover:text-white hover:bg-[#162136]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}

          <button
            onClick={onExitTV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors ml-4"
            title="Exit TV Experience"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit TV Mode
          </button>
        </div>
      </header>

      {/* Main Content Rails */}
      <main className="flex-1 p-10 space-y-12 pb-24">
        {/* Rail 0: Short Video & Reels Rail */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-falcon-blue" />
              Featured Short Videos & Reels
            </h2>
            <span className="text-xs text-slate-500 font-mono">RAIL 1 OF 4</span>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-1">
            {videos.length === 0 ? (
              <div className="text-xs text-slate-500 py-10">Loading Dark Falcon TV reels...</div>
            ) : (
              videos.map((vid, i) => {
                const isFocused = activeRailIndex === 0 && activeItemIndex === i;
                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideoModal(vid)}
                    className={`shrink-0 w-64 h-96 rounded-3xl overflow-hidden relative cursor-pointer transition-all duration-300 ${
                      isFocused
                        ? 'ring-4 ring-falcon-blue scale-105 shadow-2xl z-20 shadow-falcon-blue/30'
                        : 'opacity-80 hover:opacity-100 hover:scale-102 border border-[#1b2438]'
                    }`}
                  >
                    <video
                      src={vid.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-between pointer-events-none">
                      <div className="self-end p-2 rounded-full bg-black/50 backdrop-blur-md">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Avatar src={vid.userAvatar} alt={vid.username} size="xs" />
                          <span className="text-xs font-bold text-white">@{vid.username}</span>
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-2">{vid.caption}</p>
                        <div className="flex items-center gap-1 text-[10px] text-falcon-blue font-mono">
                          <Heart className="w-3 h-3 fill-falcon-blue" />
                          <span>{vid.likesCount} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Rail 1: Top Community Social Posts */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              Sovereign Community Feed
            </h2>
            <span className="text-xs text-slate-500 font-mono">RAIL 2 OF 4</span>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-1">
            {posts.slice(0, 10).map((post, i) => {
              const isFocused = activeRailIndex === 1 && activeItemIndex === i;
              return (
                <div
                  key={post.id}
                  className={`shrink-0 w-80 h-60 rounded-3xl p-5 bg-[#090e18] border transition-all duration-300 flex flex-col justify-between ${
                    isFocused
                      ? 'border-falcon-blue ring-4 ring-falcon-blue scale-105 shadow-2xl z-20'
                      : 'border-[#1b2438] hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={post.userAvatar} alt={post.username} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{post.userDisplayName}</h4>
                        <span className="text-[10px] text-slate-400">@{post.username}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{post.content}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#141d30] text-[11px] text-slate-400">
                    <span>{post.reactions?.length || post.likesCount || 0} Reactions</span>
                    <span>{post.commentsCount || 0} Comments</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rail 2: Broadcast Channels */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              Live Falcon Channels & Spaces
            </h2>
            <span className="text-xs text-slate-500 font-mono">RAIL 3 OF 4</span>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar py-2 px-1">
            {channels.map((chan, i) => {
              const isFocused = activeRailIndex === 2 && activeItemIndex === i;
              return (
                <div
                  key={chan.id}
                  className={`shrink-0 w-72 h-44 rounded-3xl p-5 bg-gradient-to-br from-[#0c1220] to-[#080b12] border transition-all duration-300 flex flex-col justify-between ${
                    isFocused
                      ? 'border-amber-400 ring-4 ring-amber-400/50 scale-105 shadow-2xl z-20'
                      : 'border-[#1b2438]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        Broadcast
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{chan.subscribersCount} Subscribed</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{chan.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{chan.description}</p>
                  </div>
                  <div className="text-[10px] text-falcon-blue font-semibold">@{chan.handle}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rail 3: Dark Falcon AI Quick Actions */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Dark Falcon AI Voice & Quick Actions
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {[
              {
                title: 'Daily Sovereign Executive Brief',
                desc: 'Generate a 60-second summary of top platform news & cyber updates.',
                action: 'Brief Me',
              },
              {
                title: 'Trending Technical Discussions',
                desc: 'Surface the most engaged community threads in cryptography & AI.',
                action: 'Explore Now',
              },
              {
                title: 'System Security Health Check',
                desc: 'Verify E2EE encryption status, token integrity, and active sessions.',
                action: 'Run Audit',
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-[#090d16] border border-[#1b2438] hover:border-falcon-blue transition-all space-y-3"
              >
                <h3 className="text-base font-bold text-white">{card.title}</h3>
                <p className="text-xs text-slate-400">{card.desc}</p>
                <button className="px-4 py-2 rounded-xl bg-falcon-blue/20 hover:bg-falcon-blue text-falcon-blue hover:text-white text-xs font-bold transition-colors">
                  {card.action} →
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Fullscreen Video Modal for TV */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[85vh] rounded-3xl overflow-hidden border-2 border-falcon-blue bg-black shadow-2xl">
            <video
              src={activeVideoModal.videoUrl}
              autoPlay
              controls
              muted={isMuted}
              className="w-full h-full object-contain max-h-[75vh]"
            />
            <div className="p-4 bg-[#090d15] flex items-center justify-between border-t border-[#1b2438]">
              <div>
                <h3 className="text-sm font-bold text-white">@{activeVideoModal.username}</h3>
                <p className="text-xs text-slate-300">{activeVideoModal.caption}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-[#121826] text-white hover:bg-[#1b2438]"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/40 text-xs font-bold"
                >
                  Close (Back/Esc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

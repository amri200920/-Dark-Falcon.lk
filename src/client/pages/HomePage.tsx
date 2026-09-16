import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users } from 'lucide-react';
import { Post, Story } from '../../shared/types';
import { api } from '../services/api';
import { PostCard } from '../components/feed/PostCard';
import { StoryTray } from '../components/stories/StoryTray';
import { StoryViewer } from '../components/stories/StoryViewer';
import { CreateStoryModal } from '../components/stories/CreateStoryModal';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onOpenCreatePost: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenProfile?: (username: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenCreatePost, onNavigateTab, onOpenProfile }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');

  // Story viewer state
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [feedTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const feedEndpoint = feedTab === 'following'
        ? '/posts/following?limit=25'
        : '/posts/feed?limit=25';

      const [postRes, storyRes] = await Promise.all([
        api.get<Post[]>(feedEndpoint),
        api.get<Story[]>('/stories'),
      ]);

      if (postRes.success) setPosts(postRes.data);
      if (storyRes.success) setStories(storyRes.data);
    } catch (e) {
      console.warn('Failed to load feed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto flex gap-6 pb-20 md:pb-8">
      {/* Center Feed Column */}
      <div className="flex-1 max-w-2xl w-full mx-auto space-y-4">
        {/* Feed Tab Switcher */}
        <div className="flex items-center bg-[#0c101a] border border-[#1b2438] rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setFeedTab('forYou')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              feedTab === 'forYou'
                ? 'bg-falcon-blue text-white shadow-neon-blue'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✦ For You
          </button>
          <button
            onClick={() => setFeedTab('following')}
            disabled={!user}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
              feedTab === 'following'
                ? 'bg-falcon-blue text-white shadow-neon-blue'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👥 Following
          </button>
        </div>

        {/* 24-Hour Ephemeral Stories Tray */}
        <StoryTray
          stories={stories}
          onOpenStory={(idx) => setSelectedStoryIndex(idx)}
          onAddStory={() => setIsCreateStoryOpen(true)}
        />

        {/* Quick Post Prompt */}
        {user && (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            <button
              onClick={onOpenCreatePost}
              className="flex-1 text-left bg-[#090d15] hover:bg-[#121826] border border-[#1b2438] rounded-xl px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Share what's happening on Dark Falcon...
            </button>
            <Button variant="glow" size="sm" onClick={onOpenCreatePost}>
              Post
            </Button>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 space-y-3">
                {/* Header skeleton */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full skeleton-shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded-full skeleton-shimmer" />
                    <div className="h-2 w-16 rounded-full skeleton-shimmer" />
                  </div>
                </div>
                {/* Content skeleton */}
                <div className="space-y-2">
                  <div className="h-3 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-4/5 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-3/5 rounded-full skeleton-shimmer" />
                </div>
                {/* Image skeleton */}
                {i === 1 && <div className="h-48 rounded-xl skeleton-shimmer" />}
                {/* Actions skeleton */}
                <div className="flex items-center gap-4 pt-1">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 w-12 rounded-full skeleton-shimmer" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-8 text-center text-slate-400">
            {feedTab === 'following' ? (
              <>
                <p className="text-sm font-semibold mb-2">No posts from people you follow</p>
                <p className="text-xs text-slate-500 mb-4">Follow more pilots to see their posts here!</p>
                <Button variant="glow" size="sm" onClick={() => setFeedTab('forYou')}>
                  Browse For You Feed
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold mb-2">No posts yet in your feed</p>
                <p className="text-xs text-slate-500 mb-4">Be the first to publish or follow other pilots!</p>
                <Button variant="glow" size="sm" onClick={onOpenCreatePost}>
                  Create First Post
                </Button>
              </>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} onOpenProfile={onOpenProfile} />
          ))
        )}
      </div>

      {/* Right Column: Trending & Suggested */}
      <div className="hidden lg:block w-80 shrink-0 space-y-4">
        {/* Falcon AI Banner */}
        <div className="bg-gradient-to-br from-[#0c101a] to-[#121826] border border-falcon-blue/30 rounded-2xl p-4 shadow-neon-blue">
          <div className="flex items-center gap-2 text-falcon-blue font-bold text-sm mb-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Dark Falcon AI 🦅</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Boost your reach with server-side Gemini captions, translations, and hashtag intelligence.
          </p>
          <button
            onClick={() => onNavigateTab('ai')}
            className="w-full py-2 bg-falcon-blue/20 hover:bg-falcon-blue/30 border border-falcon-blue/40 text-falcon-blue font-semibold text-xs rounded-xl transition-colors"
          >
            Launch Neural AI Assistant
          </button>
        </div>

        {/* Trending Hashtags */}
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
            <TrendingUp className="w-4 h-4 text-falcon-blue" />
            <span>Trending in the Skies</span>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              { tag: '#DarkFalcon', count: '14.2K posts' },
              { tag: '#WebRTC', count: '8.4K posts' },
              { tag: '#GeminiAI', count: '6.1K posts' },
              { tag: '#SovereignNet', count: '3.9K posts' },
              { tag: '#CyberFalcon', count: '2.5K posts' },
            ].map((t) => (
              <div
                key={t.tag}
                onClick={() => onNavigateTab('explore')}
                className="flex items-center justify-between hover:bg-[#121826] p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <span className="font-semibold text-slate-200 text-falcon-blue hover:underline">
                  {t.tag}
                </span>
                <span className="text-[11px] text-slate-500">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Creators */}
        <div className="bg-[#0c101a] border border-[#1b2438] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Featured Aviators</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Dark Falcon HQ 🦅', username: 'darkfalcon_admin', role: 'Official' },
              { name: 'Falcon Aviator', username: 'cyber_falcon', role: 'Pilot' },
            ].map((u) => (
              <div key={u.username} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">{u.name}</p>
                  <p className="text-[11px] text-slate-500">@{u.username}</p>
                </div>
                <button
                  onClick={() => alert(`Following @${u.username}`)}
                  className="px-2.5 py-1 bg-falcon-blue/15 hover:bg-falcon-blue text-falcon-blue hover:text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
};

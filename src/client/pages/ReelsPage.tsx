import React, { useState, useEffect } from 'react';
import { ShortVideo } from '../../shared/types';
import { api } from '../services/api';
import { ShortVideoPlayer } from '../components/reels/ShortVideoPlayer';
import { CreateReelModal } from '../components/reels/CreateReelModal';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ReelsPage: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);

  useEffect(() => {
    async function loadVideos() {
      try {
        const res = await api.get<ShortVideo[]>('/videos');
        if (res.success) setVideos(res.data);
      } catch (e) {
        console.warn('Failed to load short videos', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadVideos();
  }, []);

  const handleReelCreated = (newVideo: ShortVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-xs text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-falcon-blue mr-2" />
        Loading Dark Falcon Reels...
      </div>
    );
  }

  return (
    <div className="py-2 relative">
      <ShortVideoPlayer videos={videos} />

      {/* Floating Create Reel Button */}
      {user && (
        <button
          onClick={() => setIsCreateReelOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex items-center gap-2 px-4 py-2.5 bg-falcon-blue hover:bg-falcon-blue-dark text-white rounded-full shadow-neon-blue font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          title="Create a Reel"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Create Reel</span>
        </button>
      )}

      <CreateReelModal
        isOpen={isCreateReelOpen}
        onClose={() => setIsCreateReelOpen(false)}
        onReelCreated={handleReelCreated}
      />
    </div>
  );
};

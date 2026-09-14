import React, { useState, useEffect } from 'react';
import { ShortVideo } from '../../shared/types';
import { api } from '../services/api';
import { ShortVideoPlayer } from '../components/reels/ShortVideoPlayer';
import { RefreshCw } from 'lucide-react';

export const ReelsPage: React.FC = () => {
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-xs text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-falcon-blue mr-2" />
        Loading Dark Falcon Reels...
      </div>
    );
  }

  return (
    <div className="py-2">
      <ShortVideoPlayer videos={videos} />
    </div>
  );
};

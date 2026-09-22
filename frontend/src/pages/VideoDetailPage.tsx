import React, { useState, useEffect } from 'react';
import { VideoPlayer } from '../components/player/VideoPlayer';
import type { VideoDetail, SearchResult } from '../types';
import { getVideoDetails } from '../services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface VideoDetailPageProps {
  videoId: string;
  targetTimestamp?: number;
  matchedResult?: SearchResult;
  onBack: () => void;
}

export const VideoDetailPage: React.FC<VideoDetailPageProps> = ({
  videoId,
  targetTimestamp = 0,
  matchedResult,
  onBack,
}) => {
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getVideoDetails(videoId)
      .then((data) => {
        if (isMounted) setVideo(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load video details');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
        <RefreshCw className="w-8 h-8 text-iqoo-yellow animate-spin" />
        <span className="text-xs text-iqoo-textSecondary">Loading video data & multimodal extractions...</span>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-6 m-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <span className="font-semibold">{error || 'Video not found'}</span>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-1 animate-fadeIn pb-12">
      <VideoPlayer
        video={video}
        targetTimestamp={targetTimestamp}
        matchedResult={matchedResult}
        onBack={onBack}
      />
    </div>
  );
};

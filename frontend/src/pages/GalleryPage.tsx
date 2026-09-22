import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Film, Sparkles, RefreshCw, 
  Layers, Mic, ScanText, CheckCircle2, AlertCircle, Play, ChevronRight 
} from 'lucide-react';
import type { VideoMetadata, SystemDiagnostics } from '../types';
import { listVideos, uploadVideo, getDiagnostics, seedDemoData, resolveMediaUrl } from '../services/api';
import { formatTimestamp } from '../components/search/SearchResultCard';

interface GalleryPageProps {
  onSelectVideo: (video: VideoMetadata) => void;
  onNavigateToSearch: (query?: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  onSelectVideo,
  onNavigateToSearch,
}) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'indexed' | 'processing'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [videoList, diag] = await Promise.all([
        listVideos(),
        getDiagnostics().catch(() => null)
      ]);
      setVideos(videoList);
      if (diag) setDiagnostics(diag);
    } catch (err) {
      console.error('Failed to load gallery data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const videoList = await listVideos();
        setVideos(videoList);
        const hasProcessing = videoList.some(v => v.indexing_status === 'processing');
        if (!hasProcessing) {
          getDiagnostics().then(setDiagnostics).catch(() => {});
        }
      } catch (e) {}
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      await uploadVideo(file);
      setUploadProgress(`Processing ${file.name} with Multimodal AI...`);
      await fetchData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReseed = async () => {
    try {
      setIsLoading(true);
      await seedDemoData();
      await fetchData();
    } catch (err) {
      alert('Failed to reset demo dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVideos = videos.filter((v) => {
    if (filter === 'indexed') return v.is_indexed;
    if (filter === 'processing') return v.indexing_status === 'processing';
    return true;
  });

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-iqoo-yellow font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Multimodal Video Gallery</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Personal Moments
          </h1>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-iqoo-yellow text-black font-semibold text-xs shadow-glow-yellow hover:scale-105 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isUploading ? 'Indexing...' : 'Import Video'}</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Notification */}
      {isUploading && (
        <div className="p-3 rounded-xl bg-iqoo-elevated border border-iqoo-yellow/30 flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-4 h-4 text-iqoo-yellow animate-spin" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">{uploadProgress}</span>
            <span className="text-[10px] text-iqoo-textSecondary">
              Extracting keyframes • ASR Whisper • EasyOCR • Vector Clustering
            </span>
          </div>
        </div>
      )}

      {/* Quick Stats Overview */}
      {diagnostics && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-iqoo-card/80 border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center text-center">
            <Film className="w-3.5 h-3.5 text-iqoo-yellow mb-1" />
            <span className="text-sm font-bold text-white">{diagnostics.total_videos}</span>
            <span className="text-[9px] text-iqoo-textMuted uppercase tracking-tight">Videos</span>
          </div>
          <div className="bg-iqoo-card/80 border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center text-center">
            <Layers className="w-3.5 h-3.5 text-cyan-400 mb-1" />
            <span className="text-sm font-bold text-white">{diagnostics.total_frames_analyzed}</span>
            <span className="text-[9px] text-iqoo-textMuted uppercase tracking-tight">Keyframes</span>
          </div>
          <div className="bg-iqoo-card/80 border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center text-center">
            <Mic className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <span className="text-sm font-bold text-white">{diagnostics.total_speech_segments}</span>
            <span className="text-[9px] text-iqoo-textMuted uppercase tracking-tight">Speech</span>
          </div>
          <div className="bg-iqoo-card/80 border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center text-center">
            <ScanText className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-sm font-bold text-white">{diagnostics.total_ocr_regions}</span>
            <span className="text-[9px] text-iqoo-textMuted uppercase tracking-tight">OCR Text</span>
          </div>
        </div>
      )}

      {/* Search Prompt Callout */}
      <div 
        onClick={() => onNavigateToSearch()}
        className="bg-gradient-to-r from-iqoo-yellow/15 via-iqoo-card to-iqoo-card border border-iqoo-yellow/30 hover:border-iqoo-yellow/70 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-iqoo-yellow/20 flex items-center justify-center text-iqoo-yellow group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 fill-iqoo-yellow" />
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-iqoo-yellow transition-colors">
              Natural Language Omni Search
            </div>
            <p className="text-[11px] text-iqoo-textSecondary">
              Find exact spoken lines, slide text, or scenes instantly
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-iqoo-yellow group-hover:translate-x-1 transition-transform" />
      </div>

      {/* Filter Tabs & Reseed Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white/15 text-white font-semibold'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            All ({videos.length})
          </button>
          <button
            onClick={() => setFilter('indexed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'indexed'
                ? 'bg-white/15 text-white font-semibold'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            Indexed ({videos.filter((v) => v.is_indexed).length})
          </button>
        </div>

        <button
          onClick={handleReseed}
          title="Reset pre-indexed demo videos"
          className="flex items-center gap-1 text-[11px] text-iqoo-textMuted hover:text-iqoo-yellow transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-iqoo-card/50 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredVideos.map((video) => (
            <div
              key={video.video_id}
              onClick={() => onSelectVideo(video)}
              className="group bg-iqoo-card hover:bg-iqoo-elevated border border-white/[0.08] hover:border-iqoo-yellow/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-card-subtle flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                <img
                  src={resolveMediaUrl(video.thumbnail_url)}
                  alt={video.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                
                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono font-semibold text-white/90">
                  {formatTimestamp(video.duration)}
                </span>

                {/* Resolution Badge */}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/70">
                  {video.resolution}
                </span>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-iqoo-yellow text-black flex items-center justify-center shadow-glow-yellow">
                    <Play className="w-5 h-5 fill-black translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-iqoo-yellow transition-colors truncate">
                    {video.filename}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-iqoo-textMuted">
                    <span>{(video.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                    <span>•</span>
                    <span>{video.fps.toFixed(0)} FPS</span>
                  </div>
                </div>

                {/* Indexing Status Tag */}
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                  {video.is_indexed ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Multimodal Indexed</span>
                    </div>
                  ) : video.indexing_status === 'processing' ? (
                    <div className="flex items-center gap-1 text-iqoo-yellow text-[10px] font-medium animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Indexing Video...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      <span>Pending Index</span>
                    </div>
                  )}

                  <span className="text-[10px] font-semibold text-iqoo-yellow group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Explore
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-iqoo-card/40 rounded-2xl border border-white/[0.06] flex flex-col items-center gap-3">
          <Film className="w-10 h-10 text-iqoo-textMuted" />
          <p className="text-xs text-iqoo-textSecondary">No videos found matching filter.</p>
          <button
            onClick={handleReseed}
            className="px-4 py-2 rounded-xl bg-iqoo-yellow text-black font-semibold text-xs shadow-glow-yellow"
          >
            Load Sample Videos
          </button>
        </div>
      )}
    </div>
  );
};

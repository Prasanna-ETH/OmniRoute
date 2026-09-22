import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, 
  ArrowLeft, Clock, Mic, ScanText, Eye 
} from 'lucide-react';
import type { VideoDetail, SearchResult } from '../../types';
import { getVideoStreamUrl, resolveMediaUrl } from '../../services/api';
import { formatTimestamp } from '../search/SearchResultCard';

interface VideoPlayerProps {
  video: VideoDetail;
  targetTimestamp?: number;
  matchedResult?: SearchResult;
  onBack: () => void;
  onSeekTo?: (timestamp: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  targetTimestamp = 0,
  matchedResult,
  onBack,
  onSeekTo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(targetTimestamp);
  const [duration, setDuration] = useState<number>(video.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'transcripts' | 'ocr' | 'keyframes'>('evidence');
  const [seekNotice, setSeekNotice] = useState<string | null>(null);

  // Auto-seek to targetTimestamp on mount or change
  useEffect(() => {
    if (videoRef.current && targetTimestamp !== undefined) {
      videoRef.current.currentTime = targetTimestamp;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setSeekNotice(`Jumped to exact moment: ${formatTimestamp(targetTimestamp)}`);
      const timer = setTimeout(() => setSeekNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [targetTimestamp, video.video_id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || video.duration);
      if (targetTimestamp > 0) {
        videoRef.current.currentTime = targetTimestamp;
      }
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (onSeekTo) onSeekTo(seconds);
    }
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  // Calculate timeline marker position percentage
  const markerPercent = duration > 0 ? (targetTimestamp / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 w-full animate-fadeIn">
      {/* Top back navigation header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-iqoo-textSecondary hover:text-white transition-colors py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <span className="text-xs font-semibold text-white/90 truncate max-w-[220px]">
          {video.filename}
        </span>
      </div>

      {/* Video Viewport Container */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        <video
          ref={videoRef}
          src={getVideoStreamUrl(video.video_id)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          playsInline
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />

        {/* Temporary Seek Notice Badge */}
        {seekNotice && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-iqoo-yellow text-black text-xs font-bold shadow-glow-yellow flex items-center gap-1.5 animate-bounce z-20">
            <Clock className="w-3.5 h-3.5" />
            <span>{seekNotice}</span>
          </div>
        )}

        {/* Center play button on pause */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 border border-iqoo-yellow/50 text-iqoo-yellow flex items-center justify-center backdrop-blur-sm shadow-xl hover:scale-110 transition-transform z-10"
          >
            <Play className="w-6 h-6 fill-iqoo-yellow translate-x-0.5" />
          </button>
        )}

        {/* Video Scrubber & Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5 z-20 opacity-95 group-hover:opacity-100 transition-opacity">
          {/* Custom scrubber with matched moment marker pin */}
          <div className="relative w-full flex items-center h-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleScrubberChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-iqoo-yellow focus:outline-none"
            />
            {/* Target moment marker pin on timeline */}
            {targetTimestamp > 0 && (
              <div
                style={{ left: `${Math.min(98, Math.max(2, markerPercent))}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(targetTimestamp);
                }}
                title={`Matched Moment at ${formatTimestamp(targetTimestamp)}`}
                className="absolute -top-2.5 -translate-x-1/2 flex flex-col items-center cursor-pointer group/pin z-30"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-iqoo-yellow ring-2 ring-black shadow-glow-yellow animate-pulse" />
                <div className="w-0.5 h-2 bg-iqoo-yellow" />
                <span className="hidden group-hover/pin:block absolute -top-5 px-1 py-0.2 rounded bg-iqoo-yellow text-black text-[9px] font-bold whitespace-nowrap shadow-sm">
                  {formatTimestamp(targetTimestamp)}
                </span>
              </div>
            )}
          </div>

          {/* Time & playback buttons */}
          <div className="flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-iqoo-yellow transition-colors">
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <button onClick={() => seekTo(0)} className="hover:text-iqoo-yellow transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="hover:text-iqoo-yellow transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-iqoo-textSecondary">
                <span className="text-white font-semibold">{formatTimestamp(currentTime)}</span> / {formatTimestamp(duration)}
              </span>
            </div>

            {/* Target Moment indicator */}
            {targetTimestamp > 0 && (
              <button
                onClick={() => seekTo(targetTimestamp)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-iqoo-yellow/20 border border-iqoo-yellow/40 text-iqoo-yellow text-[10px] font-bold hover:bg-iqoo-yellow/30 transition-colors"
              >
                <span>Jump to {formatTimestamp(targetTimestamp)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Multimodal Information Tabs */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'evidence'
                ? 'bg-iqoo-yellow text-black'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            Matched Evidence
          </button>
          <button
            onClick={() => setActiveTab('transcripts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transcripts'
                ? 'bg-iqoo-yellow text-black'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            Transcripts ({video.transcripts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ocr'
                ? 'bg-iqoo-yellow text-black'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            OCR Text ({video.ocr_detections?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('keyframes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'keyframes'
                ? 'bg-iqoo-yellow text-black'
                : 'text-iqoo-textSecondary hover:text-white'
            }`}
          >
            Keyframes ({video.keyframes?.length || 0})
          </button>
        </div>

        {/* Tab 1: Matched Evidence Details */}
        {activeTab === 'evidence' && (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Why This Moment Matched:</span>
              <span className="text-[11px] font-mono text-iqoo-yellow bg-iqoo-yellow/10 px-2 py-0.5 rounded-md border border-iqoo-yellow/20">
                Seek Target: {formatTimestamp(targetTimestamp)}
              </span>
            </div>

            {matchedResult ? (
              <div className="flex flex-col gap-2.5">
                {matchedResult.reason.speech && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speech Matched</span>
                    </div>
                    <p className="text-white/90 italic">"{matchedResult.reason.speech}"</p>
                  </div>
                )}

                {matchedResult.reason.ocr && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                      <ScanText className="w-3.5 h-3.5" />
                      <span>On-Screen Text Matched</span>
                    </div>
                    <p className="text-white/90 font-mono text-[11px]">{matchedResult.reason.ocr}</p>
                  </div>
                )}

                {matchedResult.reason.visual && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visual Scene Matched</span>
                    </div>
                    <p className="text-white/90">{matchedResult.reason.visual}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-iqoo-textSecondary">
                Playing from moment {formatTimestamp(targetTimestamp)}. Tap any transcript or keyframe below to jump.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Transcripts list */}
        {activeTab === 'transcripts' && (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {video.transcripts && video.transcripts.length > 0 ? (
              video.transcripts.map((t) => {
                const isCurrent = currentTime >= t.start_time && currentTime <= t.end_time;
                return (
                  <div
                    key={t.id}
                    onClick={() => seekTo(t.start_time)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-iqoo-yellow/15 border-iqoo-yellow/50 text-white font-medium'
                        : 'bg-iqoo-elevated/40 border-white/[0.05] text-iqoo-textSecondary hover:bg-iqoo-elevated hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-iqoo-yellow font-bold shrink-0 mt-0.5">
                      {formatTimestamp(t.start_time)}
                    </span>
                    <p className="flex-1">{t.text}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-iqoo-textMuted py-4 text-center">No speech transcript extracted.</p>
            )}
          </div>
        )}

        {/* Tab 3: OCR Detections list */}
        {activeTab === 'ocr' && (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {video.ocr_detections && video.ocr_detections.length > 0 ? (
              video.ocr_detections.map((o) => (
                <div
                  key={o.id}
                  onClick={() => seekTo(o.timestamp)}
                  className="p-2.5 rounded-xl border border-white/[0.06] bg-iqoo-elevated/40 hover:bg-iqoo-elevated text-xs cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <ScanText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-white/90 font-mono text-[11px]">{o.text}</span>
                  </div>
                  <span className="font-mono text-[10px] text-iqoo-yellow font-bold shrink-0">
                    {formatTimestamp(o.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-iqoo-textMuted py-4 text-center">No on-screen text regions detected.</p>
            )}
          </div>
        )}

        {/* Tab 4: Keyframes gallery */}
        {activeTab === 'keyframes' && (
          <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {video.keyframes && video.keyframes.length > 0 ? (
              video.keyframes.map((k) => (
                <div
                  key={k.id}
                  onClick={() => seekTo(k.timestamp)}
                  className="group/frame relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-iqoo-yellow cursor-pointer transition-all"
                >
                  <img
                    src={resolveMediaUrl(k.frame_url)}
                    alt={`Frame at ${k.timestamp}s`}
                    className="w-full h-full object-cover group-hover/frame:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-iqoo-yellow font-bold">
                    {formatTimestamp(k.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-iqoo-textMuted py-4 text-center col-span-3">No keyframes available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Mic, ScanText, Eye, ChevronRight, Clock } from 'lucide-react';
import type { SearchResult } from '../../types';
import { resolveMediaUrl } from '../../services/api';

interface SearchResultCardProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  rank?: number;
}

export const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onSelect,
  rank,
}) => {
  const hasSpeech = result.matched_modalities.includes('speech');
  const hasOCR = result.matched_modalities.includes('ocr');
  const hasVisual = result.matched_modalities.includes('visual');

  return (
    <div
      onClick={() => onSelect(result)}
      className="group bg-iqoo-card hover:bg-iqoo-elevated border border-white/[0.08] hover:border-iqoo-yellow/50 rounded-2xl p-3.5 transition-all duration-300 cursor-pointer shadow-card-subtle flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Top bar: Video info & Exact Timestamp badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-iqoo-textSecondary">
              {rank}
            </span>
          )}
          <span className="text-xs font-semibold text-white/90 truncate max-w-[200px]">
            {result.filename}
          </span>
        </div>

        {/* Prominent Exact Timestamp Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-iqoo-yellow/10 border border-iqoo-yellow/30 text-iqoo-yellow font-mono text-xs font-bold shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimestamp(result.timestamp)}</span>
        </div>
      </div>

      {/* Center: Thumbnail + Play Overlay + Matched Evidence */}
      <div className="flex gap-3">
        {/* Video Thumbnail */}
        <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10 group-hover:border-iqoo-yellow/40 transition-colors">
          <img
            src={resolveMediaUrl(result.thumbnail_url)}
            alt={result.filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-iqoo-yellow/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-black translate-x-0.5" />
            </div>
          </div>
          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white/90">
            {formatTimestamp(result.timestamp)}
          </span>
        </div>

        {/* Matched modalities & snippet */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          {/* Matched Sources Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasSpeech && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                <Mic className="w-3 h-3" />
                <span>Speech</span>
              </span>
            )}
            {hasOCR && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
                <ScanText className="w-3 h-3" />
                <span>On-Screen</span>
              </span>
            )}
            {hasVisual && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                <Eye className="w-3 h-3" />
                <span>Visual</span>
              </span>
            )}
          </div>

          {/* Snippet preview */}
          <p className="text-xs text-iqoo-textSecondary line-clamp-2 mt-1 leading-relaxed">
            {result.transcript_snippet || result.detected_text || result.reason.visual || "Relevant moment matched"}
          </p>

          {/* Score & Seek action */}
          <div className="flex items-center justify-between mt-1 text-[11px] text-iqoo-yellow">
            <span className="text-iqoo-textMuted font-mono text-[10px]">
              RRF Score: {(result.score * 100).toFixed(1)}%
            </span>
            <div className="flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
              <span>Open Moment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Multimodal evidence explanation breakdown */}
      {(result.reason.speech || result.reason.ocr || result.reason.visual) && (
        <div className="pt-2 border-t border-white/[0.05] flex flex-col gap-1 text-[11px]">
          {result.reason.speech && (
            <div className="flex items-start gap-1.5 text-blue-300/90">
              <Mic className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span className="italic line-clamp-1">"{result.reason.speech}"</span>
            </div>
          )}
          {result.reason.ocr && (
            <div className="flex items-start gap-1.5 text-amber-300/90">
              <ScanText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span className="font-mono text-[10px] line-clamp-1">{result.reason.ocr}</span>
            </div>
          )}
          {result.reason.visual && (
            <div className="flex items-start gap-1.5 text-cyan-300/90">
              <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
              <span className="line-clamp-1">{result.reason.visual}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

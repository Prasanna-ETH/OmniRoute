import React, { useState, useEffect } from 'react';
import { 
  Search, Sparkles, Zap, ShieldCheck, AlertCircle 
} from 'lucide-react';
import type { SearchResult, SearchResponse, ModalityType } from '../types';
import { searchVideos } from '../services/api';
import { SearchBar } from '../components/search/SearchBar';
import { FilterChips } from '../components/search/FilterChips';
import { SearchResultCard } from '../components/search/SearchResultCard';

interface SearchPageProps {
  initialQuery?: string;
  onSelectResult: (result: SearchResult) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  onSelectResult,
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [activeModality, setActiveModality] = useState<ModalityType>('all');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (searchQuery: string, modality: ModalityType = activeModality) => {
    if (!searchQuery.trim()) {
      setSearchResponse(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await searchVideos(searchQuery.trim(), modality, 10);
      setSearchResponse(response);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to complete search query');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery, activeModality);
    }
  }, [initialQuery]);

  const handleModalityChange = (modality: ModalityType) => {
    setActiveModality(modality);
    if (query.trim()) {
      executeSearch(query, modality);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResponse(null);
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 animate-fadeIn pb-12">
      {/* Title & Brand Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-iqoo-yellow font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>On-Device Multimodal Neural Search</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Private</span>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          OMNI SEARCH
        </h1>
        <p className="text-xs text-iqoo-textSecondary">
          Find any moment across spoken words, on-screen text, and visual scenes.
        </p>
      </div>

      {/* Hero Search Bar */}
      <SearchBar
        query={query}
        onChange={setQuery}
        onSearch={(q) => executeSearch(q, activeModality)}
        onClear={handleClear}
        isLoading={isLoading}
        showSuggestions={true}
      />

      {/* Modality Filter Chips */}
      <div className="pt-1">
        <FilterChips
          currentFilter={activeModality}
          onFilterChange={handleModalityChange}
        />
      </div>

      {/* Latency & Telemetry Banner (when results available) */}
      {searchResponse && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-iqoo-card border border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-mono font-semibold">
              {searchResponse.search_latency_ms} ms
            </span>
            <span className="text-iqoo-textMuted">•</span>
            <span className="text-iqoo-textSecondary font-medium">
              {searchResponse.hardware_acceleration}
            </span>
          </div>

          <span className="text-[11px] text-iqoo-yellow font-mono font-bold">
            {searchResponse.total_results} moment{searchResponse.total_results === 1 ? '' : 's'} found
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-iqoo-card/60 border border-white/5 animate-pulse p-4 flex gap-3"
            >
              <div className="w-32 h-full bg-white/5 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results List */}
      {!isLoading && searchResponse && searchResponse.results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-iqoo-textSecondary px-1">
            <span className="font-medium">Ranked Moments (RRF Fusion)</span>
            <span className="text-[11px] text-iqoo-textMuted">Tap to jump & play</span>
          </div>

          {searchResponse.results.map((result, idx) => (
            <SearchResultCard
              key={`${result.video_id}-${result.timestamp}-${idx}`}
              result={result}
              rank={idx + 1}
              onSelect={onSelectResult}
            />
          ))}
        </div>
      )}

      {/* Empty State / No Results */}
      {!isLoading && searchResponse && searchResponse.results.length === 0 && (
        <div className="p-8 text-center bg-iqoo-card/40 rounded-2xl border border-white/[0.06] flex flex-col items-center gap-2">
          <Search className="w-10 h-10 text-iqoo-textMuted mb-1" />
          <h3 className="text-sm font-semibold text-white">No exact moments found</h3>
          <p className="text-xs text-iqoo-textSecondary max-w-xs">
            Try searching for words like "battery", "cybersecurity", "car", or "dog".
          </p>
        </div>
      )}

      {/* Initial Landing Hints */}
      {!searchResponse && !isLoading && (
        <div className="mt-2 p-4 rounded-2xl bg-iqoo-card/40 border border-white/[0.06] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Zap className="w-4 h-4 text-iqoo-yellow" />
            <span>How Multimodal Omni-Search Works:</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center gap-1">
              <span className="font-bold text-blue-400 text-[11px]">Speech ASR</span>
              <span className="text-[10px] text-iqoo-textSecondary">Spoken sentences & dialog</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center gap-1">
              <span className="font-bold text-amber-400 text-[11px]">OCR Engine</span>
              <span className="text-[10px] text-iqoo-textSecondary">Text on slides & signs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center gap-1">
              <span className="font-bold text-cyan-400 text-[11px]">Vision Embeddings</span>
              <span className="text-[10px] text-iqoo-textSecondary">Objects, scenes, actions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

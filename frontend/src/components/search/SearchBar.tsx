import React from 'react';
import { Search, X, Sparkles, Loader2 } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onChange: (val: string) => void;
  onSearch: (q: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  showSuggestions?: boolean;
}

export const SUGGESTIONS = [
  { label: 'Battery savings', query: 'Find the slide about battery savings', icon: '🔋' },
  { label: 'Cybersecurity', query: 'Find where someone talks about cybersecurity', icon: '🛡️' },
  { label: 'Q4 Revenue', query: 'Find the slide containing Q4', icon: '📊' },
  { label: 'Red car', query: 'Show me where the red car appears', icon: '🚗' },
  { label: 'Dog running', query: 'Find the moment where the dog is running', icon: '🐕' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  showSuggestions = true,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-iqoo-yellow">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-iqoo-yellow" />
            ) : (
              <Search className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search your video library..."
            className="w-full pl-12 pr-12 py-3.5 bg-iqoo-card/90 border border-white/10 rounded-2xl text-sm text-white placeholder-iqoo-textMuted focus:outline-none focus:border-iqoo-yellow/60 focus:ring-2 focus:ring-iqoo-yellow/20 transition-all shadow-card-subtle backdrop-blur-md"
          />

          {query ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3.5 p-1 rounded-full text-iqoo-textMuted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute right-3.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] text-iqoo-textMuted pointer-events-none">
              <Sparkles className="w-3 h-3 text-iqoo-yellow" />
              <span>Omni</span>
            </div>
          )}
        </div>
      </form>

      {showSuggestions && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <span className="text-[10px] uppercase font-bold tracking-wider text-iqoo-textMuted shrink-0 mr-1">
            Try:
          </span>
          {SUGGESTIONS.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(item.query);
                onSearch(item.query);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-iqoo-elevated/70 border border-white/[0.08] hover:border-iqoo-yellow/40 hover:bg-iqoo-elevated text-iqoo-textSecondary hover:text-white transition-all shrink-0 active:scale-95"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

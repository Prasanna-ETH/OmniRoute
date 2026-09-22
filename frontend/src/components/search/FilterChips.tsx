import React from 'react';
import { Mic, ScanText, Eye, Layers } from 'lucide-react';
import type { ModalityType } from '../../types';

interface FilterChipsProps {
  currentFilter: ModalityType;
  onFilterChange: (filter: ModalityType) => void;
  counts?: {
    all?: number;
    speech?: number;
    ocr?: number;
    visual?: number;
  };
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const chips: { id: ModalityType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All Modalities', icon: Layers },
    { id: 'speech', label: 'Speech', icon: Mic },
    { id: 'ocr', label: 'On-Screen Text', icon: ScanText },
    { id: 'visual', label: 'Visual Scene', icon: Eye },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const isActive = currentFilter === chip.id;
        const count = counts ? counts[chip.id] : undefined;

        return (
          <button
            key={chip.id}
            onClick={() => onFilterChange(chip.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
              isActive
                ? 'bg-iqoo-yellow text-black font-semibold shadow-glow-yellow'
                : 'bg-iqoo-card text-iqoo-textSecondary border border-white/[0.08] hover:border-white/20 hover:text-white'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span>{chip.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/70'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

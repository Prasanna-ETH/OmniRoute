import React from 'react';
import { Film, Search, Cpu, Settings } from 'lucide-react';

export type NavTab = 'gallery' | 'search' | 'npu' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'gallery' as NavTab, label: 'Gallery', icon: Film },
    { id: 'search' as NavTab, label: 'Omni Search', icon: Search, highlight: true },
    { id: 'npu' as NavTab, label: 'NPU Labs', icon: Cpu },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full fixed bottom-0 left-0 right-0 z-40 bg-iqoo-surface/90 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 sm:max-w-md sm:mx-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center group -mt-5"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-iqoo-yellow text-black shadow-glow-yellow scale-105'
                      : 'bg-iqoo-elevated text-iqoo-yellow border border-iqoo-yellow/30 hover:border-iqoo-yellow'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[11px] font-medium mt-1 transition-colors ${
                    isActive ? 'text-iqoo-yellow font-semibold' : 'text-iqoo-textSecondary'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-iqoo-textMuted hover:text-iqoo-textSecondary'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'text-iqoo-yellow scale-110' : 'text-iqoo-textSecondary'
                }`}
              />
              <span
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'text-white font-semibold' : 'text-iqoo-textMuted'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { TopStatusBar } from './TopStatusBar';

interface MobileFrameProps {
  children: React.ReactNode;
  npuActive?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, npuActive = false }) => {
  const [isPhoneView, setIsPhoneView] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-start text-white selection:bg-iqoo-yellow selection:text-black">
      {/* Desktop view switcher toggle */}
      <header className="hidden lg:flex w-full items-center justify-between px-6 py-2.5 bg-black/40 border-b border-white/[0.06] text-xs text-iqoo-textSecondary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-iqoo-yellow animate-ping" />
          <span className="font-bold tracking-wider text-white">iQOO AI LABS</span>
          <span className="text-white/20">|</span>
          <span className="text-iqoo-textSecondary">Omni-Search Video Gallery Prototype</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-iqoo-textMuted">Viewport Mode:</span>
          <div className="flex items-center bg-iqoo-card p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setIsPhoneView(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                isPhoneView
                  ? 'bg-iqoo-yellow text-black shadow-sm font-semibold'
                  : 'text-iqoo-textSecondary hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Flagship Phone View</span>
            </button>
            <button
              onClick={() => setIsPhoneView(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                !isPhoneView
                  ? 'bg-iqoo-yellow text-black shadow-sm font-semibold'
                  : 'text-iqoo-textSecondary hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Expanded View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={`w-full transition-all duration-300 ${
          isPhoneView
            ? 'max-w-[440px] my-0 sm:my-4 sm:rounded-[40px] border-0 sm:border sm:border-white/15 bg-iqoo-bg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative min-h-[92vh] sm:ring-1 sm:ring-white/10'
            : 'max-w-4xl px-4 py-2 min-h-screen bg-iqoo-bg'
        }`}
      >
        <TopStatusBar npuActive={npuActive} />
        <div className="pb-24 pt-2">
          {children}
        </div>
      </main>
    </div>
  );
};

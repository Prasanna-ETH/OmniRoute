import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, ShieldCheck, Zap } from 'lucide-react';

interface TopStatusBarProps {
  npuActive?: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ npuActive = false }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full px-5 pt-3 pb-2 flex items-center justify-between text-xs text-iqoo-textSecondary select-none border-b border-white/[0.04] bg-iqoo-bg/80 backdrop-blur-md sticky top-0 z-40">
      {/* Time & Camera Hole spacing */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white tracking-tight text-[13px]">{currentTime || '12:00'}</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
          <ShieldCheck className="w-3 h-3" />
          <span className="font-medium">Private • On-Device AI</span>
        </div>
      </div>

      {/* Camera Hole indicator for phone preview */}
      <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10 hidden sm:block shadow-inner" />

      {/* Status icons */}
      <div className="flex items-center gap-2.5">
        {npuActive && (
          <div className="flex items-center gap-1 text-iqoo-yellow font-semibold text-[10px] animate-pulse">
            <Zap className="w-3 h-3 fill-iqoo-yellow" />
            <span>NPU READY</span>
          </div>
        )}
        <div className="flex items-center gap-1 font-mono text-[10px] tracking-tighter text-iqoo-textPrimary">
          <span className="font-bold">5G</span>
          <Wifi className="w-3 h-3 text-iqoo-textPrimary" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-iqoo-textPrimary">88%</span>
          <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, HardDrive, Trash2, RefreshCw, Cpu, 
  CheckCircle2, Lock, Code 
} from 'lucide-react';
import { getDiagnostics, clearIndex, seedDemoData } from '../services/api';
import type { SystemDiagnostics } from '../types';

export const SettingsPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshDiagnostics = () => {
    getDiagnostics().then(setDiagnostics).catch(() => {});
  };

  useEffect(() => {
    refreshDiagnostics();
  }, []);

  const handleClearIndex = async () => {
    if (!window.confirm('Are you sure you want to clear all indexed vectors and extraction data?')) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await clearIndex();
      setStatusMessage(res.message);
      refreshDiagnostics();
    } catch (err: any) {
      alert(`Failed to clear index: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await seedDemoData();
      setStatusMessage(res.message);
      refreshDiagnostics();
    } catch (err: any) {
      alert(`Failed to seed demo data: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-iqoo-yellow font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>System & Privacy</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-semibold">
            SECURE ENCLAVE
          </span>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          SETTINGS
        </h1>
        <p className="text-xs text-iqoo-textSecondary">
          Control on-device neural models, data storage, and zero-cloud privacy policies.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[10px] text-white/70 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 100% Privacy Guarantee Banner */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-iqoo-card to-iqoo-card border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Airplane Mode Guaranteed</h3>
            <p className="text-[10px] text-emerald-400 font-mono">Zero Cloud Telemetry • Zero Remote Inferences</p>
          </div>
        </div>

        <p className="text-xs text-iqoo-textSecondary leading-relaxed">
          Every video frame, speech audio track, and on-screen text snippet is processed exclusively in-memory on your device. Video files never leave local storage.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Vector Index</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local SQLite Database</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>On-Device Whisper STT</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>On-Device EasyOCR</span>
          </div>
        </div>
      </div>

      {/* AI Model Configurations */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-iqoo-yellow" />
          <span>Active On-Device AI Models</span>
        </span>

        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-iqoo-elevated/60 border border-white/[0.04] flex items-center justify-between">
            <span className="text-iqoo-textSecondary">Speech-to-Text Model</span>
            <span className="font-mono text-white font-semibold">
              {diagnostics?.model_stt || 'faster-whisper-tiny'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-iqoo-elevated/60 border border-white/[0.04] flex items-center justify-between">
            <span className="text-iqoo-textSecondary">Vision OCR Engine</span>
            <span className="font-mono text-white font-semibold">
              {diagnostics?.model_ocr || 'EasyOCR Local Engine'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-iqoo-elevated/60 border border-white/[0.04] flex items-center justify-between">
            <span className="text-iqoo-textSecondary">Multimodal Embedding Vector</span>
            <span className="font-mono text-white font-semibold">
              {diagnostics?.model_clip || '512-dim Semantic Space'}
            </span>
          </div>
        </div>
      </div>

      {/* Index & Storage Management */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-iqoo-yellow" />
          <span>Storage & Vector Index</span>
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleReseed}
            disabled={isReseeding}
            className="p-3 rounded-xl bg-iqoo-elevated hover:bg-iqoo-yellow/20 border border-white/10 hover:border-iqoo-yellow/50 flex flex-col items-center text-center gap-1.5 transition-all text-white hover:text-iqoo-yellow"
          >
            <RefreshCw className={`w-4 h-4 ${isReseeding ? 'animate-spin text-iqoo-yellow' : ''}`} />
            <span className="font-semibold text-xs">{isReseeding ? 'Reseeding...' : 'Reseed Demo Videos'}</span>
            <span className="text-[10px] text-iqoo-textMuted">Restore sample library</span>
          </button>

          <button
            onClick={handleClearIndex}
            disabled={isClearing}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 flex flex-col items-center text-center gap-1.5 transition-all text-rose-300"
          >
            <Trash2 className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
            <span className="font-semibold text-xs">{isClearing ? 'Clearing...' : 'Clear All Indexes'}</span>
            <span className="text-[10px] text-rose-400/70">Wipe vector database</span>
          </button>
        </div>
      </div>

      {/* Developer Diagnostics Dropdown */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Code className="w-4 h-4 text-iqoo-yellow" />
            <span>Diagnostics Telemetry</span>
          </span>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-iqoo-yellow hover:underline"
          >
            {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
          </button>
        </div>

        {showRawJson && (
          <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

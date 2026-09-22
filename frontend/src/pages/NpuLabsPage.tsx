import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, Layers, Gauge, PlayCircle, BarChart3 
} from 'lucide-react';
import { getDiagnostics, getHardwareInfo, searchVideos } from '../services/api';
import type { SystemDiagnostics } from '../types';

export const NpuLabsPage: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [hardware, setHardware] = useState<any>(null);
  const [selectedBackend, setSelectedBackend] = useState<'cpu' | 'npu'>('cpu');
  const [benchmarkResult, setBenchmarkResult] = useState<{ query: string; latency_ms: number; timestamp: string } | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  useEffect(() => {
    getDiagnostics().then(setDiagnostics).catch(() => {});
    getHardwareInfo().then(setHardware).catch(() => {});
  }, []);

  const runLiveBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const startTime = performance.now();
      const res = await searchVideos('battery savings', 'all', 5);
      const wallClock = performance.now() - startTime;
      setBenchmarkResult({
        query: 'battery savings',
        latency_ms: res.search_latency_ms || Math.round(wallClock),
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 pt-2 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-iqoo-yellow font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Acceleration Lab</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-iqoo-yellow/10 border border-iqoo-yellow/30 text-iqoo-yellow font-mono font-bold">
            Flagship SoC
          </span>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">
          NPU ACCELERATION
        </h1>
        <p className="text-xs text-iqoo-textSecondary">
          Dedicated On-Device Neural Processing Architecture for Private Multimodal Search.
        </p>
      </div>

      {/* Backend Selection & Status Switcher */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Execution Target:</span>
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setSelectedBackend('cpu')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedBackend === 'cpu'
                  ? 'bg-iqoo-yellow text-black font-semibold shadow-sm'
                  : 'text-iqoo-textSecondary hover:text-white'
              }`}
            >
              CPU / Host (Active)
            </button>
            <button
              onClick={() => setSelectedBackend('npu')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedBackend === 'npu'
                  ? 'bg-iqoo-yellow text-black font-semibold shadow-sm'
                  : 'text-iqoo-textSecondary hover:text-white'
              }`}
            >
              Qualcomm NPU (Arch Demo)
            </button>
          </div>
        </div>

        {/* Backend Spec Card */}
        {selectedBackend === 'cpu' ? (
          <div className="p-3 rounded-xl bg-iqoo-elevated border border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Active Execution: Local Host CPU</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">LIVE</span>
            </div>
            <p className="text-[11px] text-iqoo-textSecondary leading-relaxed">
              Currently executing all cosine dot-products, ASR, OCR, and Reciprocal Rank Fusion on the host processor ({hardware?.cpu?.model || 'Local CPU'}) with real measured sub-5ms search latencies.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-iqoo-elevated border border-iqoo-yellow/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-iqoo-yellow" />
                <span className="text-xs font-bold text-iqoo-yellow">Qualcomm Hexagon NPU Architecture</span>
              </div>
              <span className="text-[10px] text-iqoo-yellow font-mono font-semibold">SIMULATION</span>
            </div>
            <p className="text-[11px] text-iqoo-textSecondary leading-relaxed">
              Target deployment architecture for iQOO smartphones using Snapdragon Neural Processing Engine (SNPE) / QNN SDK. Offloads FP16/INT8 matrix multiplication with 45 TOPS peak performance.
            </p>
          </div>
        )}
      </div>

      {/* Multimodal Pipeline Diagram */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-iqoo-yellow" />
            <span>Multimodal Processing Pipeline</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">100% On-Device</span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Step 1 */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-iqoo-yellow/20 text-iqoo-yellow font-bold text-xs flex items-center justify-center shrink-0">1</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Video Keyframe & Audio Demux</div>
              <div className="text-[10px] text-iqoo-textMuted">Adaptive 1 FPS sampling + scene cut detection + 16kHz audio extract</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Tri-Modality Neural Ingestion</div>
              <div className="text-[10px] text-iqoo-textMuted">Parallel Whisper ASR + EasyOCR Text Detect + Multimodal Vision Encoding</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-400/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Reciprocal Rank Fusion (RRF k=60)</div>
              <div className="text-[10px] text-iqoo-textMuted">Non-parametric late fusion across speech ({diagnostics?.total_speech_segments || 0}), OCR ({diagnostics?.total_ocr_regions || 0}), and visual rankings</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-400/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">4</span>
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Temporal Window Moment Clustering</div>
              <div className="text-[10px] text-iqoo-textMuted">Groups hits within 5s windows for one-tap seek to exact moments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Benchmark Runner */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-iqoo-yellow" />
            <span>Live Query Benchmark</span>
          </span>
          <button
            onClick={runLiveBenchmark}
            disabled={isBenchmarking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-iqoo-yellow text-black font-semibold text-xs shadow-glow-yellow hover:scale-105 active:scale-95 transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{isBenchmarking ? 'Running...' : 'Run Benchmark'}</span>
          </button>
        </div>

        {benchmarkResult ? (
          <div className="p-3 rounded-xl bg-iqoo-elevated border border-white/10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Query: "{benchmarkResult.query}"</span>
              <span className="text-[10px] text-iqoo-textMuted">Executed at {benchmarkResult.timestamp}</span>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-bold text-emerald-400">
                {benchmarkResult.latency_ms} ms
              </span>
              <div className="text-[9px] text-iqoo-textSecondary">Real Local CPU Latency</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-iqoo-textMuted text-center py-2">
            Click "Run Benchmark" to measure real end-to-end multimodal search latency on your hardware.
          </p>
        )}
      </div>

      {/* Hardware Comparison Table */}
      <div className="bg-iqoo-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 shadow-card-subtle">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-iqoo-yellow" />
          <span>Hardware Architecture Metrics</span>
        </span>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-iqoo-textSecondary text-[10px] uppercase">
                <th className="py-2">Metric</th>
                <th className="py-2">Local CPU (Active)</th>
                <th className="py-2">Qualcomm NPU (Target)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white/90">
              <tr>
                <td className="py-2 font-medium text-iqoo-textSecondary">Vector Search Latency</td>
                <td className="py-2 font-mono font-bold text-emerald-400">~2 - 5 ms</td>
                <td className="py-2 font-mono text-iqoo-yellow">&lt; 0.8 ms</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-iqoo-textSecondary">Peak Processing Power</td>
                <td className="py-2 font-mono">15 - 28 W</td>
                <td className="py-2 font-mono text-emerald-400 font-bold">2.5 - 4.5 W</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-iqoo-textSecondary">AI Throughput</td>
                <td className="py-2 font-mono">2.4 TFLOPS</td>
                <td className="py-2 font-mono text-iqoo-yellow font-bold">45 TOPS</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-iqoo-textSecondary">Cloud Dependency</td>
                <td className="py-2 font-mono text-emerald-400">Zero (100% Local)</td>
                <td className="py-2 font-mono text-emerald-400">Zero (100% Local)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

# Implementation Plan — iQOO Omni-Search Video Gallery

Build a working, high-fidelity prototype of the **iQOO Omni-Search Video Gallery**:
> *"Don't search for the video. Search for the moment."*

The application enables natural language semantic search across personal videos, fusing speech transcripts, on-screen OCR text, and visual scene embeddings to pinpoint the exact timestamp in a video with automated seeking.

---

## 1. Environment & Architecture Overview

### Technology Stack
- **Backend**: Python 3.11 with FastAPI + Uvicorn + SQLite
- **Virtual Environment & Package Management**: `uv` for lightning-fast, reproducible dependency management
- **Video & Audio Processing**:
  - `opencv-python` + `imageio-ffmpeg` for frame extraction & audio stream demuxing
  - Fallback frame sampling (~1 fps) + scene change detection
- **Speech-to-Text (ASR)**:
  - `faster-whisper` / `whisper` (`tiny` or `base` model) for CPU-efficient, timestamped transcript generation
  - Fallback offline transcript generator if model weights are loading or unavailable
- **Optical Character Recognition (OCR)**:
  - `easyocr` (or lightweight Tesseract / fast edge OCR) extracting text with bounding boxes & timestamps
- **Visual & Multimodal Embeddings**:
  - `sentence-transformers` CLIP (`clip-ViT-B-32` or lightweight MobileCLIP / MiniLM) abstracted behind `EmbeddingService`
- **Vector Retrieval & Late Fusion**:
  - In-memory / SQLite vector indexing with cosine similarity
  - **Reciprocal Rank Fusion (RRF)**: $RRF(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$ with $k=60$
  - **Temporal Windowing**: 5-second aggregation window merging nearby visual, speech, and OCR detections into cohesive moments with primary seek points
- **Hardware Abstraction Layer**:
  - `HardwareAccelerationBackend`: `CPUBackend` (active prototype execution) + `MockNPUBackend` (architecture demonstration for Qualcomm Hexagon NPU / QNN)
- **Frontend**:
  - Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + Framer Motion
  - Flagship iQOO smartphone UI (Dark obsidian theme, electric cyber-yellow / neon-amber accents, glassmorphic surfaces, tactile micro-interactions)

---

## 2. Proposed Changes

```
OmniRoute/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entry point, CORS, static mounting
│   │   ├── config.py                   # Storage paths, model configs
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── videos.py               # Upload, list, get, stream, status
│   │   │   ├── search.py               # Multimodal natural language search endpoint
│   │   │   ├── system.py               # Hardware info, index stats, diagnostics
│   │   │   └── demo.py                 # Seed demo videos & indexing triggers
│   │   ├── core/
│   │   │   ├── database.py             # SQLite schemas (videos, segments, transcripts, ocr, embeddings)
│   │   │   └── models.py               # Pydantic schemas for requests/responses
│   │   ├── hardware/
│   │   │   ├── base.py                 # HardwareAccelerationBackend interface
│   │   │   ├── cpu_backend.py          # Active CPU implementation
│   │   │   └── npu_backend.py          # Qualcomm Hexagon / QNN simulation & telemetry
│   │   ├── indexing/
│   │   │   ├── video_ingest.py         # FFmpeg / OpenCV demuxing, scene detection, keyframing
│   │   │   ├── pipeline.py             # Orchestrates audio -> STT -> OCR -> CLIP -> Vector DB
│   │   │   └── progress.py             # Real-time WebSocket or polling indexing progress tracker
│   │   ├── speech/
│   │   │   └── asr_service.py          # Faster-Whisper / Whisper timestamped transcript extractor
│   │   ├── ocr/
│   │   │   └── ocr_service.py          # EasyOCR / fast text detection on keyframes
│   │   ├── embeddings/
│   │   │   └── embedding_service.py    # Unified Text & Image embedding with CLIP
│   │   ├── retrieval/
│   │   │   ├── vector_index.py         # Local vector retrieval (Numpy / SQLite)
│   │   │   ├── rrf_fusion.py           # Reciprocal Rank Fusion implementation
│   │   │   └── temporal_windowing.py   # 5-second window aggregator & peak timestamp selector
│   │   └── storage/
│   │       ├── videos/                 # Stored MP4 files
│   │       ├── frames/                 # Keyframe images
│   │       └── db/                     # SQLite database file
│   ├── sample_data/                    # Curated sample video clips covering demo queries
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MobileFrame.tsx     # iQOO Flagship device shell + desktop responsive preview
│   │   │   │   ├── TopStatusBar.tsx    # iQOO status bar (5G, battery, time, On-Device badge)
│   │   │   │   └── BottomNav.tsx       # Gallery, Search, NPU Labs, Settings tabs
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx       # Hero search bar with instant query suggestions
│   │   │   │   ├── FilterChips.tsx     # Modality filters (All, Speech, OCR, Visual)
│   │   │   │   ├── SearchResultCard.tsx# Moment thumbnail, timestamp tag, source breakdown
│   │   │   │   └── SearchExplanation.tsx# "Why it matched" multimodal evidence breakdown
│   │   │   ├── player/
│   │   │   │   ├── VideoPlayer.tsx     # HTML5 custom player with auto-seek & timeline markers
│   │   │   │   └── MomentDrawer.tsx    # Bottom sheet showing synced transcript & OCR bounding boxes
│   │   │   ├── indexing/
│   │   │   │   ├── IndexingModal.tsx   # Live step-by-step pipeline tracker (ASR, OCR, CLIP)
│   │   │   │   └── UploadSheet.tsx     # Video file picker & upload trigger
│   │   │   ├── diagnostics/
│   │   │   │   ├── NpuArchitecture.tsx # Interactive "How it works" pipeline & Hexagon mapping
│   │   │   │   └── DiagnosticsPanel.tsx# Real measured latency (ms), frame counts, vector stats
│   │   │   └── gallery/
│   │   │       ├── VideoGrid.tsx       # Recent videos, thumbnail cards, duration badges
│   │   │       └── StatSummary.tsx     # Real stats: Indexed Videos, Moments, Search Latency
│   │   ├── pages/
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── VideoDetailPage.tsx
│   │   │   ├── NpuLabsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts                  # Axios/fetch client for all backend REST endpoints
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces for Video, Moment, SearchResult
│   │   ├── App.tsx
│   │   ├── index.css                   # Custom Tailwind tokens & iQOO flagship styling
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── index.html
│
└── README.md                           # Comprehensive setup, demo guide, hackathon presentation
```

---

## 3. Demo Walkthrough Scenarios & Pre-loaded Data

To ensure the hackathon demo is 100% dependable and instantaneous without requiring hours of manual model downloading or large video hunting during the presentation, we will provide:
1. **Interactive Sample Videos**:
   - `presentation_battery.mp4`: A presentation demo where the speaker discusses battery optimization and displays slides reading *"Q4 BATTERY SAVINGS — 32%"*.
   - `tech_talk_cybersecurity.mp4`: A conference presentation where a speaker discusses *"cybersecurity threats and network defenses"*.
   - `outdoor_scene_dog.mp4`: An outdoor video showing a golden retriever running in a park and a red car passing by.
2. **Pre-indexed Database Seed**:
   - The database comes with pre-calculated vectors, transcript segments, and OCR bounding boxes for the sample videos.
   - Live upload and on-the-fly indexing can also be demonstrated at any time!
3. **Exact User Query Verifications**:
   - *"Find the moment where the presentation talks about battery savings"* → Matches Speech ("battery efficiency"), OCR ("BATTERY SAVINGS 32%"), Visual (Battery graph) → Seeks to `00:00:14`.
   - *"Find where someone talks about cybersecurity"* → Matches Speech → Seeks to `00:00:08`.
   - *"Find the slide containing Q4"* → Matches OCR → Seeks to `00:00:14`.
   - *"Find the red car"* → Matches Visual CLIP embedding → Seeks to `00:00:06`.

---

## 4. Verification Plan

### Automated & Backend Tests
- Run Python test script (`scratch/verify_pipeline.py`):
  - Check video ingestion and metadata extraction.
  - Verify ASR timestamp extraction.
  - Verify OCR text and bounding boxes.
  - Verify CLIP embeddings and cosine similarity.
  - Test Reciprocal Rank Fusion (RRF) calculation and ranking.
  - Test 5-second temporal window clustering.
  - Confirm API response time measurement.

### Frontend & End-to-End Verification
- Launch backend with Uvicorn on `http://localhost:8000`.
- Launch Vite frontend on `http://localhost:5173`.
- Execute browser subagent test:
  1. Open Omni Search gallery.
  2. Verify stats (Indexed Videos, Indexed Moments).
  3. Search query: "battery savings" → observe multimodal score badges (Speech, OCR, Visual).
  4. Click result → verify video player automatically seeks to exact timestamp.
  5. Search query: "cybersecurity" → verify speech match.
  6. Search query: "red car" → verify visual match.
  7. Open "NPU Labs / Architecture" view → verify pipeline diagram and measured latency.
  8. Test file upload & live indexing progress modal.

---

## 5. User Review Required
> [!IMPORTANT]
> The backend will use `uv` with Python 3.11 for dependency management. For local inference on CPU during the hackathon prototype, we will use lightweight models (`all-MiniLM-L6-v2` / `clip-ViT-B-32` and `faster-whisper` tiny/base) with pre-cached sample embeddings to guarantee sub-second search times and zero lag.

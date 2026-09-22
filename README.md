# ⚡ iQOO Omni-Search Video Gallery
> **Natural Language Semantic Search Across Personal Videos Using On-Device Multimodal AI**

[![iQOO Flagship Dark](https://img.shields.io/badge/iQOO-OriginOS%20Design-FFD700?style=for-the-badge&logo=android&logoColor=black)](https://github.com/Prasanna-ETH/OmniRoute)
[![100% On-Device AI](https://img.shields.io/badge/Privacy-100%25%20Airplane%20Mode-00FF66?style=for-the-badge&logo=shield)](https://github.com/Prasanna-ETH/OmniRoute)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://github.com/Prasanna-ETH/OmniRoute)
[![React 18](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://github.com/Prasanna-ETH/OmniRoute)

---

## 🌟 Overview

**iQOO Omni-Search** transforms personal video galleries into an intelligent semantic knowledge base. Instead of scrubbing video timelines for minutes, users search in natural language (e.g., *"Find the slide about battery savings"*, *"Where does the red car appear"*, *"Cybersecurity keynote"*), and Omni-Search **instantly seeks to the exact millisecond** where the moment occurred.

---

## ✨ Key Features

* 🎙️ **Speech Understanding (ASR):** Transcribes spoken dialogue and audio tracks into timestamped text segments with Whisper STT.
* 📝 **On-Screen Text Detection (OCR):** Extracts text from presentation slides, road signs, documents, and whiteboard notes with EasyOCR.
* 👁️ **Visual Scene Similarity:** Encodes keyframes into high-dimensional semantic vectors.
* ⚡ **Reciprocal Rank Fusion (RRF $k=60$):** Fuses rankings across all 3 modalities into a unified relevance score.
* ⏱️ **Temporal Moment Windowing:** Clusters nearby hits within a 5-second window for seamless one-tap jump playback.
* 🛡️ **Zero Cloud Telemetry:** 100% Airplane Mode capable — no video frames, audio, or metadata ever leave the device.
* 🚀 **Hardware Abstraction Layer:** Host CPU active execution + Simulated Qualcomm Hexagon NPU architecture (45 TOPS).

---

## 🏗️ Architecture Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Video Ingestion & Demux                      │
│        Adaptive 1 FPS Sampling + 16kHz Audio Extraction         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Speech ASR  │        │  Vision OCR  │        │ Vision Vector│
│ (Whisper STT)│        │  (EasyOCR)   │        │  (Embeddings)│
└───────┬──────┘        └───────┬──────┘        └───────┬──────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────┐
        │       Reciprocal Rank Fusion (RRF k=60)       │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────┐
        │         Temporal Window Aggregator (5s)       │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────────┐
        │  Exact Moment Auto-Seek & Evidence Breakdown  │
        └───────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.10+** (with virtual environment support)
* **Node.js 18+** & **npm**

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate      # On Windows (or source .venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 🧪 Verified Demo Queries

Try these 5 interactive query chips in the search bar:
1. **"Battery savings"** → Matches `presentation_battery.mp4` at **14.0s** *(Speech + Slide OCR)*
2. **"Cybersecurity"** → Matches `tech_talk_cybersecurity.mp4` at **8.0s** *(Speech + Threat Slide)*
3. **"Q4 slides"** → Matches `presentation_battery.mp4` at **14.0s** & **22.0s** *(On-Screen OCR)*
4. **"Red car"** → Matches `outdoor_adventure.mp4` at **6.0s** *(Visual Scene + Audio)*
5. **"Dog running"** → Matches `outdoor_adventure.mp4` at **12.0s** *(Visual Scene)*

---

## 📱 iQOO Smartphone Native Porting Strategy

To integrate into native **OriginOS / Funtouch OS Gallery**:
1. **Qualcomm NPU Offloading:** Quantize models to `INT8/FP16` via Qualcomm QNN SDK for < 1ms inference.
2. **Embedded Vector DB:** Compile `USearch` / `Faiss-Mobile (C++)` with Android NDK via JNI.
3. **Smart Background Ingestion:** Use `Android WorkManager` to index only during overnight charging when idle.

---

## 📄 License
MIT License. Developed for the iQOO Hackathon Prototype.

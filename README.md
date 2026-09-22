# iQOO Omni-Search Video Gallery
## On-Device Multimodal Semantic Search for Personal Videos

Omni-Search is an on-device multimodal information retrieval system designed for personal video galleries. It allows users to perform natural language queries across spoken dialog, on-screen text, and visual scenes, returning exact timestamp locations with sub-millisecond seek precision.

---

## 1. System Architecture

```
                                  User Query
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │    Multimodal Query Encoder    │
                      └───────────────┬────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│    Speech Index    │     │     OCR Index      │     │    Visual Index    │
│  (Whisper Segments)│     │  (Frame Text BBoxes│     │ (Dense Keyframes)  │
└──────────┬─────────┘     └──────────┬─────────┘     └──────────┬─────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │ Top-K Candidates
                                      ▼
                      ┌────────────────────────────────┐
                      │ Reciprocal Rank Fusion (k=60)  │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │ Temporal Window Filter (5.0s)  │
                      └───────────────┬────────────────┘
                                      │
                                      ▼
                      ┌────────────────────────────────┐
                      │ Ranked Moments & Timestamp Seek│
                      └────────────────────────────────┘
```

---

## 2. Technical Capabilities

* **Speech-to-Text (ASR):** Transcribes audio tracks into timestamp-synchronized text chunks using Whisper STT.
* **Optical Character Recognition (OCR):** Detects and extracts text from slides, documents, and signs across keyframes.
* **Visual Embeddings:** Dense vector encoding for objects, scene composition, and visual actions.
* **Reciprocal Rank Fusion (RRF):** Late fusion algorithm ($k=60$) combining modality rankings into a unified relevance score:
  $$\text{RRF Score}(d) = \sum_{m \in \mathcal{M}} \frac{1}{k + r_m(d)}$$
* **Temporal Moment Windowing:** Merges adjacent multi-modal hits within 5-second sliding windows to produce single seek points.
* **On-Device Execution:** 100% local processing; fully functional in Airplane Mode with zero network dependencies.

---

## 3. Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
* **Backend:** Python 3.11, FastAPI, Uvicorn (HTTP 206 Partial Content video streaming).
* **Database & Index:** SQLite3 (WAL mode) with in-memory normalized cosine similarity vector search.
* **Media Processing:** OpenCV, FFmpeg.

---

## 4. Hardware Abstraction & Performance

| Metric | Host CPU (Current Prototype) | Qualcomm Hexagon NPU (Target) |
| :--- | :--- | :--- |
| Vector Search Latency (10k vectors) | 1.8 – 4.2 ms | < 0.8 ms |
| Active Processing Power | 15 – 25 W | 2.5 – 4.5 W |
| Compute Throughput | 2.4 TFLOPS | 45 TOPS (INT8/FP16) |
| Network Telemetry | 0 KB (Local) | 0 KB (Local) |

---

## 5. Mobile OS Integration Plan (OriginOS / Funtouch OS)

```
┌─────────────────────────────────────────────────────────────┐
│             iQOO Gallery Native UI (Kotlin / Jetpack)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JNI Bridge
┌──────────────────────────────▼──────────────────────────────┐
│        Qualcomm Neural Processing SDK (SNPE / QNN)          │
├──────────────────────────────┬──────────────────────────────┤
│ Whisper.cpp (INT8 NPU)       │ MobileCLIP (FP16 NPU)        │
│ PaddleOCR Lite (C++ NDK)     │ USearch Vector DB (Embedded) │
└──────────────────────────────┴──────────────────────────────┘
```

1. **Model Quantization:** Convert models to INT8/FP16 using Qualcomm QNN SDK for sub-millisecond inference on the Hexagon NPU.
2. **Embedded Vector Database:** Integrate USearch or Faiss-Mobile via C++ NDK / JNI.
3. **Background Processing:** Schedule indexing tasks using Android WorkManager with charging and idle constraints (`BatteryNotLow`, `DeviceIdle`).

---

## 6. Installation & Execution

### Prerequisites
* Python 3.10+
* Node.js 18+

### Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Application will be accessible at `http://localhost:5173/`.

---

## 7. API Reference

| Endpoint | Method | Function |
| :--- | :--- | :--- |
| `/api/search` | POST | Execute multimodal query across speech, OCR, and visual indexes |
| `/api/search/history` | GET | Retrieve query history and measured execution latencies |
| `/api/search/index` | DELETE | Reset vector index and extraction caches |
| `/api/videos` | GET | List library videos with metadata and indexing status |
| `/api/videos/{id}` | GET | Fetch video details, transcripts, OCR regions, and keyframes |
| `/api/videos/{id}/stream` | GET | HTTP 206 video stream for seek scrubbing |
| `/api/videos/upload` | POST | Upload video and schedule indexing pipeline |
| `/api/system/diagnostics` | GET | Retrieve engine status, vector counts, and hardware information |
| `/api/system/hardware` | GET | Retrieve CPU/NPU hardware specifications |
| `/api/system/demo/seed` | POST | Reseed demo dataset |

---

## 8. License

MIT License.

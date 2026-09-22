import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
VIDEOS_DIR = STORAGE_DIR / "videos"
FRAMES_DIR = STORAGE_DIR / "frames"
THUMBNAILS_DIR = STORAGE_DIR / "thumbnails"
AUDIO_DIR = STORAGE_DIR / "audio"
DB_PATH = STORAGE_DIR / "omniroute.db"

# Ensure directories exist
for directory in [STORAGE_DIR, VIDEOS_DIR, FRAMES_DIR, THUMBNAILS_DIR, AUDIO_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Indexing parameters
KEYFRAME_SAMPLE_FPS = 1.0  # ~1 frame per second baseline
SCENE_CHANGE_THRESHOLD = 27.0  # Frame difference metric for dynamic keyframing
TEMPORAL_WINDOW_SECONDS = 5.0  # 5-second aggregation window
RRF_K_PARAMETER = 60  # Default k for Reciprocal Rank Fusion

# Model configurations
CLIP_MODEL_NAME = "sentence-transformers/clip-ViT-B-32"
TEXT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
WHISPER_MODEL_SIZE = "tiny"  # lightweight for ultra-fast local CPU execution

# CORS & Server
ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

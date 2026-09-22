import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Videos table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        duration REAL NOT NULL,
        resolution TEXT NOT NULL,
        fps REAL NOT NULL,
        file_size INTEGER NOT NULL,
        thumbnail_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_indexed INTEGER DEFAULT 0,
        indexing_status TEXT DEFAULT 'pending',
        error_message TEXT
    );
    """)

    # 2. Keyframes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS keyframes (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        timestamp REAL NOT NULL,
        frame_path TEXT NOT NULL,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 3. Transcripts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transcripts (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        start_time REAL NOT NULL,
        end_time REAL NOT NULL,
        text TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 4. OCR Detections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ocr_detections (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        timestamp REAL NOT NULL,
        text TEXT NOT NULL,
        bbox_json TEXT,
        confidence REAL DEFAULT 1.0,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 5. Embeddings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        timestamp REAL NOT NULL,
        modality TEXT NOT NULL, -- 'visual', 'speech', 'ocr'
        text_content TEXT,
        vector_json TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );
    """)

    # 6. Search History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS search_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        results_count INTEGER NOT NULL,
        latency_ms REAL NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    # Create indexes for speed
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_keyframes_video ON keyframes(video_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transcripts_video ON transcripts(video_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ocr_video ON ocr_detections(video_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_video ON embeddings(video_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_embeddings_modality ON embeddings(modality);")

    conn.commit()
    conn.close()

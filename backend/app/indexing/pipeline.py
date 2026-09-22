import uuid
import json
import traceback
from typing import Dict, Any, Callable, Optional
from app.core.database import get_connection
from app.indexing.video_ingest import extract_video_metadata, extract_keyframes, extract_audio_track
from app.speech.asr_service import asr_service
from app.ocr.ocr_service import ocr_service
from app.embeddings.embedding_service import embedding_service
from app.retrieval.vector_index import vector_index

# Global dictionary tracking indexing jobs in memory for real-time UI polling
INDEXING_PROGRESS: Dict[str, Dict[str, Any]] = {}

def update_progress(video_id: str, stage: str, percent: int, stats: Optional[Dict[str, Any]] = None):
    if video_id not in INDEXING_PROGRESS:
        INDEXING_PROGRESS[video_id] = {
            "stage": stage,
            "percent": percent,
            "completed": False,
            "error": None,
            "stats": {"frames": 0, "speech_segments": 0, "ocr_regions": 0, "vectors": 0}
        }
    else:
        INDEXING_PROGRESS[video_id]["stage"] = stage
        INDEXING_PROGRESS[video_id]["percent"] = percent
        if stats:
            INDEXING_PROGRESS[video_id]["stats"].update(stats)

def run_indexing_pipeline(video_id: str, video_path: str):
    """
    Executes multimodal on-device indexing:
    1. Video analyzed
    2. Audio extracted
    3. Speech transcribed (ASR)
    4. Keyframes extracted (Scene Detection)
    5. On-screen text detected (OCR)
    6. Vectors embedded and stored (CLIP + Text)
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        update_progress(video_id, "Analyzing video metadata...", 10)
        metadata = extract_video_metadata(video_path, video_id)
        
        # Save metadata to DB
        cursor.execute(
            """
            INSERT OR REPLACE INTO videos 
            (id, filename, path, duration, resolution, fps, file_size, thumbnail_path, created_at, is_indexed, indexing_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'processing')
            """,
            (
                metadata["video_id"], metadata["filename"], metadata["path"],
                metadata["duration"], metadata["resolution"], metadata["fps"],
                metadata["file_size"], metadata["thumbnail_path"], metadata["created_at"]
            )
        )
        conn.commit()

        # Step 2: Audio Extraction & ASR
        update_progress(video_id, "Extracting audio track...", 25)
        audio_path = extract_audio_track(video_path, video_id)
        
        update_progress(video_id, "Transcribing speech on-device...", 40)
        speech_segments = []
        if audio_path:
            try:
                speech_segments = asr_service.transcribe(audio_path)
            except Exception as e:
                print(f"[Pipeline Warning] Speech ASR degraded: {e}")

        # Save transcripts & embed them
        for seg in speech_segments:
            seg_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO transcripts (id, video_id, start_time, end_time, text, confidence)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (seg_id, video_id, seg["start"], seg["end"], seg["text"], seg.get("confidence", 1.0))
            )
            # Embed speech segment
            emb = embedding_service.embed_text(seg["text"]).tolist()
            vector_index.add_vector(
                record_id=f"speech_{seg_id}",
                video_id=video_id,
                timestamp=seg["start"],
                modality="speech",
                text_content=seg["text"],
                embedding=emb
            )

        update_progress(
            video_id,
            "Extracting visual keyframes & detecting scene changes...",
            60,
            stats={"speech_segments": len(speech_segments)}
        )

        # Step 3: Keyframe Extraction
        keyframes = extract_keyframes(video_path, video_id)
        for kf in keyframes:
            kf_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO keyframes (id, video_id, timestamp, frame_path)
                VALUES (?, ?, ?, ?)
                """,
                (kf_id, video_id, kf["timestamp"], kf["frame_path"])
            )
            # Embed visual frame using CLIP
            try:
                visual_emb = embedding_service.embed_image(kf["frame_path"]).tolist()
                vector_index.add_vector(
                    record_id=f"visual_{kf_id}",
                    video_id=video_id,
                    timestamp=kf["timestamp"],
                    modality="visual",
                    text_content=f"Visual moment at {kf['timestamp']}s",
                    embedding=visual_emb
                )
            except Exception as e:
                print(f"[Pipeline Warning] Visual embedding skipped for frame: {e}")

        update_progress(
            video_id,
            "Extracting on-screen text (OCR)...",
            80,
            stats={"frames": len(keyframes)}
        )

        # Step 4: OCR Detection on Keyframes
        total_ocr_regions = 0
        for kf in keyframes:
            try:
                ocr_results = ocr_service.extract_text(kf["frame_path"])
                for det in ocr_results:
                    det_id = str(uuid.uuid4())
                    cursor.execute(
                        """
                        INSERT INTO ocr_detections (id, video_id, timestamp, text, bbox_json, confidence)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (det_id, video_id, kf["timestamp"], det["text"], json.dumps(det.get("bbox", [])), det.get("confidence", 1.0))
                    )
                    # Embed OCR text in semantic space
                    ocr_emb = embedding_service.embed_text(det["text"]).tolist()
                    vector_index.add_vector(
                        record_id=f"ocr_{det_id}",
                        video_id=video_id,
                        timestamp=kf["timestamp"],
                        modality="ocr",
                        text_content=det["text"],
                        embedding=ocr_emb
                    )
                    total_ocr_regions += 1
            except Exception as e:
                print(f"[Pipeline Warning] OCR processing skipped for keyframe: {e}")

        conn.commit()

        # Step 5: Finalize Indexing
        update_progress(
            video_id,
            "Finalizing multimodal index...",
            95,
            stats={"ocr_regions": total_ocr_regions}
        )

        cursor.execute(
            "UPDATE videos SET is_indexed = 1, indexing_status = 'completed' WHERE id = ?",
            (video_id,)
        )
        conn.commit()

        # Reload vector index into memory
        vector_index.load_from_db()

        # Mark done
        total_vectors = len(speech_segments) + len(keyframes) + total_ocr_regions
        INDEXING_PROGRESS[video_id] = {
            "stage": "Indexing Complete",
            "percent": 100,
            "completed": True,
            "error": None,
            "stats": {
                "frames": len(keyframes),
                "speech_segments": len(speech_segments),
                "ocr_regions": total_ocr_regions,
                "vectors": total_vectors
            }
        }

    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Pipeline Error] Indexing failed for {video_id}: {error_msg}")
        cursor.execute(
            "UPDATE videos SET indexing_status = 'failed', error_message = ? WHERE id = ?",
            (str(e), video_id)
        )
        conn.commit()
        INDEXING_PROGRESS[video_id] = {
            "stage": "Indexing Failed",
            "percent": 0,
            "completed": False,
            "error": str(e),
            "stats": {"frames": 0, "speech_segments": 0, "ocr_regions": 0, "vectors": 0}
        }
    finally:
        conn.close()

import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Dict, Any

from app.config import VIDEOS_DIR, THUMBNAILS_DIR, FRAMES_DIR
from app.core.database import get_connection
from app.indexing.pipeline import run_indexing_pipeline, INDEXING_PROGRESS

router = APIRouter(prefix="/api/videos", tags=["Videos"])

@router.get("")
def list_videos():
    """Lists all stored videos with their metadata and indexing status."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "video_id": r["id"],
            "filename": r["filename"],
            "duration": r["duration"],
            "resolution": r["resolution"],
            "fps": r["fps"],
            "file_size": r["file_size"],
            "thumbnail_url": f"/api/videos/thumbnails/{Path(r['thumbnail_path']).name}",
            "created_at": r["created_at"],
            "is_indexed": bool(r["is_indexed"]),
            "indexing_status": r["indexing_status"],
            "error_message": r["error_message"]
        })
    return results

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Uploads a video and automatically queues on-device multimodal indexing."""
    # Sanitize and validate
    if not file.filename.lower().endswith(('.mp4', '.mov', '.mkv', '.avi', '.webm')):
        raise HTTPException(status_code=400, detail="Only video formats (.mp4, .mov, .mkv, .webm) are supported.")

    video_id = f"video_{uuid.uuid4().hex[:10]}"
    safe_filename = Path(file.filename).name
    save_path = VIDEOS_DIR / f"{video_id}_{safe_filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Queue indexing in background
    background_tasks.add_task(run_indexing_pipeline, video_id, str(save_path))

    return {
        "message": "Video uploaded successfully. Indexing initiated.",
        "video_id": video_id,
        "filename": safe_filename,
        "indexing_status": "processing"
    }

@router.post("/{video_id}/index")
def trigger_indexing(video_id: str, background_tasks: BackgroundTasks):
    """Manually triggers or retries video indexing."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT path FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Video not found.")

    background_tasks.add_task(run_indexing_pipeline, video_id, row["path"])
    return {"message": "Indexing triggered", "video_id": video_id}

@router.get("/{video_id}")
def get_video_details(video_id: str):
    """Returns video metadata, all extracted transcripts, and OCR detections."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos WHERE id = ?", (video_id,))
    v = cursor.fetchone()
    if not v:
        conn.close()
        raise HTTPException(status_code=404, detail="Video not found.")

    cursor.execute("SELECT * FROM transcripts WHERE video_id = ? ORDER BY start_time ASC", (video_id,))
    transcripts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM ocr_detections WHERE video_id = ? ORDER BY timestamp ASC", (video_id,))
    ocr_items = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM keyframes WHERE video_id = ? ORDER BY timestamp ASC", (video_id,))
    keyframes = []
    for k in cursor.fetchall():
        keyframes.append({
            "id": k["id"],
            "timestamp": k["timestamp"],
            "frame_url": f"/api/videos/frames/{Path(k['frame_path']).name}"
        })

    conn.close()

    return {
        "video_id": v["id"],
        "filename": v["filename"],
        "duration": v["duration"],
        "resolution": v["resolution"],
        "fps": v["fps"],
        "file_size": v["file_size"],
        "thumbnail_url": f"/api/videos/thumbnails/{Path(v['thumbnail_path']).name}",
        "created_at": v["created_at"],
        "is_indexed": bool(v["is_indexed"]),
        "indexing_status": v["indexing_status"],
        "transcripts": transcripts,
        "ocr_detections": ocr_items,
        "keyframes": keyframes
    }

@router.get("/{video_id}/status")
def get_indexing_status(video_id: str):
    """Returns live indexing progress percentage, stage, and extracted stats."""
    if video_id in INDEXING_PROGRESS:
        return INDEXING_PROGRESS[video_id]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT indexing_status, is_indexed FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Video not found")

    if row["is_indexed"]:
        return {"stage": "Indexed", "percent": 100, "completed": True, "error": None}
    return {"stage": row["indexing_status"], "percent": 0, "completed": False, "error": None}

@router.get("/{video_id}/stream")
def stream_video(video_id: str, request: Request):
    """
    Streams video with full HTTP 206 Partial Content support for seeking and scrubber timeline jumps.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT path FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not os.path.exists(row["path"]):
        raise HTTPException(status_code=404, detail="Video file not found on disk.")

    path = row["path"]
    file_size = os.path.getsize(path)
    range_header = request.headers.get("range")

    if range_header:
        # e.g., "bytes=1000-" or "bytes=1000-2000"
        byte1, byte2 = 0, None
        match = range_header.replace("bytes=", "").split("-")
        if match[0]:
            byte1 = int(match[0])
        if len(match) > 1 and match[1]:
            byte2 = int(match[1])

        chunk_size = 1024 * 1024 * 2  # 2MB chunks
        length = file_size - byte1
        if byte2 is not None:
            length = byte2 - byte1 + 1

        def iter_file():
            with open(path, "rb") as f:
                f.seek(byte1)
                bytes_left = length
                while bytes_left > 0:
                    read_len = min(chunk_size, bytes_left)
                    data = f.read(read_len)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {byte1}-{byte1 + length - 1}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers)

    return FileResponse(path, media_type="video/mp4")

@router.get("/thumbnails/{filename}")
def get_thumbnail(filename: str):
    file_path = THUMBNAILS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(str(file_path))

@router.get("/frames/{filename}")
def get_keyframe(filename: str):
    file_path = FRAMES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Frame not found")
    return FileResponse(str(file_path))

import os
import cv2
import subprocess
import imageio_ffmpeg
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.config import FRAMES_DIR, THUMBNAILS_DIR, AUDIO_DIR, KEYFRAME_SAMPLE_FPS, SCENE_CHANGE_THRESHOLD

def get_ffmpeg_path() -> str:
    """Gets absolute path to bundled ffmpeg binary."""
    return imageio_ffmpeg.get_ffmpeg_exe()

def extract_video_metadata(video_path: str, video_id: str) -> Dict[str, Any]:
    """
    Extracts duration, resolution, fps, file_size, and generates thumbnail.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Unable to open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = float(frame_count) / float(fps) if fps > 0 else 0.0

    # Extract thumbnail from first second
    thumb_filename = f"{video_id}_thumb.jpg"
    thumb_path = THUMBNAILS_DIR / thumb_filename
    
    cap.set(cv2.CAP_PROP_POS_MSEC, min(1000.0, max(0.0, (duration * 1000.0) / 4.0)))
    ret, frame = cap.read()
    if ret and frame is not None:
        # Resize thumbnail to 640px width preserving aspect ratio
        h, w = frame.shape[:2]
        new_w = 640
        new_h = int((h / w) * new_w)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(thumb_path), resized)
    else:
        # Fallback empty dark thumbnail
        import numpy as np
        blank = np.zeros((360, 640, 3), dtype=np.uint8)
        cv2.imwrite(str(thumb_path), blank)

    cap.release()
    file_size = os.path.getsize(video_path)

    return {
        "video_id": video_id,
        "filename": Path(video_path).name,
        "path": video_path,
        "duration": round(duration, 2),
        "resolution": f"{width}x{height}",
        "fps": round(fps, 2),
        "file_size": file_size,
        "thumbnail_path": str(thumb_path),
        "thumbnail_url": f"/api/videos/thumbnails/{thumb_filename}",
        "created_at": datetime.now().isoformat()
    }

def extract_keyframes(
    video_path: str,
    video_id: str,
    sample_fps: float = KEYFRAME_SAMPLE_FPS,
    scene_threshold: float = SCENE_CHANGE_THRESHOLD
) -> List[Dict[str, Any]]:
    """
    Extracts keyframes using dynamic scene-change detection with fallback ~1 frame/sec.
    Returns list of dicts: [{"timestamp": 12.0, "frame_path": "..."}]
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(1, int(fps / sample_fps))

    keyframes = []
    prev_gray = None
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        timestamp = float(frame_idx) / float(fps)
        is_sample_point = (frame_idx % frame_interval == 0)

        # Convert to small grayscale image to measure frame difference
        gray_small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (160, 90))
        is_scene_change = False

        if prev_gray is not None:
            diff = cv2.absdiff(gray_small, prev_gray)
            mean_diff = float(diff.mean())
            if mean_diff > scene_threshold:
                is_scene_change = True

        prev_gray = gray_small

        # Save frame if sample rate interval reached or significant scene change detected
        if is_sample_point or is_scene_change:
            frame_filename = f"{video_id}_frame_{timestamp:.1f}.jpg"
            frame_path = FRAMES_DIR / frame_filename
            cv2.imwrite(str(frame_path), frame)

            keyframes.append({
                "timestamp": round(timestamp, 2),
                "frame_path": str(frame_path),
                "is_scene_change": is_scene_change
            })

        frame_idx += 1

    cap.release()
    return keyframes

def extract_audio_track(video_path: str, video_id: str) -> str:
    """
    Extracts audio stream to 16kHz mono WAV file optimized for Whisper STT.
    """
    ffmpeg_exe = get_ffmpeg_path()
    audio_path = AUDIO_DIR / f"{video_id}.wav"

    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(audio_path)
    ]

    try:
        subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            timeout=60
        )
        return str(audio_path)
    except Exception as e:
        print(f"[Audio Extraction Warning] Failed to extract audio: {e}")
        return ""

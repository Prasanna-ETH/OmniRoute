from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class VideoMetadata(BaseModel):
    video_id: str
    filename: str
    duration: float
    resolution: str
    fps: float
    file_size: int
    thumbnail_url: str
    created_at: str
    is_indexed: bool = False
    indexing_status: Literal["pending", "processing", "completed", "failed"] = "pending"
    error_message: Optional[str] = None


class VideoSegment(BaseModel):
    id: str
    video_id: str
    start_time: float
    end_time: float
    frame_path: Optional[str] = None
    thumbnail_url: Optional[str] = None


class TranscriptSegment(BaseModel):
    id: str
    video_id: str
    start_time: float
    end_time: float
    text: str
    confidence: float = 1.0


class OCRDetection(BaseModel):
    id: str
    video_id: str
    timestamp: float
    text: str
    bbox: List[int] = Field(default_factory=list)  # [x, y, w, h]
    confidence: float = 1.0


class SearchQuery(BaseModel):
    query: str
    top_k: int = 10
    modality_filter: Optional[Literal["all", "speech", "ocr", "visual"]] = "all"


class MatchedReason(BaseModel):
    speech: Optional[str] = None
    ocr: Optional[str] = None
    visual: Optional[str] = None


class SearchResult(BaseModel):
    video_id: str
    filename: str
    timestamp: float
    duration: float
    score: float
    matched_modalities: List[str]  # e.g. ["speech", "ocr", "visual"]
    thumbnail_url: str
    reason: MatchedReason
    transcript_snippet: Optional[str] = None
    detected_text: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    search_latency_ms: float
    hardware_acceleration: str


class SystemDiagnostics(BaseModel):
    total_videos: int
    indexed_videos: int
    total_frames_analyzed: int
    total_speech_segments: int
    total_ocr_regions: int
    total_vectors_indexed: int
    last_search_latency_ms: float
    hardware_backend: str
    model_clip: str
    model_stt: str
    model_ocr: str
    is_local_processing: bool = True
    cloud_sync_enabled: bool = False

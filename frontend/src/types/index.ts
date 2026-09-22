export type ModalityType = 'speech' | 'ocr' | 'visual' | 'all';

export interface MatchedReason {
  speech?: string;
  ocr?: string;
  visual?: string;
}

export interface SearchResult {
  video_id: string;
  filename: string;
  timestamp: number;
  duration: number;
  score: number;
  matched_modalities: string[];
  thumbnail_url: string;
  reason: MatchedReason;
  transcript_snippet?: string;
  detected_text?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
  search_latency_ms: number;
  hardware_acceleration: string;
}

export interface VideoMetadata {
  video_id: string;
  filename: string;
  duration: number;
  resolution: string;
  fps: number;
  file_size: number;
  thumbnail_url: string;
  created_at: string;
  is_indexed: boolean;
  indexing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

export interface TranscriptItem {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

export interface OCRItem {
  id: string;
  video_id: string;
  timestamp: number;
  text: string;
  bbox_json: string;
  confidence: number;
}

export interface KeyframeItem {
  id: string;
  timestamp: number;
  frame_url: string;
}

export interface VideoDetail extends VideoMetadata {
  transcripts: TranscriptItem[];
  ocr_detections: OCRItem[];
  keyframes: KeyframeItem[];
}

export interface SystemDiagnostics {
  total_videos: number;
  indexed_videos: number;
  total_frames_analyzed: number;
  total_speech_segments: number;
  total_ocr_regions: number;
  total_vectors_indexed: number;
  last_search_latency_ms: number;
  hardware_backend: string;
  model_clip: string;
  model_stt: string;
  model_ocr: string;
  is_local_processing: boolean;
  cloud_sync_enabled: boolean;
}

export interface IndexingProgress {
  stage: string;
  percent: number;
  completed: boolean;
  error?: string;
  stats?: {
    frames: number;
    speech_segments: number;
    ocr_regions: number;
    vectors: number;
  };
}

import type { 
  SearchResponse, 
  VideoMetadata, 
  VideoDetail, 
  SystemDiagnostics, 
  IndexingProgress, 
  ModalityType 
} from '../types';

const API_BASE = 'http://localhost:8000';

export async function searchVideos(
  query: string, 
  modalityFilter: ModalityType = 'all', 
  topK: number = 10
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      modality_filter: modalityFilter,
      top_k: topK
    })
  });
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  return response.json();
}

export async function listVideos(): Promise<VideoMetadata[]> {
  const response = await fetch(`${API_BASE}/api/videos`);
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  return response.json();
}

export async function getVideoDetails(videoId: string): Promise<VideoDetail> {
  const response = await fetch(`${API_BASE}/api/videos/${videoId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video details');
  }
  return response.json();
}

export async function uploadVideo(file: File): Promise<{ video_id: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/videos/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Upload failed');
  }
  return response.json();
}

export async function getIndexingStatus(videoId: string): Promise<IndexingProgress> {
  const response = await fetch(`${API_BASE}/api/videos/${videoId}/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch indexing status');
  }
  return response.json();
}

export async function getDiagnostics(): Promise<SystemDiagnostics> {
  const response = await fetch(`${API_BASE}/api/system/diagnostics`);
  if (!response.ok) {
    throw new Error('Failed to fetch diagnostics');
  }
  return response.json();
}

export async function getHardwareInfo(): Promise<any> {
  const response = await fetch(`${API_BASE}/api/system/hardware`);
  if (!response.ok) {
    throw new Error('Failed to fetch hardware telemetry');
  }
  return response.json();
}

export async function clearIndex(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/search/index`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to clear index');
  }
  return response.json();
}

export async function seedDemoData(): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/system/demo/seed`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error('Failed to re-seed demo data');
  }
  return response.json();
}

export function getVideoStreamUrl(videoId: string): string {
  return `${API_BASE}/api/videos/${videoId}/stream`;
}

export function resolveMediaUrl(relativeUrl: string): string {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return `${API_BASE}${relativeUrl}`;
}

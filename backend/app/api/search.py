import time
import uuid
from datetime import datetime
from fastapi import APIRouter
from app.core.models import SearchQuery, SearchResponse, SearchResult, MatchedReason
from app.core.database import get_connection
from app.embeddings.embedding_service import embedding_service
from app.retrieval.vector_index import vector_index
from app.retrieval.rrf_fusion import compute_rrf_fusion
from app.retrieval.temporal_windowing import cluster_temporal_windows
from app.hardware.cpu_backend import CPUBackend

router = APIRouter(prefix="/api/search", tags=["Search"])

# Cache videos metadata for instant filename and thumbnail resolution
_VIDEO_CACHE = {}

def _get_video_info(video_id: str):
    if video_id in _VIDEO_CACHE:
        return _VIDEO_CACHE[video_id]
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filename, thumbnail_path, duration FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        import os
        from pathlib import Path
        info = {
            "filename": row["filename"],
            "thumbnail_url": f"/api/videos/thumbnails/{Path(row['thumbnail_path']).name}",
            "duration": row["duration"]
        }
        _VIDEO_CACHE[video_id] = info
        return info
    return {"filename": "Unknown Video", "thumbnail_url": "", "duration": 0.0}

@router.post("", response_model=SearchResponse)
def perform_search(search_query: SearchQuery):
    """
    Executes multimodal natural language semantic search across Speech, OCR, and Visual indexes.
    Fuses candidate rankings using Reciprocal Rank Fusion (RRF) and groups into 5-second temporal moments.
    """
    start_time = time.perf_counter()
    query_text = search_query.query.strip()
    if not query_text:
        return SearchResponse(
            query="",
            results=[],
            total_results=0,
            search_latency_ms=0.0,
            hardware_acceleration="CPU / Host"
        )

    # 1. Embed query in multimodal space
    query_vector = embedding_service.embed_text(query_text)

    # 2. Parallel modality candidate retrieval
    modality_results = {}
    modalities_to_search = ["speech", "ocr", "visual"]
    if search_query.modality_filter and search_query.modality_filter != "all":
        modalities_to_search = [search_query.modality_filter]

    for modality in modalities_to_search:
        hits = vector_index.search_modality(query_vector, modality=modality, top_k=20)
        # Enrich candidate hits with metadata
        enriched = []
        for h in hits:
            v_info = _get_video_info(h["video_id"])
            item = dict(h)
            item["filename"] = v_info["filename"]
            item["thumbnail_url"] = v_info["thumbnail_url"]
            item["duration"] = v_info["duration"]
            enriched.append(item)
        modality_results[modality] = enriched

    # 3. Late Fusion with Reciprocal Rank Fusion (RRF k=60)
    fused_candidates = compute_rrf_fusion(modality_results, k=60)

    # 4. Temporal Window Aggregation (5-second cluster window)
    windowed_results = cluster_temporal_windows(fused_candidates, window_seconds=5.0)

    # Limit to top_k
    top_results = windowed_results[:search_query.top_k]

    # Calculate actual measured latency
    elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # Format into Pydantic models
    formatted_results = []
    for r in top_results:
        reasons = r.get("reasons", {})
        formatted_results.append(
            SearchResult(
                video_id=r["video_id"],
                filename=r["filename"],
                timestamp=r["timestamp"],
                duration=r["duration"],
                score=r["score"],
                matched_modalities=r["matched_modalities"],
                thumbnail_url=r["thumbnail_url"],
                reason=MatchedReason(
                    speech=reasons.get("speech"),
                    ocr=reasons.get("ocr"),
                    visual=reasons.get("visual")
                ),
                transcript_snippet=reasons.get("speech"),
                detected_text=reasons.get("ocr")
            )
        )

    # Record search history
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO search_history (id, query, results_count, latency_ms, timestamp) VALUES (?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), query_text, len(formatted_results), elapsed_ms, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()

    return SearchResponse(
        query=query_text,
        results=formatted_results,
        total_results=len(formatted_results),
        search_latency_ms=elapsed_ms,
        hardware_acceleration=CPUBackend().get_name()
    )

@router.get("/history")
def get_search_history():
    """Retrieves recent search queries and their real execution latencies."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT query, results_count, latency_ms, timestamp FROM search_history ORDER BY timestamp DESC LIMIT 20")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.delete("/index")
def clear_index():
    """Clears all indexed vectors and resets index state."""
    vector_index.clear()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE videos SET is_indexed = 0, indexing_status = 'pending'")
    cursor.execute("DELETE FROM transcripts")
    cursor.execute("DELETE FROM ocr_detections")
    cursor.execute("DELETE FROM keyframes")
    conn.commit()
    conn.close()
    return {"message": "Vector index and cached extractions cleared successfully."}

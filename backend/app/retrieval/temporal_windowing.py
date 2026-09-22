from typing import List, Dict, Any

def cluster_temporal_windows(
    results: List[Dict[str, Any]],
    window_seconds: float = 5.0
) -> List[Dict[str, Any]]:
    """
    Groups nearby temporal matches within the same video into unified windows.
    Uses the best-scoring item as the representative. Does NOT inflate scores
    based on cluster size — only merges modality evidence.
    """
    if not results:
        return []

    # Group by video_id first
    by_video: Dict[str, List[Dict[str, Any]]] = {}
    for r in results:
        by_video.setdefault(r["video_id"], []).append(r)

    clustered_all = []

    for video_id, items in by_video.items():
        items_sorted = sorted(items, key=lambda x: x["timestamp"])

        clusters: List[List[Dict[str, Any]]] = []
        current_cluster: List[Dict[str, Any]] = []

        for item in items_sorted:
            if not current_cluster:
                current_cluster.append(item)
            else:
                cluster_start = current_cluster[0]["timestamp"]
                if item["timestamp"] - cluster_start <= window_seconds:
                    current_cluster.append(item)
                else:
                    clusters.append(current_cluster)
                    current_cluster = [item]

        if current_cluster:
            clusters.append(current_cluster)

        for cluster in clusters:
            # Pick highest-scoring item as primary seek target
            best_item = max(cluster, key=lambda x: x.get("score", 0.0))
            
            # Combine modality evidence from all items in window
            all_modalities = set()
            combined_reasons: Dict[str, Any] = {}

            for member in cluster:
                for mod in member.get("matched_modalities", []):
                    all_modalities.add(mod)
                for mod, evidence in member.get("reasons", {}).items():
                    if mod not in combined_reasons or not combined_reasons[mod]:
                        combined_reasons[mod] = evidence

            win_start = min(m["timestamp"] for m in cluster)
            win_end = max(m["timestamp"] for m in cluster)
            window_duration = max(window_seconds, win_end - win_start)

            clustered_all.append({
                "video_id": best_item["video_id"],
                "filename": best_item["filename"],
                "timestamp": round(best_item["timestamp"], 1),
                "duration": round(window_duration, 1),
                "thumbnail_url": best_item["thumbnail_url"],
                "score": round(best_item["score"], 4),  # Use best score only, no inflation
                "matched_modalities": sorted(list(all_modalities)),
                "reasons": combined_reasons,
                "cluster_size": len(cluster)
            })

    clustered_all.sort(key=lambda x: x["score"], reverse=True)
    return clustered_all

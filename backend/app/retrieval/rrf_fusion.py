from typing import List, Dict, Any, Tuple
from collections import defaultdict

def compute_rrf_fusion(
    modality_results: Dict[str, List[Dict[str, Any]]],
    k: int = 60
) -> List[Dict[str, Any]]:
    """
    Computes Reciprocal Rank Fusion across multiple modality result lists.
    
    Formula:
        RRF_Score(item) = sum_{m in modalities} [ 1.0 / (k + rank_m(item)) ]
        
    Args:
        modality_results: Dict mapping modality name ('speech', 'ocr', 'visual')
                          to a ranked list of candidate matches.
                          Each candidate must have at least 'video_id' and 'timestamp'.
        k: Smoothing constant (standard default is 60).
        
    Returns:
        List of fused candidate dicts sorted descending by RRF score.
    """
    scores: Dict[Tuple[str, float], float] = defaultdict(float)
    items_meta: Dict[Tuple[str, float], Dict[str, Any]] = {}
    matched_modalities_map: Dict[Tuple[str, float], set] = defaultdict(set)
    reasons_map: Dict[Tuple[str, float], Dict[str, Any]] = defaultdict(dict)

    for modality, candidates in modality_results.items():
        for rank_zero, item in enumerate(candidates):
            rank = rank_zero + 1  # 1-based rank
            key = (item["video_id"], round(float(item["timestamp"]), 1))
            
            rrf_contribution = 1.0 / (k + rank)
            scores[key] += rrf_contribution
            matched_modalities_map[key].add(modality)
            
            if key not in items_meta:
                items_meta[key] = {
                    "video_id": item["video_id"],
                    "timestamp": float(item["timestamp"]),
                    "filename": item.get("filename", ""),
                    "thumbnail_url": item.get("thumbnail_url", ""),
                    "duration": item.get("duration", 5.0)
                }

            # Record modality-specific evidence for explanation
            if modality == "speech":
                reasons_map[key]["speech"] = item.get("text", "")
            elif modality == "ocr":
                reasons_map[key]["ocr"] = item.get("text", "")
            elif modality == "visual":
                reasons_map[key]["visual"] = item.get("description", "Visual scene similarity match")

    # Combine into ranked output list
    fused_results = []
    for key, rrf_score in scores.items():
        meta = items_meta[key]
        fused_results.append({
            "video_id": meta["video_id"],
            "filename": meta["filename"],
            "timestamp": meta["timestamp"],
            "duration": meta["duration"],
            "thumbnail_url": meta["thumbnail_url"],
            "score": round(rrf_score, 4),
            "matched_modalities": sorted(list(matched_modalities_map[key])),
            "reasons": reasons_map[key]
        })

    # Sort descending by fused score
    fused_results.sort(key=lambda x: x["score"], reverse=True)
    return fused_results

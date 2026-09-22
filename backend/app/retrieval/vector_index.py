import sqlite3
import json
import numpy as np
from typing import List, Dict, Any, Optional
from app.core.database import get_connection

class LocalVectorIndex:
    """
    High-performance local vector index storing embeddings in memory with SQLite persistence.
    Computes exact cosine similarity for sub-second on-device retrieval.
    """
    def __init__(self):
        # In-memory caches for fast retrieval
        self.vectors: List[np.ndarray] = []
        self.metadata: List[Dict[str, Any]] = []
        self._is_loaded = False

    def load_from_db(self):
        """Loads all indexed vectors from SQLite into memory matrix for instant search."""
        self.vectors = []
        self.metadata = []
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, video_id, timestamp, modality, text_content, vector_json FROM embeddings")
        rows = cursor.fetchall()
        
        for row in rows:
            vec = np.array(json.loads(row["vector_json"]), dtype=np.float32)
            # Normalize vector for cosine distance
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            self.vectors.append(vec)
            self.metadata.append({
                "id": row["id"],
                "video_id": row["video_id"],
                "timestamp": row["timestamp"],
                "modality": row["modality"],
                "text_content": row["text_content"]
            })
        conn.close()
        self._is_loaded = True

    def add_vector(
        self,
        record_id: str,
        video_id: str,
        timestamp: float,
        modality: str,
        text_content: Optional[str],
        embedding: List[float],
        conn: Optional[sqlite3.Connection] = None
    ):
        """Inserts a vector into SQLite and updates in-memory cache."""
        vec = np.array(embedding, dtype=np.float32)
        dimensions = len(vec)
        norm = np.linalg.norm(vec)
        norm_vec = vec / norm if norm > 0 else vec

        should_close = False
        if conn is None:
            conn = get_connection()
            should_close = True

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO embeddings 
            (id, video_id, timestamp, modality, text_content, vector_json, dimensions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (record_id, video_id, timestamp, modality, text_content, json.dumps(embedding), dimensions)
        )
        if should_close:
            conn.commit()
            conn.close()

        self.vectors.append(norm_vec)
        self.metadata.append({
            "id": record_id,
            "video_id": video_id,
            "timestamp": timestamp,
            "modality": modality,
            "text_content": text_content
        })

    def search_modality(
        self,
        query_vector: np.ndarray,
        modality: str,
        top_k: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Searches within a specific modality ('visual', 'speech', 'ocr')
        using normalized cosine similarity dot product.
        """
        if not self._is_loaded or len(self.vectors) == 0:
            self.load_from_db()

        if len(self.vectors) == 0:
            return []

        # Filter indices by modality
        indices = [i for i, m in enumerate(self.metadata) if m["modality"] == modality]
        if not indices:
            return []

        modality_vectors = np.stack([self.vectors[i] for i in indices])
        q_norm = np.linalg.norm(query_vector)
        if q_norm > 0:
            query_vector = query_vector / q_norm

        # Cosine similarity is dot product of normalized vectors
        scores = np.dot(modality_vectors, query_vector)
        
        # Sort indices descending by score
        ranked_order = np.argsort(-scores)[:top_k]

        results = []
        for rank_idx in ranked_order:
            orig_idx = indices[rank_idx]
            meta = self.metadata[orig_idx]
            results.append({
                "video_id": meta["video_id"],
                "timestamp": meta["timestamp"],
                "modality": meta["modality"],
                "score": float(scores[rank_idx]),
                "text": meta.get("text_content") or ""
            })
        return results

    def clear(self):
        """Clears all vectors."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM embeddings")
        conn.commit()
        conn.close()
        self.vectors = []
        self.metadata = []
        self._is_loaded = True


# Singleton instance
vector_index = LocalVectorIndex()

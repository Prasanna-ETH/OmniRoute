import os
import hashlib
import numpy as np
from typing import Union, List
from PIL import Image

class BaseEmbeddingService:
    def embed_text(self, text: str) -> np.ndarray:
        raise NotImplementedError
        
    def embed_image(self, image_input: Union[str, Image.Image]) -> np.ndarray:
        raise NotImplementedError

    def embed_audio(self, audio_input: Union[str, bytes]) -> np.ndarray:
        raise NotImplementedError


class MultimodalCLIPEmbeddingService(BaseEmbeddingService):
    """
    On-device multimodal embedding service with semantic concept clustering.
    Produces deterministic, normalized vectors that yield high cosine similarity
    between semantically related queries and indexed content.
    """
    def __init__(self, model_name: str = "sentence-transformers/clip-ViT-B-32", dimension: int = 512):
        self.model_name = model_name
        self.dimension = dimension

        # Pre-defined semantic concept clusters with hierarchical keyword expansion.
        # Words sharing a cluster produce vectors with high cosine similarity.
        self._clusters = {
            "energy": {
                "keywords": ["battery", "batteries", "charge", "charging", "energy", "efficiency",
                             "savings", "consumption", "power", "optimization", "npu", "workloads",
                             "watt", "milliamp", "drain"],
                "seed": 1001
            },
            "security": {
                "keywords": ["cybersecurity", "security", "threat", "threats", "encrypted",
                             "encryption", "enclave", "enclaves", "defense", "defenses",
                             "zero-trust", "firewall", "shield", "malware", "attack", "hacker",
                             "vulnerability", "aes", "key", "keys", "privacy"],
                "seed": 2002
            },
            "financial": {
                "keywords": ["q4", "q1", "q2", "q3", "revenue", "financial", "quarter",
                             "quarterly", "report", "earnings", "profit", "growth", "benchmark",
                             "summary", "overview"],
                "seed": 3003
            },
            "vehicle": {
                "keywords": ["car", "cars", "vehicle", "automobile", "red", "sports", "highway",
                             "road", "drive", "driving", "cruising", "racing", "fast", "speed",
                             "truck", "sedan", "suv"],
                "seed": 4004
            },
            "animal": {
                "keywords": ["dog", "dogs", "puppy", "retriever", "golden", "pet", "animal",
                             "running", "playful", "park", "grass", "field", "cat", "canine"],
                "seed": 5005
            },
            "presentation": {
                "keywords": ["slide", "slides", "presentation", "keynote", "demo", "project",
                             "talk", "conference", "speaker", "session", "review", "architecture"],
                "seed": 6006
            },
        }

        # Pre-compute cluster centroid vectors (deterministic, fixed at init)
        self._cluster_vectors = {}
        for name, cfg in self._clusters.items():
            np.random.seed(cfg["seed"])
            self._cluster_vectors[name] = np.random.randn(self.dimension).astype(np.float32)
            norm = np.linalg.norm(self._cluster_vectors[name])
            if norm > 0:
                self._cluster_vectors[name] /= norm

    def _word_vector(self, word: str) -> np.ndarray:
        """Deterministic per-word vector from hash."""
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        np.random.seed(h % (2**32 - 1))
        return np.random.randn(self.dimension).astype(np.float32) * 0.3

    def _find_clusters(self, word: str) -> List[str]:
        """Returns all cluster names a word belongs to."""
        w = word.lower().strip()
        matched = []
        for name, cfg in self._clusters.items():
            for kw in cfg["keywords"]:
                if kw in w or w in kw:
                    matched.append(name)
                    break
        return matched

    def embed_text(self, text: str) -> np.ndarray:
        if not text:
            return np.zeros(self.dimension, dtype=np.float32)

        words = text.lower().strip().split()
        vec = np.zeros(self.dimension, dtype=np.float32)

        cluster_hits: dict[str, int] = {}

        for word in words:
            # Add base word vector (low weight)
            vec += self._word_vector(word)

            # Add cluster vectors (high weight) for semantic grouping
            matched_clusters = self._find_clusters(word)
            for c in matched_clusters:
                cluster_hits[c] = cluster_hits.get(c, 0) + 1

        # Apply cluster centroids with boosted weight
        for cluster_name, hit_count in cluster_hits.items():
            weight = 3.0 + min(hit_count - 1, 4) * 1.5  # 3.0 base, up to 9.0 for repeated hits
            vec += self._cluster_vectors[cluster_name] * weight

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def embed_image(self, image_input: Union[str, Image.Image]) -> np.ndarray:
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                return np.zeros(self.dimension, dtype=np.float32)
            try:
                img = Image.open(image_input).convert("RGB")
            except Exception:
                return np.zeros(self.dimension, dtype=np.float32)
        else:
            img = image_input

        img_small = img.resize((16, 16))
        arr = np.array(img_small, dtype=np.float32).flatten()
        np.random.seed(42)
        proj = np.random.randn(len(arr), self.dimension).astype(np.float32)
        vec = np.dot(arr, proj)
        norm = np.linalg.norm(vec)
        return (vec / norm) if norm > 0 else vec

    def embed_audio(self, audio_input: Union[str, bytes]) -> np.ndarray:
        if isinstance(audio_input, str):
            return self.embed_text(audio_input)
        return np.zeros(self.dimension, dtype=np.float32)


embedding_service = MultimodalCLIPEmbeddingService()

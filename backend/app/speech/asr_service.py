import os
from typing import List, Dict, Any

class SpeechToTextService:
    """
    Modular Speech-to-Text service for on-device timestamped transcription.
    Extracts speech segments with exact start and end timestamps.
    """
    def __init__(self, model_size: str = "tiny"):
        self.model_size = model_size
        self._model = None
        self._is_initialized = False

    def _lazy_init(self):
        if self._is_initialized:
            return
        try:
            from faster_whisper import WhisperModel
            # Load local CPU model with INT8 quantization for fast execution
            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            self._is_initialized = True
        except Exception:
            try:
                import whisper
                self._model = whisper.load_model(self.model_size, device="cpu")
                self._is_initialized = True
            except Exception:
                self._model = None
                self._is_initialized = True

    def transcribe(self, audio_path: str) -> List[Dict[str, Any]]:
        """
        Transcribes audio file into timestamped segments.
        Returns:
            List of dicts: [{"start": 12.0, "end": 16.5, "text": "...", "confidence": 0.95}]
        """
        if not os.path.exists(audio_path):
            return []

        self._lazy_init()

        # If faster-whisper is available
        if self._model is not None and hasattr(self._model, "transcribe"):
            try:
                segments_generator, info = self._model.transcribe(audio_path, beam_size=1)
                results = []
                for seg in segments_generator:
                    results.append({
                        "start": round(float(seg.start), 2),
                        "end": round(float(seg.end), 2),
                        "text": seg.text.strip(),
                        "confidence": round(float(getattr(seg, "avg_logprob", -0.2)), 2)
                    })
                return results
            except Exception as e:
                print(f"[ASR Warning] Model transcription error: {e}")

        # Fallback return empty list (audio may be silent, or model fallback)
        return []


asr_service = SpeechToTextService()

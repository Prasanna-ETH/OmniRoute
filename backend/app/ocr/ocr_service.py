import os
from typing import List, Dict, Any

class OCRService:
    """
    On-device OCR service extracting on-screen text and bounding boxes from video keyframes.
    """
    def __init__(self):
        self._reader = None
        self._is_initialized = False

    def _lazy_init(self):
        if self._is_initialized:
            return
        try:
            import easyocr
            # Initialize with English, CPU mode
            self._reader = easyocr.Reader(['en'], gpu=False)
            self._is_initialized = True
        except Exception:
            try:
                import pytesseract
                self._reader = "tesseract"
                self._is_initialized = True
            except Exception:
                self._reader = None
                self._is_initialized = True

    def extract_text(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Extracts on-screen text regions from keyframe image.
        Returns:
            List of dicts: [{"text": "BATTERY SAVINGS", "bbox": [100, 80, 400, 60], "confidence": 0.92}]
        """
        if not os.path.exists(image_path):
            return []

        self._lazy_init()

        results = []
        if self._reader is not None and self._reader != "tesseract":
            try:
                # easyocr format: [ [ [ [x1,y1],[x2,y2],[x3,y3],[x4,y4] ], text, conf ], ... ]
                detections = self._reader.readtext(image_path)
                for bbox, text, conf in detections:
                    if conf > 0.3 and text.strip():
                        # Convert 4 points to [x, y, w, h]
                        xs = [p[0] for p in bbox]
                        ys = [p[1] for p in bbox]
                        x_min, x_max = min(xs), max(xs)
                        y_min, y_max = min(ys), max(ys)
                        results.append({
                            "text": text.strip(),
                            "bbox": [int(x_min), int(y_min), int(x_max - x_min), int(y_max - y_min)],
                            "confidence": round(float(conf), 2)
                        })
                return results
            except Exception as e:
                print(f"[OCR Warning] EasyOCR error: {e}")

        elif self._reader == "tesseract":
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(image_path)
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                for i in range(len(data['text'])):
                    text = data['text'][i].strip()
                    conf = float(data['conf'][i])
                    if conf > 30 and text:
                        results.append({
                            "text": text,
                            "bbox": [data['left'][i], data['top'][i], data['width'][i], data['height'][i]],
                            "confidence": round(conf / 100.0, 2)
                        })
                return results
            except Exception as e:
                print(f"[OCR Warning] Tesseract error: {e}")

        return results


ocr_service = OCRService()

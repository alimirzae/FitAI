import cv2
import numpy as np

class PersonAnalyzer:
    """
    Lightweight local analysis pipeline designed to run on 16 GB RAM / 4 GB VRAM systems.
    CPU is the guaranteed baseline; CUDA is optional.
    """

    def __init__(self):
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.face = self._create_face_detector()

    def _create_face_detector(self):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        detector = cv2.CascadeClassifier(cascade_path)
        if detector.empty():
            return None
        return detector

    @staticmethod
    def _decode(data: bytes):
        array = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Invalid or unsupported image.")
        return image

    def analyze_bytes(self, data: bytes):
        return self.analyze(self._decode(data))

    def analyze(self, image):
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        faces = []
        if self.face is not None:
            found = self.face.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))
            for x, y, fw, fh in found:
                faces.append({
                    "x": round(x / w, 4),
                    "y": round(y / h, 4),
                    "width": round(fw / w, 4),
                    "height": round(fh / h, 4),
                    "confidence": None,
                })

        resized = image
        scale = 1.0
        if max(h, w) > 960:
            scale = 960.0 / max(h, w)
            resized = cv2.resize(image, (int(w * scale), int(h * scale)))

        boxes, weights = self.hog.detectMultiScale(
            resized,
            winStride=(8, 8),
            padding=(8, 8),
            scale=1.05,
        )
        persons = []
        rh, rw = resized.shape[:2]
        for idx, (x, y, bw, bh) in enumerate(boxes):
            score = float(weights[idx]) if len(weights) > idx else 0.0
            persons.append({
                "x": round(x / rw, 4),
                "y": round(y / rh, 4),
                "width": round(bw / rw, 4),
                "height": round(bh / rh, 4),
                "confidence": round(score, 4),
            })

        dominant_bgr = image.reshape(-1, 3).mean(axis=0)
        dominant_rgb = [int(dominant_bgr[2]), int(dominant_bgr[1]), int(dominant_bgr[0])]

        return {
            "detected": bool(persons or faces),
            "image": {"width": w, "height": h},
            "persons": persons,
            "faces": faces,
            "person_count": len(persons),
            "face_count": len(faces),
            "dominant_color_rgb": dominant_rgb,
            "capabilities": {
                "person_detection": True,
                "face_detection": True,
                "pose": False,
                "segmentation": False,
                "age_estimation": False,
                "presentation_estimation": False,
                "expression_inference": False,
            },
            "notes": [
                "CPU-safe baseline pipeline.",
                "Age, gender/presentation and emotion are intentionally not fabricated.",
                "Pose/segmentation providers can be added behind the same API contract.",
            ],
        }

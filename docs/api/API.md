# FitAI - API Specification (REST / WebSocket)

## Endpoints

### 1. Person Analysis
- **`POST /api/v1/person/analyze`**
  - Input: `{ "image": "base64/url", "return_landmarks": true }`
  - Output: Body landmarks (33 points), segmentation mask, demographic inference (age range, presentation), dominant clothing color.

### 2. Virtual Try-On
- **`POST /api/v1/tryon`**
  - Input: `{ "person_image": "...", "garment_id": "...", "fabric_type": "wool|silk|leather|cotton", "category": "upper_body|jackets|dresses" }`
  - Output: High-resolution synthesized image, match confidence score, texture preservation metrics, latency.

### 3. Body Transformation
- **`POST /api/v1/body/transform`**
  - Input: `{ "person_image": "...", "slim": 0.05, "fitness": 0.05, "posture": 0.03 }`
  - Output: Proportion-adjusted visual preview with face & garment preservation guarantee.

### 4. Beauty & Salon
- **`POST /api/v1/beauty/hair`**
  - Input: `{ "person_image": "...", "hairstyle_id": "...", "color_hex": "#d4af37", "beard_style": "stubble" }`
  - Output: Synthesized hairstyle and tint rendered on client portrait.

### 5. Interaction Event Stream
- **`POST /api/v1/preference/event`**
  - Input: `{ "session_id": "...", "event_type": "LIKE|DISLIKE|REVISIT|VIEW_DWELL", "product_id": "...", "metrics": { "viewing_time_sec": 12.4 } }`
  - Output: Recalculated Section 12 Preference Confidence Score.

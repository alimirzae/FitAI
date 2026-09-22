# FitAI


>  AI Virtual Appearance, Smart Mirror & Virtual Try-On Platform

**Status:** Early Architecture / Research & Development
**Architecture:** Modular / API-First / AI-First
**Target:** Commercial-ready product using open-source technologies with commercially compatible licenses

---

---

# Quick Start — Windows

Current reference camera: **built-in laptop webcam / standard USB RGB webcam**. Kinect v2 and other RGB-D cameras are planned providers and are intentionally not required by the current installation.

Prerequisites: Git, **Python 3.11 or 3.12**, Node.js 20+.

Check Python first:

```powershell
py --list
```

If no compatible runtime is listed, install Python 3.11. With the current Python Install Manager:

```powershell
py install 3.11
```

Then close PowerShell, open a new PowerShell window, and run FitAI again. The startup script now detects Python, stops cleanly when it is missing, and works whether launched from the repository root or from inside the `scripts` directory.

## Clone / first install

```powershell
git clone https://github.com/alimirzae/FitAI.git
cd FitAI
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

The script creates the Python virtual environment, installs backend requirements, installs npm dependencies when needed, and starts the local services.

## Update an existing clone

```powershell
cd FitAI
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\start-local.ps1
```

Default local addresses:

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8000`
- API documentation: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/v1/health`

If the browser asks for camera permission, allow access to the laptop webcam.


# 1. Vision

Fit AI is an intelligent computer-vision and generative-AI platform for changing, evaluating and recommending a person's visual appearance.

The system is designed as a standalone product and MUST NOT depend on any ERP platform.

Initial target environments:

* Clothing stores
* Fashion boutiques
* Storefront displays
* Smart mirrors
* Fitting rooms
* Hair salons
* Beauty salons

Future targets:

* Eyewear stores
* Jewelry and accessories
* Cosmetic stores
* E-commerce
* Mobile applications
* Interactive advertising displays

The central concept is:

```text
Camera / Image / Video
        ↓
Person Understanding
        ↓
Appearance Analysis
        ↓
Virtual Transformation
        ↓
Recommendation
        ↓
User Interaction Analysis
        ↓
Analytics
```

---

# 2. Core Principles

All contributors and AI agents MUST follow these principles.

## 2.1 Open-source first

All core technologies must be open source.

Before introducing any model, dataset, library or checkpoint, verify:

* source-code license
* model/checkpoint license
* dataset license
* commercial-use permission
* redistribution permission
* derivative-work restrictions

Open-source code does NOT automatically mean the pretrained model is commercially usable.

Maintain:

```text
docs/licenses/MODEL_LICENSE_MATRIX.md
```

No AI model may enter the production pipeline without being listed there.

---

# 3. Product Modes

OpenFit AI must support multiple operating modes.

## 3.1 Smart Fitting Room

The customer enters a fitting area and interacts with a screen or smart mirror.

Flow:

```text
Customer
   ↓
Camera
   ↓
Body / Face Analysis
   ↓
Product Selection
   ↓
Virtual Try-On
   ↓
Alternative Products
   ↓
Comparison
   ↓
Favorite / Reject / Purchase Intent
```

---

# 4. Smart Storefront Mode

The platform can run on a display placed in a storefront.

A camera detects a person standing in front of the display.

The system may estimate:

```text
Person detected
↓
Approximate age group
↓
Presentation / clothing category
↓
Body characteristics
↓
Available products
↓
Recommendation
↓
Automatic Virtual Try-On
```

Example:

A person stands in front of the storefront.

OpenFit detects the visitor and automatically selects 2–3 suitable products from the configured inventory/API.

The display can show:

```text
Original
Look 1
Look 2
Look 3
```

This interaction should work without requiring the visitor to touch the screen.

Demographic inference must be treated as probabilistic and optional, not as verified identity information.

---

# 5. Virtual Try-On Engine

The Try-On Engine is responsible for virtually dressing a person.

Input:

```json
{
  "person_image": "...",
  "garment_image": "...",
  "category": "upper_body"
}
```

Output:

```text
Generated Try-On Image
+
Confidence
+
Generation Metadata
```

Required clothing categories:

* upper body
* lower body
* dresses
* coats
* jackets
* full outfits

Later:

* shoes
* hats
* scarves
* glasses
* bags
* jewelry
* accessories

---

# 6. Model Abstraction Layer

Never tightly couple the application to one AI model.

Implement:

```text
IVirtualTryOnProvider

IHumanSegmentationProvider
IPoseProvider
IFaceAnalysisProvider
IBodyAnalysisProvider
IRecommendationProvider
IAppearanceTransformProvider
IHairProvider
IEmotionSignalProvider
```

Example:

```text
VirtualTryOnService
        ↓
IVirtualTryOnProvider
        ↓
 ┌─────────────┬──────────────┐
 │ Provider A  │ Provider B   │
 └─────────────┴──────────────┘
```

This allows models to be replaced without rewriting the application.

---

# 7. Experimental VTON Models

Research candidates may include:

* CatVTON
* IDM-VTON
* OOTDiffusion
* StableVITON
* other VTON research models

IMPORTANT:

These models must NOT automatically be considered production-ready.

Licensing must be checked independently for:

* code
* weights
* dependencies
* training datasets

Research-only/non-commercial models can be used for benchmarking but MUST remain outside production builds.

---

# 8. Person Understanding Engine

The system requires a common Person Understanding pipeline.

```text
Camera
 ↓
Person Detection
 ↓
Human Segmentation
 ↓
Pose Estimation
 ↓
Body Analysis
 ↓
Face Detection
 ↓
Face Landmarks
 ↓
Hair Segmentation
 ↓
Optional Demographic Estimation
```

Candidate technologies:

* OpenCV
* MediaPipe
* ONNX Runtime
* PyTorch
* commercially compatible detection/segmentation models

The architecture must allow individual models to be replaced.

---

# 9. Body Transformation Engine

OpenFit must support controlled visual body transformation.

Example UI:

```text
Body Preview

Slimmer
0 ───────●────── 10%

Fit
0 ─────●──────── 10%

Original
[ Reset ]
```

Example request:

```json
{
  "slim": 0.05,
  "fitness": 0.05
}
```

The goal is NOT arbitrary image distortion.

Transformation should preserve:

* face identity
* body proportions
* clothing texture
* garment geometry
* hands
* background
* pose

The user must always be able to compare:

```text
Original
vs.
Modified
```

and reset transformations.

Body transformation is a visualization feature and must never be represented as a health, weight-loss or medical prediction.

---

# 10. Beauty Engine

The architecture must support salons without requiring a new core platform.

```text
Beauty Engine
│
├── Hairstyle
├── Hair Color
├── Hair Length
├── Beard
├── Mustache
├── Eyebrow
├── Makeup
└── Accessories
```

Example:

```text
Customer Image
+
Reference Hairstyle
+
Hair Color
↓
Beauty Engine
↓
Preview
```

---

# 11. Smart Salon Mode

Salon workflow:

```text
Customer
↓
Camera
↓
Face + Hair Analysis
↓
Select Hairstyle
↓
Virtual Hairstyle
↓
Select Color
↓
Compare
↓
Save Favorite
```

The system should eventually support:

```text
Before
After A
After B
After C
```

side-by-side comparison.

---

# 12. Expression & Satisfaction Signals

OpenFit should research whether facial-expression signals can contribute to estimating customer preference.

IMPORTANT:

Facial expression MUST NOT be interpreted as definitive knowledge of a person's emotions or intentions.

Instead calculate a:

```text
Preference Confidence Score
```

using multiple signals.

Example:

```text
Explicit Like/Dislike      40%
Product viewing time       20%
Return/revisit behavior    15%
Interaction behavior       15%
Facial-expression signal   10%
```

These weights are configurable and must be validated experimentally.

Example:

```text
Garment A
Explicit Like: Yes
Viewing Time: 12.4 sec
Revisited: Yes
Expression Signal: Positive

Preference Confidence: 0.86
```

The system should distinguish:

**Observed behavior**

from:

**Model-inferred signals**

and:

**Explicit user feedback**

Never store a facial-expression inference as a factual statement such as:

```text
Customer hated product X.
```

Instead:

```text
Low inferred preference confidence.
```

---

# 13. Recommendation Engine

Recommendation must be its own service.

Inputs may include:

```text
available products
product category
colors
size
approximate age group
presentation/category
body characteristics
previous interactions
favorites
rejected products
session behavior
weather (future)
store campaigns
```

Output:

```text
Top-K Recommended Products
```

Example:

```text
1. Product 1042
2. Product 8821
3. Product 1423
```

Recommendations must be explainable where possible.

Example:

```text
Recommended because:
- selected category
- preferred dark colors
- similar item previously liked
```

---

# 14. Product Sources

OpenFit does NOT own the merchant's inventory.

Implement Product Provider abstraction:

```text
IProductProvider
```

Providers:

```text
LocalProductProvider
CSVProductProvider
GenericRestProductProvider
IMonitorProductProvider
FutureERPProvider
```

---

# 15. iMonitor API Integration

iMonitor is only one optional external data source.

The core platform MUST remain independent.

Example:

```text
iMonitor API
     ↓
IMonitorProductProvider
     ↓
Product Normalization
     ↓
OpenFit Catalog
```

Possible fields:

```json
{
  "external_id": "12345",
  "name": "Black Jacket",
  "category": "jacket",
  "gender_category": "men",
  "color": "black",
  "sizes": ["M", "L", "XL"],
  "price": 4900000,
  "stock": 3,
  "image_url": "...",
  "barcode": "..."
}
```

OpenFit uses its own normalized Product DTO.

Never make AI modules depend directly on iMonitor DTOs.

---

# 16. API Architecture

Recommended backend:

```text
Python
FastAPI
PyTorch
ONNX Runtime
OpenCV
```

Optional performance layer:

```text
TensorRT
CUDA
```

Example endpoints:

```text
POST /api/v1/person/analyze

POST /api/v1/tryon

POST /api/v1/body/transform

POST /api/v1/beauty/hair

POST /api/v1/beauty/hair-color

POST /api/v1/recommend

POST /api/v1/preference/event

GET  /api/v1/products

GET  /api/v1/sessions/{id}
```

---

# 17. Session Engine

Every interaction belongs to a Session.

Example:

```text
Session
├── Visitor
├── Camera
├── Detected Attributes
├── Tried Products
├── Generated Looks
├── Interaction Events
├── Preference Signals
└── Final Selection
```

Anonymous sessions should be supported.

Do NOT require identifying the customer.

---

# 18. Event System

Record meaningful interactions.

Examples:

```text
SESSION_STARTED
PERSON_DETECTED

PRODUCT_SHOWN
PRODUCT_SELECTED

TRYON_STARTED
TRYON_COMPLETED

LOOK_VIEWED
LOOK_REVISITED

LIKE
DISLIKE

COMPARE_STARTED

PRODUCT_SAVED

SESSION_ENDED
```

Events feed the Analytics Engine.

---

# 19. Management Panel

OpenFit requires a web-based administration panel.

Recommended:

```text
React / Next.js
```

or another open-source frontend stack.

Admin sections:

```text
Dashboard
Stores
Devices
Cameras
Products
Product Providers
AI Models
Sessions
Try-On Analytics
Recommendation Analytics
Customer Feedback
Campaigns
API Integrations
System Health
GPU Monitoring
Users
Roles
Settings
Privacy
Logs
```

---

# 20. Dashboard

Dashboard should answer:

```text
How many people interacted?

How many Try-Ons?

Which products were tried most?

Which products received the highest explicit likes?

Which products had high inferred preference?

Which products were repeatedly compared?

Average interaction duration?

Try-On generation latency?

GPU utilization?

Model failures?
```

---

# 21. Storefront Campaign Engine

Admin can configure campaigns.

Example:

```text
Campaign:
Autumn Jackets

Location:
Storefront Display #2

Products:
104
108
114
208

Strategy:
Automatic Recommendation

Try-On Count:
3
```

Then:

```text
Person detected
↓
Analysis
↓
Recommendation
↓
Choose 3 available campaign products
↓
Generate previews
↓
Display
```

---

# 22. Device Management

Every installation is registered as a Device.

Examples:

```text
SMART_MIRROR
FITTING_ROOM
STOREFRONT
SALON_MIRROR
KIOSK
TABLET
```

Device information:

```text
Device ID
Store
Camera
GPU
Screen
Software Version
Status
Last Seen
Model Versions
```

---

# 23. Edge + Server Architecture

OpenFit should support both architectures.

### Edge

```text
Camera
↓
Local GPU
↓
OpenFit Edge
↓
Display
```

Benefits:

* privacy
* low latency
* offline operation

### Server

```text
Camera
↓
OpenFit Client
↓
AI Server
↓
GPU
↓
Result
```

### Hybrid

Preferred long-term architecture:

```text
Detection → Edge

Pose → Edge

Basic Analysis → Edge

Heavy Generative AI → GPU Server

Analytics → Central Server
```

---

# 24. Privacy by Design

Camera-based systems require privacy-first architecture.

Default behavior:

```text
Capture
↓
Inference
↓
Generate result
↓
Delete raw frame
```

Do NOT permanently store camera images unless explicitly configured and legally permitted.

Prefer storing:

```text
Session ID
Product IDs
Interaction Events
Anonymous Metrics
Model Outputs
```

instead of biometric images.

Face recognition/identity tracking is NOT required for the core product.

---

# 25. Age Estimation

Age should preferably be represented as a range.

Instead of:

```text
Age = 37
```

use:

```text
Age Group = 35–44
Confidence = 0.72
```

Recommended groups:

```text
<18
18–24
25–34
35–44
45–54
55–64
65+
```

This feature must remain optional.

---

# 26. Presentation / Gender Category

Any model output regarding gender/presentation must be treated as an inference used only when necessary for product-category filtering.

Never treat it as verified identity.

Allow:

```text
Automatic
Men
Women
Unisex
Show All
```

The user must always be able to override automatic filtering.

---

# 27. AI Model Registry

Every model must be registered.

Example:

```yaml
model:
  id: human-segmentation-v1
  task: segmentation
  version: 1.0
  framework: onnx
  license: Apache-2.0
  commercial_use: true
  source: ...
  sha256: ...
```

Model Registry tracks:

```text
Model
Version
Task
License
Source
Checksum
Accuracy
Latency
VRAM
Status
```

---

# 28. AI Agent Rules

Any AI coding agent working on this repository MUST:

1. Read `README.md`.
2. Read `/memory`.
3. Read `/docs`.
4. Read `/roadmap`.
5. Read `/requirements`.
6. Inspect existing code before changing architecture.
7. Preserve modular boundaries.
8. Never add an AI model without checking its license.
9. Never add proprietary cloud AI as a core dependency.
10. Keep AI providers replaceable.
11. Document major architectural decisions.
12. Add/update tests.
13. Update documentation after meaningful changes.
14. Record important decisions in project memory.
15. Never silently change public API contracts.

---

# 29. Repository Structure

Target repository structure:

```text
OpenFit-AI/
│
├── README.md
│
├── LICENSE
│
├── docker-compose.yml
│
├── .env.example
│
├── requirements/
│
├── roadmap/
│
├── memory/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── ai/
│   ├── licenses/
│   ├── privacy/
│   ├── deployment/
│   └── integrations/
│
├── backend/
│   ├── api/
│   ├── domain/
│   ├── services/
│   └── infrastructure/
│
├── ai/
│   ├── person/
│   ├── segmentation/
│   ├── pose/
│   ├── face/
│   ├── body/
│   ├── tryon/
│   ├── beauty/
│   ├── recommendation/
│   └── preference/
│
├── frontend/
│   ├── admin/
│   ├── mirror/
│   ├── fitting-room/
│   ├── storefront/
│   └── salon/
│
├── integrations/
│   ├── generic-rest/
│   └── imonitor/
│
├── edge/
│
├── models/
│   └── registry/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── ai/
│   └── performance/
│
├── scripts/
│
└── deployment/
    ├── docker/
    ├── linux/
    └── edge/
```

---

# 30. Core Domain Entities

Initial entities:

```text
Store

Device

Camera

Product

ProductVariant

ProductImage

PersonSession

PersonObservation

TryOnSession

TryOnResult

AppearanceTransformation

Recommendation

PreferenceSignal

InteractionEvent

Campaign

AIModel

AIModelVersion

Integration

User

Role
```

---

# 31. Database

Recommended initial database:

```text
PostgreSQL
```

Optional:

```text
Redis
```

for:

* queues
* cache
* sessions
* model jobs

Object storage:

```text
MinIO
```

when generated images must be temporarily stored.

---

# 32. Job Queue

Generative inference must NOT block normal API operations.

Architecture:

```text
API
↓
Job Queue
↓
AI Worker
↓
GPU
↓
Result
```

Possible open-source technologies:

```text
Redis
Celery / Dramatiq
```

---

# 33. Performance Targets

Initial targets:

Person detection:

```text
< 100 ms
```

Pose/segmentation:

```text
< 300 ms
```

VTON MVP:

```text
< 10 sec
```

Target optimized VTON:

```text
< 3 sec
```

Interactive storefront should begin displaying useful content before heavy generation finishes.

---

# 34. Quality Metrics

Do not judge the system only by whether generation completed.

Track:

```text
Identity Preservation

Garment Preservation

Logo Preservation

Texture Preservation

Pose Consistency

Hand Artifacts

Face Artifacts

Body Geometry

Background Preservation

Generation Time

GPU Memory

Failure Rate
```

Create automated benchmark datasets.

---

# 35. Before / After Comparison

Every transformation module should support comparison.

```text
ORIGINAL
    │
    ├── LOOK A
    ├── LOOK B
    └── LOOK C
```

UI should support:

* side-by-side
* slider
* gallery
* favorite
* compare
* reset

---

# 36. Smart Automatic Try-On

One major differentiator of OpenFit:

The user does not always need to choose clothing manually.

```text
Person enters camera view
↓
Person analysis
↓
Available inventory
↓
Recommendation Engine
↓
Top 3
↓
Automatic Try-On
↓
Display
```

This is especially important for storefront installations.

---

# 37. Adaptive Recommendation

After each generated look:

```text
Observe interaction
↓
Update preference vector
↓
Re-rank products
↓
Generate next recommendation
```

Example:

```text
Black Jacket
High Preference

↓ system learns

Dark colors ↑
Jacket category ↑
Similar style ↑
```

The next recommendations adapt during the same session.

---

# 38. Analytics Without Identity

We should be able to answer:

```text
1,284 visitors detected

382 interacted

210 Try-On sessions

Product #104:
  83 previews
  31 likes
  14 saves

Product #208:
  62 previews
  8 likes
```

without knowing who those visitors are.

---

# 39. Future Multi-Modal Assistant

Future versions may include a local/open-source multimodal assistant.

Example:

Customer:

> یک کت رسمی‌تر نشانم بده.

System:

```text
intent = formal
category = jacket
```

Then:

```text
Catalog Search
↓
Recommendation
↓
Try-On
```

Or in salon:

> موهام رو کمی کوتاه‌تر و تیره‌تر کن.

The assistant converts natural language into Appearance Engine parameters.

No proprietary AI API should be mandatory.

---

# 40. Deployment Goal

Eventually the entire platform should run using:

```bash
docker compose up -d
```

Services:

```text
openfit-api
openfit-admin
openfit-client
openfit-worker
openfit-ai
postgres
redis
minio
```

GPU workers may run independently.

---

# 41. Development Strategy

Do NOT attempt to implement every feature simultaneously.

Initial technical milestone:

```text
Camera/Image
↓
Person Detection
↓
Segmentation/Pose
↓
Product Catalog
↓
Virtual Try-On
↓
Compare
↓
Preference Event
```

After this pipeline is stable, add:

```text
Recommendation
Storefront
Body Transformation
Salon
Analytics
Real-Time Video
```

---

# 42. Definition of Success

OpenFit AI succeeds when a person can stand in front of a camera and the platform can:

1. Detect the person.
2. Understand enough visual context for the requested experience.
3. Obtain available products.
4. Recommend relevant options.
5. Generate realistic virtual appearances.
6. Preserve identity.
7. Allow controlled appearance modifications.
8. Learn preference signals from interaction.
9. Provide useful anonymous analytics.
10. Work in clothing and salon environments.
11. Operate using open-source technology.
12. Remain independent from any ERP.
13. Integrate with external systems through APIs.
14. Run locally where privacy or latency requires it.

---

# 43. Guiding Architectural Rule

Every new feature must answer:

> Is this capability part of the OpenFit core, an AI provider, an integration, or a client experience?

Do not mix these layers.

The long-term platform should remain:

```text
              OpenFit AI Core
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    Fashion        Beauty       Accessories
       │             │             │
       └─────────────┼─────────────┘
                     │
              Recommendation
                     │
                Analytics
                     │
              Integration API
                     │
        ┌────────────┼────────────┐
        │            │            │
     iMonitor     REST API      CSV/Other
```

The product is not merely a Virtual Try-On application.

The target is an **Open-Source Intelligent Virtual Appearance Platform**.

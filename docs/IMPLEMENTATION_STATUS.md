# Implementation Status

## Runnable now
Frontend, local API, image analysis, webcam stream, pose landmarks, person segmentation, face detection, normalized body geometry, hardware telemetry.

## Prototype only
Canvas clothing overlay, fabric visual effects, body transformation UI, salon previews, preference/demo flows.

## Not implemented
Metric anthropometry, biometric identity, production VTON, production hair synthesis, demographics/emotion inference, persistence, queue/worker, iMonitor catalog adapter.

## Acceptance rule
Do not move an item to runnable/completed until it has real code, clean-clone installation instructions and a reproducible test.

## Cameras
- RUNNABLE: laptop/standard USB RGB webcam
- PLANNED: camera-provider abstraction and device selection
- PLANNED: Xbox One Kinect / Kinect v2 RGB-D provider via Microsoft Kinect for Windows SDK 2.0
- PLANNED: generic RGB-D provider contract for additional cameras
- RULE: Kinect/RGB-D dependencies must remain optional and must not break RGB-only installation.

## Runtime diagnostics — 2026-09-22
- Header latency is now measured from the real backend health request instead of a hard-coded value.
- A persistent API/CAM diagnostic badge is shown in the UI.
- Browser console logs camera start/failure and backend health.
- Live try-on shows real inference latency/errors.
- Windows launcher starts Uvicorn with debug + access logs.
- SalonMode remains a prototype using catalog images; it is not yet wired to the live camera. Do not interpret camera activation while on SalonMode as a salon camera pipeline.

## Visible CV baseline — 2026-09-22
- Live fitting room now renders real MediaPipe pose landmarks/skeleton over the camera.
- A vector AR garment follows real shoulders/hips so tracking can be tested without pretending catalog photos are VTO-ready assets.
- Existing Unsplash catalog photos are reference/product photos, not transparent garment masks; their texture overlay is intentionally low-opacity.
- Salon now supports the shared live camera and real face detection. Current hair color overlay is a geometric preview only, not HairFast-GAN/generative hair synthesis.
- Production garment VTO requires garment preprocessing/masks or a reviewed VTON provider. Production hairstyle transfer requires a reviewed hair synthesis provider.


## Appearance step 2 — 2026-09-22
- Live garment baseline now articulates torso and sleeves from real shoulder/hip/elbow/wrist landmarks.
- Full-person catalog photos are not painted onto the body; transparent garment assets/masks are the next asset requirement.
- Salon uses real MediaPipe Face Mesh. Hair color preview follows upper-face/scalp geometry instead of the old forehead ellipse.
- Hair preview is NOT semantic hair segmentation and NOT generative hairstyle synthesis.
- CatVTON/face identity registry entries are no longer shown as active runtime capabilities without implementation/verification.


## Complete Look v1 — 2026-09-22
- Added repository-owned transparent `Classic Shirt v1` asset and a live renderer anchored to real shoulders/hips with articulated sleeves following elbows/wrists.
- Added repository-owned transparent `Classic Short Hair v1` asset. Salon fits it above the detected face and applies the selected hair color locally.
- Fixed camera geometry in live fitting room and Salon: render surfaces now use the camera's real videoWidth/videoHeight and 16:9/object-contain presentation instead of forcing 720x960 portrait stretching.
- Live fitting room includes garment opacity, snapshot and fullscreen controls. Existing product/color/size/catalog controls remain integrated.
- Salon keeps before/after comparison, hairstyle selection and color controls. The first actually rendered hairstyle is explicitly marked LOCAL AR.
- Removed the visible HairFast-GAN / fabricated 96.2% edge-preservation claim from the live Salon status.
- LIMIT: Classic Shirt v1 and Classic Short Hair v1 are deterministic local AR assets, not diffusion/generative synthesis. General catalog garments still require preprocessing/masks and generalized warp.


## Reference UI + compositor correction — 2026-09-22
- Rebuilt Fitting Room as a calmer three-column reference workspace: catalog, large live mirror, selected-look details. Removed the old fake customer-identification/centimeter-size UI from this production view.
- Backend now returns the real MediaPipe person segmentation mask as PNG/base64 with analysis results.
- Live garment rendering uses a transparent garment asset, pose-derived placement, luminance-preserving dye/shading and segmentation-mask occlusion instead of the previous flat torso polygon.
- The previous painted/cartoon hairstyle overlay has been removed. Salon does not fabricate transformed hair while a real hair segmentation/synthesis provider is absent.
- Remaining gap to photorealistic reference quality: generalized garment preprocessing + TPS/piecewise deformation and a reviewed generative VTO provider; for Salon, semantic hair segmentation + reviewed hairstyle synthesis.

## Photorealistic try-on pipeline — 2026-09-22
- `backend/vto/` implements the real try-on path end to end: pose -> agnostic
  mask -> letterbox -> generative engine -> restore -> composite.
- Two real engines behind one contract. `diffusers-inpaint` (SD inpainting +
  IP-Adapter garment conditioning) installs from `backend/requirements-vto.txt`
  and runs in roughly 6 GB VRAM. `external` delegates to a separately installed
  CatVTON/IDM-VTON checkout via `FITAI_VTO_COMMAND`. No weights are vendored.
- `/api/v1/render/vto` now runs the pipeline and takes a garment category.
  `/api/v1/render/providers` and the `photorealistic_vto` health capability are
  reported from the engine registry, so the UI cannot claim a capability the
  machine does not have. A failed render returns 503/422; it is never replaced
  with drawn artwork.
- New `simple_tryon` screen is the default mode: photo -> garment -> result.
- `backend/vto/measure.py` adds calibrated metric measurement and size
  suggestion. Centimetres stay `None` until a known-height calibration is done,
  per the PROJECT_MEMORY truthfulness rule.
- 39 tests run in CI on numpy + Pillow only: no GPU, no weights, no camera.
- CORRECTION: the development machine's GPU is an RTX 4060 Laptop (8 GB), not
  the Quadro P1000 4 GB recorded earlier. 8 GB changes what is feasible locally.

## Try-on verified against a real photograph — 2026-09-22
Run on Python 3.10 + mediapipe 0.10.20 + torch 2.5.1+cu121, RTX 4060 8 GB.

RUNNABLE, verified on an actual person photo:
- MediaPipe pose on a real photo: 33 landmarks, 28 clearly visible.
- Agnostic mask for all three categories: torso/sleeves for `upper` stopping at
  the neck line, the full flared skirt for `lower`, neck-down for `overall`.
  Face and hair untouched in every category.
- Metric measurement correctly WITHHELD height because the subject's feet were
  outside the frame, which is the intended behaviour.
- 41 CPU-only tests green.

Two real bugs were found by that run and fixed; neither was visible against
the synthetic reference pose:
- MediaPipe `model_complexity=2` aborts with an access violation (0xC0000005)
  on mediapipe 0.10.20 / Windows. Default is now complexity 1, overridable via
  `FITAI_POSE_COMPLEXITY`. This also means the launcher's Python 3.11/3.12
  requirement should NOT be relaxed on the basis that pose works on 3.10.
- The mask was built from the skeleton alone and missed a flared skirt's real
  hem, so the old garment would have survived the repaint. The segmentation
  silhouette is now unioned in, with pose deciding only which part of it the
  category owns.

## Mask, resolution and garment framing — 2026-09-22

The engine now decides two things the pipeline used to fix for it.

MASK PROFILE. A regenerating engine paints new clothing into the hole and
needs room past the body; a warping engine stretches the garment to fill
whatever it is given, so every pixel past the garment's real hem becomes
stretched fabric. `diffusers-inpaint` asks for `generous`, `external` for
`tight`. Measured on the reference photo: 18.4% of frame -> 14.8%.

That fix took two attempts, and the first one did nothing. The mask is the
union of a drawn band and the segmentation silhouette, and only the band was
scaled by the profile - the silhouette's lower bound kept a hard-coded 0.34
torso-lengths below the hips. Since the silhouette covers the whole worn
outfit it simply overrode the band, and both profiles came out within 0.3% of
each other on a real photo. The unit test missed it because it passed no
silhouette, while the real path always does; there is now a test that does.

RESOLUTION. Engines declare what they were trained at, and the pipeline uses
it. CatVTON's checkpoints are 768x1024 and were being run at 576x768. Native
resolution costs about 50 s per image instead of 31 s on an RTX 4060.

GARMENT FRAMING. `trim_garment_border` crops the uniform backdrop before
conditioning, since a garment filling a third of its photo spent two thirds of
the signal describing the backdrop. Background colour is sampled from the
border rather than assumed white, and an implausible crop returns the original
untouched. Measured: 1000x1334 -> 1000x997 on a catalog shot.

REMAINING, both measured and neither fixable in FitAI's code:
- A band of stretched garment still appears across the skirt on roughly one
  run in three, down from most runs. Regenerating is the remedy, which the
  try-on screen offers.
- Text and logos come out mirrored. Verified not to be a pipeline transform:
  the garment reads correctly at every stage up to the engine, so this is the
  model. A shop selling branded goods will notice.

## CatVTON wired up, and what it showed about garment photography — 2026-09-22

RUNNABLE: the `external` engine now drives CatVTON through
`backend/vto/adapters/catvton_adapter.py`. ~31 s per image at 576x768 / 40
steps on an RTX 4060. CatVTON needs no text encoder and accepts a supplied
mask, so FitAI's own mask is used and CatVTON's DensePose + SCHP mask stack
(750 MB) is neither downloaded nor required. Its code and checkpoints stay
outside the repository; the adapter refuses to run unless CATVTON_ROOT points
at an operator-installed checkout.

THE FINDING THAT MATTERS MOST. Garment photography, not the model, decides
whether try-on works. Same person, same mask, same engine, only the garment
input changed:

- A leather jacket folded diagonally on a crumpled sheet - the kind of photo a
  shop actually has lying around - produced a mangled leather crop top on
  every seed, on both engines.
- Standard in-shop product shots (garment upright, front-facing, flat, plain
  background) transferred correctly: a cardigan kept its green placket,
  buttons and full-length sleeves; a sleeveless knit vest kept its cut and a
  legible printed graphic; a sports jersey kept its shoulder stripes and
  number.

So `src/data/catalog.ts` cannot feed this pipeline, and neither can casual
flat-lays. The asset requirement is an in-shop product photograph per SKU.

KNOWN ARTIFACT: CatVTON stretches the garment to fill the whole masked
region, so where the `upper` mask extends below the garment's real hem the
fabric is stretched into a band across the skirt. The mask is currently tuned
generously for the diffusers engine, which needs the room. Tightening it per
engine is not done yet.

Also fixed here: the external engine could not launch a quoted command on
Windows, which made it unusable on the target platform.

## Generation verified — 2026-09-22
RTX 4060 Laptop 8 GB, weights mirrored from ModelScope, fully offline.

RUNNABLE: `diffusers-inpaint` produces real photorealistic try-on images.
9-10 s per image at 576x768 / 34 steps once the pipeline is resident, ~22 s
including the first load. Face, hair, hands and everything outside the mask
come back bit-exact from the original photograph.

Two real defects were found and fixed by the first runs:
- `enable_attention_slicing()` replaced every UNet attention processor,
  including the IP-Adapter ones, and generation died in the first
  cross-attention block. It is not used; torch SDPA already fits 8 GB.
- `guidance_scale` defaulted to 2.5, which was too weak for the garment image
  to win against the text prompt: a black leather jacket came out as a grey
  utility shirt. Measured against 6.0, which reproduces the jacket. Default is
  now 6.0, and IP-Adapter scale 0.85 -> 1.0.

MEASURED LIMIT: garment structure is not reproducible run to run. Across four
seeds at the corrected settings, three produced a correct sleeved biker jacket
and one produced a sleeveless leather top. Colour and material transferred in
all four. This is the expected behaviour of IP-Adapter style conditioning
rather than a garment-warping VTON model, and it is why the `external` engine
exists. The try-on screen therefore offers an explicit regenerate button.

A second consequence: where the mask covers the arms so sleeves can be drawn,
a result that renders bare arms regenerates that skin rather than restoring
it, so skin tone can shift slightly on those runs.

EARLIER BLOCKER, now resolved: the weights could not be downloaded from
Hugging Face on this network. `huggingface.co` is reachable, but every LFS download redirects
to `us.aws.cdn.hf.co`, which refuses the TLS connection - direct, through the
configured proxy at 127.0.0.1:10808, and under both OpenSSL (Python) and
schannel (curl). `hf-mirror.com` serves metadata but not LFS either. This is a
network reachability problem, not a code problem; `scripts/fetch_vto_weights.py
--diagnose` reports which hop fails, and `--check` prints the cache directory
so weights can be fetched elsewhere and copied in.

## Runtime resilience hotfix — 2026-09-22
- Removed per-frame base64 segmentation PNG from the 8 Hz analysis response; pose/face live transport is lightweight again.
- Serialized access to stateful MediaPipe graphs to prevent concurrent fitting-room/salon inference instability.
- Garment compositor now has a visible fallback placement and no longer disappears just because one AI request fails. Real pose tracking replaces fallback automatically when available.
- Salon now renders a live hair-color preview over the real camera texture. This is hair recoloring, not hairstyle synthesis; hairstyle generation remains pending a reviewed model/provider.
- Windows launcher now refuses to start the frontend until /api/v1/health confirms the backend is actually online.

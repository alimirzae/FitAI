# Model / Runtime License Matrix

| Component | Purpose | License | Commercial default |
|---|---|---|---|
| OpenCV | image/camera processing | Apache-2.0 | Yes |
| MediaPipe | pose/segmentation/face geometry | Apache-2.0 framework | Yes, subject to bundled asset audit |
| FastAPI | local API | MIT | Yes |
| CatVTON code/checkpoints | diffusion VTO | CC BY-NC-SA 4.0 | **No** |
| IDM-VTON code/checkpoints | diffusion VTO | CC BY-NC-SA 4.0 | **No** |
| StableVITON | diffusion VTO | CC BY-NC-SA 4.0 | **No** |
| HairFastGAN repository code | hairstyle transfer | MIT | Conditional: audit every pretrained dependency/weight |
| FitAI external provider adapter | model integration | project license | Yes |

Source-code and pretrained-weight licenses are separate gates. A provider cannot be enabled in a commercial release until code, checkpoint, training-data/derivative constraints and redistribution terms are reviewed.

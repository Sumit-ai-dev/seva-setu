# ML — Machine Learning

Indian Sign Language (ISL) detection module for Nexus Health.

## Structure

```
ml/
├── isl_feature/
│   ├── inference/
│   │   └── isl_detector.py       # Real-time ISL gesture detection
│   └── training/
│       ├── train.py              # Model training pipeline
│       ├── train_dard_only.py    # DARD-only training variant
│       └── convert_to_tfjs.py   # TensorFlow.js export
├── hand_landmarker.task          # MediaPipe hand landmark model
├── extract_landmarks.py          # Landmark extraction from video
├── export_tfjs.py               # TF.js model export utility
└── train_isl.py                 # Main training entry point
```

## Technology

- **Google MediaPipe** — Hand landmark detection
- **TensorFlow / Keras** — Model training
- **TensorFlow.js** — Browser-based inference

## Usage

```bash
# Extract landmarks from ISL dataset
python ml/extract_landmarks.py

# Train the model
python ml/train_isl.py

# Export to TensorFlow.js for browser inference
python ml/export_tfjs.py
```

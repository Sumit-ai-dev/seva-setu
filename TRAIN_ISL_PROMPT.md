# ISL Model Training — Instructions

## Context

Project: **Swasthya Setu** — rural healthcare triage app for ASHA workers.
Repo root: `swasth-scaler/`

The ISL (Indian Sign Language) pipeline is:
**Webcam → MediaPipe Hands (21 landmarks) → normalize to Float32[63] → TF.js MLP → one of 10 symptom labels**

---

## 10 Sign Classes

| class_id | Sign ID       | English          | Urgency  | ICD-10  |
|----------|---------------|------------------|----------|---------|
| 0        | DARD          | Pain             | HIGH     | R52     |
| 1        | BUKHAR        | Fever            | HIGH     | R50.9   |
| 2        | SAR-DARD      | Headache         | MEDIUM   | R51     |
| 3        | PET-DARD      | Stomach Pain     | HIGH     | R10.9   |
| 4        | ULTI          | Vomiting/Nausea  | MEDIUM   | R11.2   |
| 5        | KHANSI        | Cough            | MEDIUM   | R05.9   |
| 6        | SANS-TAKLEEF  | Breathlessness   | CRITICAL | R06.00  |
| 7        | SEENE-DARD    | Chest Pain       | CRITICAL | R07.9   |
| 8        | CHAKKAR       | Dizziness        | MEDIUM   | R42     |
| 9        | KAMZORI       | Weakness/Fatigue | MEDIUM   | R53.83  |
| 10       | UNKNOWN       | (reserved)       | —        | —       |

**CRITICAL signs (SANS-TAKLEEF, SEENE-DARD):** model must output on FIRST qualifying frame.
Recall gate: ≥ 0.97 — do NOT deploy if either fails.

---

## Files

| File | What it is |
|------|-----------|
| `frontend/public/tfjs_model/model.json` | TF.js Sequential MLP, input `[null, 63]`, 11 output classes |
| `frontend/public/tfjs_model/group1-shard1of1.bin` | Weights shard |
| `frontend/public/label_classes.json` | 11 class labels in exact order (class_id 0–10) |
| `frontend/public/isl_sign_data.json` | Full sign metadata: keypoints, differentials, thresholds |
| `frontend/isl_model.h5` | Keras H5 model (source of truth for TF.js conversion) |
| `frontend/training_data.json` | Training dataset — dict keyed by sign ID |
| `isl_feature/inference/isl_detector.py` | Backend ISLDetector class |
| `train_isl.py` | Training script |

---

## Model Architecture

```
Input: (63,)
Dense(128, activation='relu')
BatchNormalization(momentum=0.99, epsilon=0.001)
Dropout(0.3)
Dense(64, activation='relu')
BatchNormalization(momentum=0.99, epsilon=0.001)
Dropout(0.2)
Dense(11, activation='softmax')   ← 10 signs + UNKNOWN
```

Loss: `sparse_categorical_crossentropy`
Optimizer: `adam`
Output order MUST match `label_classes.json`.

---

## Training Data Format

`frontend/training_data.json`:
```json
{
  "DARD":          [ [63 floats], ... ],
  "BUKHAR":        [ [63 floats], ... ],
  "SAR-DARD":      [ [63 floats], ... ],
  "PET-DARD":      [ [63 floats], ... ],
  "ULTI":          [ [63 floats], ... ],
  "KHANSI":        [ [63 floats], ... ],
  "SANS-TAKLEEF":  [ [63 floats], ... ],
  "SEENE-DARD":    [ [63 floats], ... ],
  "CHAKKAR":       [ [63 floats], ... ],
  "KAMZORI":       [ [63 floats], ... ],
  "UNKNOWN":       [ [63 floats], ... ]
}
```

Each sample = 21 MediaPipe hand landmarks × (x, y, z), wrist-centred, scaled by wrist→middle-MCP.
Minimum samples: 80/sign/lighting condition (see master training prompt §5A).

---

## Workflow

### 1. Collect data
Collect samples via the frontend camera page. Save to `frontend/training_data.json`.

### 2. Train
```bash
cd swasth-scaler
python train_isl.py
# optional:
python train_isl.py --epochs 100 --batch 64 --data path/to/data.json
```

### 3. Check critical gates
Training script prints per-class recall. Both critical signs need ≥ 0.97:
```
Critical gate SANS-TAKLEEF: recall=0.972  ✓ PASS
Critical gate SEENE-DARD:   recall=0.981  ✓ PASS
```

### 4. Convert to TF.js
```bash
tensorflowjs_converter --input_format=keras \
    frontend/isl_model.h5 \
    frontend/public/tfjs_model/
```

### 5. Restart backend
```bash
uvicorn main:app --reload
```

---

## Confidence Thresholds (per class)

| Sign          | Min confidence | Escalate at |
|---------------|----------------|-------------|
| DARD          | 0.78           | 0.70        |
| BUKHAR        | 0.82           | 0.70        |
| SAR-DARD      | 0.80           | —           |
| PET-DARD      | 0.76           | 0.70        |
| ULTI          | 0.84           | —           |
| KHANSI        | 0.88           | —           |
| SANS-TAKLEEF  | 0.85           | **0.60**    |
| SEENE-DARD    | 0.86           | **0.60**    |
| CHAKKAR       | 0.79           | —           |
| KAMZORI       | 0.75           | —           |

---

## Prohibited

- Do NOT deploy if SANS-TAKLEEF or SEENE-DARD recall < 0.97
- Do NOT train on synthetic poses only
- Do NOT use temporal reversal augmentation
- Do NOT report only aggregate accuracy — per-class breakdown is mandatory

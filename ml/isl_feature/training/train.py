"""
train.py — ISL v2.0 training pipeline
───────────────────────────────────────────────────────────────────────────────
Trains the 12-class (10 signs + UNCERTAIN + NO_SIGN) MLP on the 98-video
dataset at C:\\Users\\jayan\\Desktop\\vedios\\.

Pipeline:
  1. Walk video dir, parse label from filename (e.g. BUKHAR_1.mp4 -> BUKHAR)
  2. Per frame: MediaPipe Hands -> 126-float feature vector
                (right[63] + left[63], wrist-centred, palm-width normalised)
     — matches islNormalize.js and isl_detector.py exactly
  3. Augment: horizontal flip (swap hands, negate x), gaussian noise (σ=0.005)
  4. Synthesise NO_SIGN samples (zero vector + noise) so the network learns
     the idle state. UNCERTAIN stays reserved (model never trained to emit it,
     but the class index is preserved for runtime use).
  5. Train MLP 126 → 256 → 128 → 12 with dropout + early stopping
  6. Export:
       frontend/isl_model.h5                   (backend Keras)
       frontend/public/tfjs_model/model.json   (frontend TF.js)
       frontend/public/tfjs_model/label_classes.json

Run:
    cd isl_feature/training
    python train.py --video-dir "C:/Users/jayan/Desktop/vedios"
───────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

import urllib.request

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions, HandLandmarker
from mediapipe.tasks.python.core.base_options import BaseOptions
from sklearn.model_selection import train_test_split

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks

# ── Labels (must match islInference.js and isl_detector.py) ───────────────────
LABELS = [
    "DARD", "BUKHAR", "SAR-DARD", "PET-DARD", "ULTI",
    "SANS-TAKLEEF", "SEENE-DARD", "CHAKKAR", "KAMZORI",
    "UNCERTAIN", "NO_SIGN",
]
LABEL_TO_IDX = {lbl: i for i, lbl in enumerate(LABELS)}
TRAINABLE_SIGNS = set(LABELS[:9])  # 9 real signs
NO_SIGN_IDX     = LABEL_TO_IDX["NO_SIGN"]

# ── Config ────────────────────────────────────────────────────────────────────
FRAME_STRIDE   = 1       # sample every frame (not every 2nd) — extract more CHAKKAR samples
NOISE_SIGMA    = 0.005
AUG_PER_SAMPLE = 4       # increased from 2: more augmentation for better CHAKKAR learning
NO_SIGN_RATIO  = 0.10    # 10% synthetic idle samples
BATCH_SIZE     = 64
EPOCHS         = 120     # increased from 80: more training epochs for convergence
VAL_SPLIT      = 0.15
RANDOM_SEED    = 42

np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)


# ── Normalisation (mirrors islNormalize.js / isl_detector.py) ─────────────────
def normalize_hand(landmarks_xyz: np.ndarray) -> np.ndarray:
    """landmarks_xyz: (21, 3). Returns (63,) float32."""
    wrist = landmarks_xyz[0]
    mcp   = landmarks_xyz[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    return ((landmarks_xyz - wrist) / scale).flatten().astype(np.float32)


# ── HandLandmarker model path / download ──────────────────────────────────────
def _get_landmarker_model() -> str:
    """
    Returns path to hand_landmarker.task, downloading it if not present.
    Looks next to the frontend/model/ directory that ships with the repo.
    """
    candidates = [
        Path(__file__).resolve().parents[2] / "frontend" / "model" / "hand_landmarker.task",
        Path(__file__).resolve().parents[2] / "hand_landmarker.task",
        Path(__file__).resolve().parent / "hand_landmarker.task",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    # Download to training dir
    dest = Path(__file__).resolve().parent / "hand_landmarker.task"
    print("Downloading hand_landmarker.task (~9 MB)...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task",
        str(dest),
    )
    print("Downloaded.")
    return str(dest)


# ── Feature extraction (Tasks API — captures fists + self-occluded poses) ─────
def extract_video_features(video_path: Path, detector: HandLandmarker) -> list[np.ndarray]:
    """Return list of 126-float vectors, one per usable frame."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"  [WARN] could not open {video_path.name}")
        return []

    feats: list[np.ndarray] = []
    frame_idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if frame_idx % FRAME_STRIDE != 0:
            frame_idx += 1
            continue
        frame_idx += 1

        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = detector.detect(mp_image)   # IMAGE mode — synchronous

        if not result.hand_landmarks:
            continue

        # Sort by wrist x-position for consistent L/R assignment (matches inference)
        hand_data = sorted(
            [(lm_group[0].x, lm_group) for lm_group in result.hand_landmarks],
            key=lambda t: t[0],
        )

        right = np.zeros(63, dtype=np.float32)
        left  = np.zeros(63, dtype=np.float32)
        for rank, (_, lm_group) in enumerate(hand_data):
            pts    = np.array([[lm.x, lm.y, lm.z] for lm in lm_group], dtype=np.float32)
            normed = normalize_hand(pts)
            if rank == 0:
                left  = normed   # leftmost wrist = left hand
            else:
                right = normed

        feats.append(np.concatenate([right, left]))

    cap.release()
    return feats


# ── Augmentation ──────────────────────────────────────────────────────────────
def augment_flip(v: np.ndarray) -> np.ndarray:
    """Swap right/left halves and negate x coordinates."""
    right, left = v[:63].copy(), v[63:].copy()
    def flip_half(h):
        h = h.reshape(21, 3)
        h[:, 0] *= -1.0
        return h.flatten()
    return np.concatenate([flip_half(left), flip_half(right)]).astype(np.float32)

def augment_noise(v: np.ndarray) -> np.ndarray:
    return (v + np.random.normal(0, NOISE_SIGMA, v.shape)).astype(np.float32)


# ── Filename → label ──────────────────────────────────────────────────────────
_FNAME_RE = re.compile(r"^([A-Z\-]+)_\d+", re.IGNORECASE)

def label_from_filename(name: str) -> str | None:
    m = _FNAME_RE.match(Path(name).stem.upper())
    if not m:
        return None
    lbl = m.group(1)
    return lbl if lbl in TRAINABLE_SIGNS else None


# ── Dataset build ─────────────────────────────────────────────────────────────
def build_dataset(video_dir: Path):
    # Tasks API HandLandmarker: better fist + self-occlusion detection than legacy API
    model_path = _get_landmarker_model()
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        num_hands=2,
        min_hand_detection_confidence=0.40,   # lower: catch fists and partial hands
        min_hand_presence_confidence=0.40,    # key param — keeps tracking occluded poses
        min_tracking_confidence=0.40,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
    mp_hands = HandLandmarker.create_from_options(options)

    X: list[np.ndarray] = []
    y: list[int] = []
    per_class_counts: dict[str, int] = {lbl: 0 for lbl in TRAINABLE_SIGNS}

    videos = sorted(video_dir.glob("*.mp4"))
    print(f"Found {len(videos)} videos in {video_dir}")

    for vi, vp in enumerate(videos, 1):
        lbl = label_from_filename(vp.name)
        if lbl is None:
            print(f"  [SKIP] {vp.name} — no matching label")
            continue
        feats = extract_video_features(vp, mp_hands)
        print(f"  [{vi:3d}/{len(videos)}] {vp.name:25s} -> {lbl:12s} "
              f"({len(feats)} frames)")
        idx = LABEL_TO_IDX[lbl]
        for f in feats:
            X.append(f);               y.append(idx)
            X.append(augment_noise(f)); y.append(idx)
            X.append(augment_flip(f));  y.append(idx)
        per_class_counts[lbl] += len(feats)

    mp_hands.close()  # HandLandmarker.close()

    # Synthesise NO_SIGN samples — three varieties so the model learns
    # "hand visible but not a known sign" is not the same as a real sign.
    total_real = len(X)
    n_no_sign  = max(int(total_real * NO_SIGN_RATIO), 50)

    rng = np.random.default_rng(RANDOM_SEED)

    def _random_hand_pose() -> np.ndarray:
        """
        Plausible-looking 63-float hand vector: wrist at origin,
        fingers spread in random directions — mimics an open palm.
        """
        pts = rng.standard_normal((21, 3)).astype(np.float32) * 0.3
        pts[0] = 0.0  # wrist at origin (normalised)
        scale = float(np.linalg.norm(pts[9])) or 1.0
        return (pts / scale).flatten()

    for i in range(n_no_sign):
        kind = i % 3
        if kind == 0:
            # Classic: near-zero vector (no hand / idle)
            v = rng.normal(0, NOISE_SIGMA, 126).astype(np.float32)
        elif kind == 1:
            # Random open-palm pose (right hand only, left zeroed)
            v = np.concatenate([_random_hand_pose(),
                                 np.zeros(63, dtype=np.float32)])
        else:
            # Random open-palm pose (both hands — common when not signing)
            v = np.concatenate([_random_hand_pose(), _random_hand_pose()])
        X.append(v)
        y.append(NO_SIGN_IDX)

    X_arr = np.stack(X)
    y_arr = np.array(y, dtype=np.int64)
    print("\nPer-class raw frame counts:")
    for lbl, c in per_class_counts.items():
        print(f"  {lbl:13s} {c}")
    print(f"  NO_SIGN       {n_no_sign} (synthetic)")
    print(f"Total samples (incl. aug): {len(X_arr)}  shape={X_arr.shape}")
    return X_arr, y_arr


# ── Model ─────────────────────────────────────────────────────────────────────
def build_model(num_classes: int = 12) -> tf.keras.Model:
    m = models.Sequential([
        layers.Input(shape=(126,)),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.35),
        layers.Dense(128, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.25),
        layers.Dense(64, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])
    m.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return m


# ── Export ────────────────────────────────────────────────────────────────────
def export_model(model: tf.keras.Model, frontend_root: Path):
    h5_path = frontend_root / "isl_model.h5"
    h5_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(h5_path)
    print(f"Saved Keras model -> {h5_path}")

    tfjs_dir = frontend_root / "public" / "tfjs_model"
    tfjs_dir.mkdir(parents=True, exist_ok=True)
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, str(tfjs_dir))
        print(f"Saved TF.js model -> {tfjs_dir}")
    except ImportError:
        print("[WARN] tensorflowjs not installed — skipping TF.js export.")
        print("       pip install tensorflowjs  then re-run, or convert manually:")
        print(f"       tensorflowjs_converter --input_format=keras {h5_path} {tfjs_dir}")

    with open(tfjs_dir / "label_classes.json", "w", encoding="utf-8") as f:
        json.dump(LABELS, f, indent=2)
    print(f"Saved label_classes.json -> {tfjs_dir / 'label_classes.json'}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-dir", default=r"C:/Users/jayan/Desktop/vedios")
    ap.add_argument("--frontend-root", default=None,
                    help="Path to frontend/ (auto-detected if omitted)")
    args = ap.parse_args()

    video_dir = Path(args.video_dir)
    if not video_dir.exists():
        print(f"Video dir not found: {video_dir}")
        sys.exit(1)

    if args.frontend_root:
        frontend_root = Path(args.frontend_root)
    else:
        # isl_feature/training/train.py -> ../../frontend
        frontend_root = Path(__file__).resolve().parents[2] / "frontend"
    print(f"Frontend root: {frontend_root}")

    # 1. Build dataset
    X, y = build_dataset(video_dir)

    # 2. Split
    X_tr, X_val, y_tr, y_val = train_test_split(
        X, y, test_size=VAL_SPLIT, stratify=y, random_state=RANDOM_SEED
    )
    print(f"Train: {X_tr.shape}  Val: {X_val.shape}")

    # 3. Class weights (handle imbalance)
    unique, counts = np.unique(y_tr, return_counts=True)
    total = counts.sum()
    class_weight = {int(c): float(total / (len(unique) * n))
                    for c, n in zip(unique, counts)}
    # Keras requires weight for every class 0..num_classes-1
    for i in range(len(LABELS)):
        class_weight.setdefault(i, 1.0)
    print(f"Class weights: {class_weight}")

    # 4. Train
    model = build_model(num_classes=len(LABELS))
    model.summary()

    cbs = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=12,
                                restore_best_weights=True),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5,
                                    patience=5, min_lr=1e-5),
    ]
    model.fit(
        X_tr, y_tr,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weight,
        callbacks=cbs,
        verbose=2,
    )

    # 5. Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nFinal val accuracy: {val_acc:.4f}   loss: {val_loss:.4f}")

    # 6. Export
    export_model(model, frontend_root)
    print("\nTraining complete.")


if __name__ == "__main__":
    main()

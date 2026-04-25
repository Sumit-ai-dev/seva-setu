"""
train_dard_only.py — DARD-only retraining
───────────────────────────────────────────────────────────────────────────────
Trains a 2-class model (DARD + NO_SIGN) on only DARD videos for focused
optimization. Use this to maximize DARD detection accuracy.

Run:
    cd isl_feature/training
    source train_env/Scripts/activate
    python train_dard_only.py --video-dir "C:/Users/jayan/Desktop/vedios"
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

# ── DARD-only labels ──────────────────────────────────────────────────────────
LABELS = ["DARD", "NO_SIGN"]
LABEL_TO_IDX = {lbl: i for i, lbl in enumerate(LABELS)}
DARD_IDX = LABEL_TO_IDX["DARD"]
NO_SIGN_IDX = LABEL_TO_IDX["NO_SIGN"]

# ── Config ────────────────────────────────────────────────────────────────────
FRAME_STRIDE   = 1       # sample every frame
NOISE_SIGMA    = 0.005
AUG_PER_SAMPLE = 4       # flip + noise variants
NO_SIGN_RATIO  = 0.15    # 15% synthetic idle samples (more for 2-class)
BATCH_SIZE     = 32      # smaller batch for focused training
EPOCHS         = 150     # more epochs for 2-class convergence
VAL_SPLIT      = 0.15
RANDOM_SEED    = 42

np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)


# ── Normalisation ─────────────────────────────────────────────────────────────
def normalize_hand(landmarks_xyz: np.ndarray) -> np.ndarray:
    """landmarks_xyz: (21, 3). Returns (63,) float32."""
    wrist = landmarks_xyz[0]
    mcp   = landmarks_xyz[9]
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    return ((landmarks_xyz - wrist) / scale).flatten().astype(np.float32)


# ── HandLandmarker model path ─────────────────────────────────────────────────
def _get_landmarker_model() -> str:
    candidates = [
        Path(__file__).resolve().parents[2] / "frontend" / "model" / "hand_landmarker.task",
        Path(__file__).resolve().parents[2] / "hand_landmarker.task",
        Path(__file__).resolve().parent / "hand_landmarker.task",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    dest = Path(__file__).resolve().parent / "hand_landmarker.task"
    print("Downloading hand_landmarker.task (~9 MB)...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        dest
    )
    return str(dest)


# ── Extract features from video ───────────────────────────────────────────────
def extract_video_features(video_path: Path, detector: HandLandmarker) -> list[np.ndarray]:
    feats = []
    cap = cv2.VideoCapture(str(video_path))
    frame_no = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_no % FRAME_STRIDE != 0:
            frame_no += 1
            continue
        frame_no += 1

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        result = detector.detect(mp_image)

        if not result.hand_landmarks:
            continue

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
                left  = normed
            else:
                right = normed

        feats.append(np.concatenate([right, left]))

    cap.release()
    return feats


# ── Augmentation ──────────────────────────────────────────────────────────────
def augment_flip(v: np.ndarray) -> np.ndarray:
    right, left = v[:63].copy(), v[63:].copy()
    def flip_half(h):
        h = h.reshape(21, 3)
        h[:, 0] *= -1.0
        return h.flatten()
    return np.concatenate([flip_half(left), flip_half(right)]).astype(np.float32)

def augment_noise(v: np.ndarray) -> np.ndarray:
    return (v + np.random.normal(0, NOISE_SIGMA, v.shape)).astype(np.float32)


# ── Build DARD-only dataset ───────────────────────────────────────────────────
def build_dard_dataset(video_dir: Path):
    model_path = _get_landmarker_model()
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        num_hands=2,
        min_hand_detection_confidence=0.40,
        min_hand_presence_confidence=0.40,
        min_tracking_confidence=0.40,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
    mp_hands = HandLandmarker.create_from_options(options)

    X: list[np.ndarray] = []
    y: list[int] = []
    dard_count = 0

    videos = sorted(video_dir.glob("DARD_*.mp4"))
    print(f"Found {len(videos)} DARD videos in {video_dir}")

    for vi, vp in enumerate(videos, 1):
        feats = extract_video_features(vp, mp_hands)
        print(f"  [{vi:3d}/{len(videos)}] {vp.name:25s} -> DARD ({len(feats)} frames)")
        for f in feats:
            X.append(f);               y.append(DARD_IDX)
            X.append(augment_noise(f)); y.append(DARD_IDX)
            X.append(augment_flip(f));  y.append(DARD_IDX)
        dard_count += len(feats)

    mp_hands.close()

    # Synthesise NO_SIGN samples
    total_real = len(X)
    n_no_sign  = max(int(total_real * NO_SIGN_RATIO), 50)

    rng = np.random.default_rng(RANDOM_SEED)

    def _random_hand_pose() -> np.ndarray:
        pts = rng.standard_normal((21, 3)).astype(np.float32) * 0.3
        pts[0] = 0.0
        scale = float(np.linalg.norm(pts[9])) or 1.0
        return (pts / scale).flatten()

    for i in range(n_no_sign):
        kind = i % 3
        if kind == 0:
            v = rng.normal(0, NOISE_SIGMA, 126).astype(np.float32)
        elif kind == 1:
            v = np.concatenate([_random_hand_pose(), np.zeros(63, dtype=np.float32)])
        else:
            v = np.concatenate([_random_hand_pose(), _random_hand_pose()])
        X.append(v)
        y.append(NO_SIGN_IDX)

    X_arr = np.stack(X)
    y_arr = np.array(y, dtype=np.int64)
    print(f"\nPer-class raw frame counts:")
    print(f"  DARD          {dard_count}")
    print(f"  NO_SIGN       {n_no_sign} (synthetic)")
    print(f"Total samples (incl. aug): {len(X_arr)}  shape={X_arr.shape}")
    return X_arr, y_arr


# ── Model ─────────────────────────────────────────────────────────────────────
def build_model(num_classes: int = 2) -> tf.keras.Model:
    m = models.Sequential([
        layers.Input(shape=(126,)),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.40),
        layers.Dense(128, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.30),
        layers.Dense(64, activation="relu"),
        layers.Dense(32, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])
    m.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return m


# ── Export ────────────────────────────────────────────────────────────────────
def export_dard_model(model: tf.keras.Model, frontend_root: Path):
    h5_path = frontend_root / "isl_model_dard.h5"
    h5_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(h5_path)
    print(f"Saved DARD-only Keras model -> {h5_path}")

    tfjs_dir = frontend_root / "public" / "tfjs_model_dard"
    tfjs_dir.mkdir(parents=True, exist_ok=True)

    with open(tfjs_dir / "label_classes.json", "w", encoding="utf-8") as f:
        json.dump(LABELS, f, indent=2)
    print(f"Saved label_classes.json -> {tfjs_dir / 'label_classes.json'}")
    print(f"\nTo use this model, copy isl_model_dard.h5 to isl_model.h5")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video-dir", default=r"C:/Users/jayan/Desktop/vedios")
    ap.add_argument("--frontend-root", default=None)
    args = ap.parse_args()

    video_dir = Path(args.video_dir)
    if not video_dir.exists():
        print(f"Video dir not found: {video_dir}")
        sys.exit(1)

    if args.frontend_root:
        frontend_root = Path(args.frontend_root)
    else:
        frontend_root = Path(__file__).resolve().parents[2] / "frontend"
    print(f"Frontend root: {frontend_root}")

    # 1. Build DARD-only dataset
    X, y = build_dard_dataset(video_dir)

    # 2. Train/val split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=VAL_SPLIT, random_state=RANDOM_SEED, stratify=y
    )

    # 3. Class weights
    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight(
        "balanced",
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = {i: class_weights[i] for i in range(len(class_weights))}
    print(f"Class weights: {class_weight_dict}")

    # 4. Build and train
    model = build_model(num_classes=len(LABELS))
    model.summary()

    early_stop = callbacks.EarlyStopping(
        monitor="val_accuracy", patience=15, restore_best_weights=True
    )
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=6, min_lr=1e-5
    )

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weight_dict,
        callbacks=[early_stop, reduce_lr],
        verbose=1,
    )

    # 5. Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nFinal val accuracy: {val_acc:.4f}   loss: {val_loss:.4f}")

    # 6. Export
    export_dard_model(model, frontend_root)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
extract_from_videos.py
──────────────────────────────────────────────────────────────────────────────
Extracts 126-float hand landmark features from training videos using MediaPipe
Tasks API (mediapipe >= 0.10).

Layout per sample: [right_hand_63_floats | left_hand_63_floats]
  • 63 floats per hand = 21 landmarks × (x, y, z)
  • Translation-invariant: subtract wrist (landmark 0)
  • Scale-invariant: divide by wrist→middle-MCP (landmark 9) distance
  • Missing hand slot filled with zeros

Video filename convention: CLASSNAME_N.mp4  (e.g. BUKHAR_1.mp4)

Usage:
  python extract_from_videos.py \
      --video_dir  "C:/Users/jayan/Desktop/vedios" \
      --output     ../training_data.json \
      --skip        3
──────────────────────────────────────────────────────────────────────────────
"""

import argparse
import json
import os
import re
import sys
import urllib.request
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions

MODEL_URL  = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
MODEL_FILE = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')


def download_model():
    if os.path.exists(MODEL_FILE):
        return
    print(f'Downloading hand_landmarker.task model (~25 MB) ...')
    urllib.request.urlretrieve(MODEL_URL, MODEL_FILE)
    print(f'Saved to {MODEL_FILE}')


# ── Normalization (mirrors normalize.js) ─────────────────────────────────────

def normalize_hand(landmarks):
    """21 NormalizedLandmark objects → list[63 floats], or 63 zeros if None."""
    if landmarks is None:
        return [0.0] * 63
    pts = [(lm.x, lm.y, lm.z) for lm in landmarks]
    wx, wy, wz = pts[0]
    rx, ry, rz = pts[9]
    scale = ((rx-wx)**2 + (ry-wy)**2 + (rz-wz)**2) ** 0.5 or 1.0
    out = []
    for x, y, z in pts:
        out.append((x - wx) / scale)
        out.append((y - wy) / scale)
        out.append((z - wz) / scale)
    return out   # length 63


def extract_126(detection_result):
    """HandLandmarkerResult → list[126 floats]."""
    right_lm = None
    left_lm  = None
    if detection_result.handedness and detection_result.hand_landmarks:
        for handedness, landmarks in zip(detection_result.handedness,
                                         detection_result.hand_landmarks):
            label = handedness[0].category_name  # 'Right' or 'Left'
            if label == 'Right':
                right_lm = landmarks
            else:
                left_lm = landmarks
    return normalize_hand(right_lm) + normalize_hand(left_lm)


# ── Video processing ──────────────────────────────────────────────────────────

def extract_video(path: str, skip: int, detector) -> list:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(f'  [WARN] Cannot open {path}')
        return []
    samples = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % skip == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = detector.detect(mp_image)
            if result.hand_landmarks:
                samples.append(extract_126(result))
        frame_idx += 1
    cap.release()
    return samples


def parse_class(fname: str) -> str:
    base = os.path.splitext(fname)[0]
    m = re.match(r'^(.+?)_\d+$', base)
    return (m.group(1) if m else base).upper()


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--video_dir', default='C:/Users/jayan/Desktop/vedios')
    parser.add_argument('--output',    default='../training_data.json')
    parser.add_argument('--skip',      type=int, default=3,
                        help='Sample every N-th frame (3 ≈ 10fps from 30fps)')
    parser.add_argument('--max_hands', type=int, default=2)
    args = parser.parse_args()

    if not os.path.isdir(args.video_dir):
        print(f'Error: video_dir not found: {args.video_dir}')
        sys.exit(1)

    download_model()

    base_opts = mp_tasks.BaseOptions(model_asset_path=MODEL_FILE)
    options   = HandLandmarkerOptions(
        base_options=base_opts,
        num_hands=args.max_hands,
        min_hand_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    video_files = sorted(
        f for f in os.listdir(args.video_dir) if f.lower().endswith('.mp4')
    )
    print(f'Found {len(video_files)} video(s)  |  skip={args.skip}\n')

    dataset = {}

    with mp_vision.HandLandmarker.create_from_options(options) as detector:
        for fname in video_files:
            cls  = parse_class(fname)
            path = os.path.join(args.video_dir, fname)
            print(f'  [{cls}] {fname} ...', end=' ', flush=True)
            samples = extract_video(path, args.skip, detector)
            print(f'{len(samples)} samples')
            dataset.setdefault(cls, []).extend(samples)

    print('\n── Summary ──')
    total = 0
    for cls in sorted(dataset):
        n = len(dataset[cls])
        feat = len(dataset[cls][0]) if dataset[cls] else 0
        print(f'  {cls:20s}: {n:5d} samples  (features={feat})')
        total += n
    print(f'  {"TOTAL":20s}: {total:5d} samples')

    out = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w') as f:
        json.dump(dataset, f)
    print(f'\nSaved → {out}')
    print('Next: python train_model.py --data ../training_data.json --output ../public/tfjs_model')


if __name__ == '__main__':
    main()

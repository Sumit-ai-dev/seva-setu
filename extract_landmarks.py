# -*- coding: utf-8 -*-
"""
extract_landmarks.py
Extract MediaPipe hand landmarks from training videos -> training_data.json
Outputs 126 floats per sample: right_hand[63] + left_hand[63]
Missing hand slot is filled with 63 zeros.

Usage:
    python extract_landmarks.py --videos C:/path/to/videos --label DARD
    python extract_landmarks.py --videos C:/path/to/videos
    python extract_landmarks.py --videos C:/path/to/UNKNOWN_folder --label UNKNOWN
"""

import argparse
import json
import os
import sys
import urllib.request

import cv2
import mediapipe as mp
import numpy as np

from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions, HandLandmarker
from mediapipe.tasks.python.core.base_options import BaseOptions

# ── Args ───────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--videos", required=True)
parser.add_argument("--label",  default=None)
parser.add_argument("--skip",   default=2, type=int)
args = parser.parse_args()

HERE      = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "frontend", "training_data.json")

VALID_LABELS = [
    "DARD", "BUKHAR", "SAR-DARD", "PET-DARD", "ULTI",
    "KHANSI", "SANS-TAKLEEF", "SEENE-DARD", "CHAKKAR", "KAMZORI", "UNKNOWN"
]

# Hand count groups — hard gates for training data validation
ONE_HAND_SIGNS = {"DARD", "BUKHAR", "PET-DARD", "ULTI", "KHANSI", "SEENE-DARD", "CHAKKAR"}
TWO_HAND_SIGNS = {"SAR-DARD", "SANS-TAKLEEF", "KAMZORI"}

# ── Per-hand normalization ─────────────────────────────────────────────────────
def normalize_hand(landmarks):
    """Normalize one hand's 21 landmarks -> flat list of 63 floats."""
    pts   = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    wrist = pts[0]
    ref   = pts[9]   # middle-finger MCP
    scale = float(np.linalg.norm(ref - wrist)) or 1.0
    return ((pts - wrist) / scale).flatten().tolist()

def zeros63():
    return [0.0] * 63

# ── Build 126-float sample from detected hands ─────────────────────────────────
def build_sample(hand_landmarks, handedness):
    """
    Return [right63 + left63] = 126 floats.
    Slots missing hand with 63 zeros.
    """
    right_lm = None
    left_lm  = None

    for i, h in enumerate(handedness):
        label = h.category_name  # 'Right' or 'Left' (from model perspective)
        if label == "Right":
            right_lm = hand_landmarks[i]
        else:
            left_lm = hand_landmarks[i]

    # If only one hand and handedness didn't resolve, assign to right slot
    if len(hand_landmarks) == 1 and right_lm is None and left_lm is None:
        right_lm = hand_landmarks[0]

    right63 = normalize_hand(right_lm) if right_lm else zeros63()
    left63  = normalize_hand(left_lm)  if left_lm  else zeros63()
    return right63 + left63

# ── Load existing data ─────────────────────────────────────────────────────────
if os.path.exists(DATA_PATH):
    with open(DATA_PATH) as f:
        training_data = json.load(f)
    print("Loaded existing training_data.json")
else:
    training_data = {}
    print("No existing training_data.json - creating fresh")

# ── Download MediaPipe model if needed ────────────────────────────────────────
MODEL_PATH = os.path.join(HERE, "hand_landmarker.task")
if not os.path.exists(MODEL_PATH):
    print("Downloading MediaPipe hand landmarker model (~9MB)...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task",
        MODEL_PATH
    )
    print("Downloaded.")

# ── Init MediaPipe detector ───────────────────────────────────────────────────
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    num_hands=2,
    min_hand_detection_confidence=0.65,
    min_hand_presence_confidence=0.60,
    min_tracking_confidence=0.60,
    running_mode=mp_vision.RunningMode.IMAGE,
)
detector = HandLandmarker.create_from_options(options)

# ── Find videos ───────────────────────────────────────────────────────────────
video_files = sorted([
    f for f in os.listdir(args.videos)
    if f.lower().endswith((".mp4", ".mov", ".avi", ".mkv"))
])

if not video_files:
    print("ERROR: No video files found in " + args.videos)
    sys.exit(1)

print("\nFound " + str(len(video_files)) + " video(s)")

total_extracted     = 0
total_skipped       = 0
total_skipped_hands = 0

# ── Process each video ────────────────────────────────────────────────────────
for fname in video_files:
    if args.label:
        label = args.label.upper()
    else:
        label = fname.upper().split("_")[0].split(".")[0]

    if label not in VALID_LABELS:
        print("  WARNING: " + fname + " label '" + label + "' not valid - skipping")
        print("  Valid labels: " + str(VALID_LABELS))
        continue

    if label not in training_data:
        training_data[label] = []

    video_path   = os.path.join(args.videos, fname)
    cap          = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps          = cap.get(cv2.CAP_PROP_FPS)

    extracted  = 0
    skipped    = 0
    skip_hands = 0
    frame_idx  = 0
    needs_two  = label in TWO_HAND_SIGNS

    print("  " + fname + " -> label=" + label +
          " | " + str(total_frames) + " frames @ " + str(int(fps)) + "fps" +
          (" [2-HAND REQUIRED]" if needs_two else ""))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if frame_idx % args.skip != 0:
            continue

        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = detector.detect(mp_image)

        if not result.hand_landmarks:
            skipped += 1
            continue

        hands_found = len(result.hand_landmarks)

        # ── Hand count validation — hard gate ──────────────────────────────────
        # ONE_HAND_SIGNS must have exactly 1 hand
        if label in ONE_HAND_SIGNS and hands_found != 1:
            skip_hands += 1
            continue
        # TWO_HAND_SIGNS must have exactly 2 hands
        if label in TWO_HAND_SIGNS and hands_found != 2:
            skip_hands += 1
            continue

        sample = build_sample(result.hand_landmarks, result.handedness)
        assert len(sample) == 126, "Expected 126 floats, got " + str(len(sample))
        training_data[label].append(sample)
        extracted += 1

    cap.release()
    msg = "    OK: extracted=" + str(extracted) + "  skipped(no hand)=" + str(skipped)
    if needs_two:
        msg += "  skipped(1-hand-only)=" + str(skip_hands)
    print(msg)
    total_extracted     += extracted
    total_skipped       += skipped
    total_skipped_hands += skip_hands

detector.close()

# ── Save ──────────────────────────────────────────────────────────────────────
with open(DATA_PATH, "w") as f:
    json.dump(training_data, f)

print("\n" + "=" * 50)
print("EXTRACTION COMPLETE — SAMPLE COUNT REPORT")
print("=" * 50)

# ── One-hand signs report ──────────────────────────────────────────────────
print("\nONE HAND SIGNS — sample counts")
print("-" * 50)
one_hand_counts = {s: len(training_data.get(s, [])) for s in ONE_HAND_SIGNS}
for sign in sorted(ONE_HAND_SIGNS):
    count = one_hand_counts[sign]
    flag = "  [LOW]" if count < 80 else ""
    print("  " + sign.ljust(16) + ": " + str(count).rjust(4) + " samples" + flag)

one_hand_min = min(one_hand_counts.values()) if one_hand_counts else 0
one_hand_max = max(one_hand_counts.values()) if one_hand_counts else 0
one_hand_balanced = one_hand_max == 0 or (one_hand_max - one_hand_min) <= one_hand_max * 0.5
print("-" * 50)
print("  Min in group  : " + str(one_hand_min))
print("  Max in group  : " + str(one_hand_max))
print("  Balanced (gap <50%): " + ("YES" if one_hand_balanced else "NO  [WARNING]"))

# ── Two-hand signs report ──────────────────────────────────────────────────
print("\nTWO HAND SIGNS — sample counts")
print("-" * 50)
two_hand_counts = {s: len(training_data.get(s, [])) for s in TWO_HAND_SIGNS}
for sign in sorted(TWO_HAND_SIGNS):
    count = two_hand_counts[sign]
    flag = "  [LOW]" if count < 80 else ""
    print("  " + sign.ljust(16) + ": " + str(count).rjust(4) + " samples" + flag)

two_hand_min = min(two_hand_counts.values()) if two_hand_counts else 0
two_hand_max = max(two_hand_counts.values()) if two_hand_counts else 0
two_hand_balanced = two_hand_max == 0 or (two_hand_max - two_hand_min) <= two_hand_max * 0.5
print("-" * 50)
print("  Min in group  : " + str(two_hand_min))
print("  Max in group  : " + str(two_hand_max))
print("  Balanced (gap <50%): " + ("YES" if two_hand_balanced else "NO  [WARNING]"))

# ── UNKNOWN report ─────────────────────────────────────────────────────────
unknown_count = len(training_data.get("UNKNOWN", []))
print("\nUNKNOWN negative samples")
print("-" * 50)
print("  UNKNOWN       : " + str(unknown_count).rjust(4) + " samples",
      " [CRITICAL: need >= 300]" if unknown_count < 300 else "")

# ── Summary and recommendations ────────────────────────────────────────────
print("\n" + "=" * 50)
print("SUMMARY & RECOMMENDATIONS")
print("=" * 50)

recommendations = []
if one_hand_min < 80:
    recommendations.append("- Re-record " + ", ".join(s for s in ONE_HAND_SIGNS if one_hand_counts[s] < 80))
if not one_hand_balanced:
    recommendations.append("- Balance one-hand signs (gap between min/max is >50%)")
if two_hand_min < 80:
    recommendations.append("- Re-record " + ", ".join(s for s in TWO_HAND_SIGNS if two_hand_counts[s] < 80))
if not two_hand_balanced:
    recommendations.append("- Balance two-hand signs (gap between min/max is >50%)")
if unknown_count < 300:
    recommendations.append("- Record " + str(300 - unknown_count) + " more UNKNOWN negative samples")

if recommendations:
    for rec in recommendations:
        print(rec)
else:
    print("All signs are well-balanced and have sufficient samples.")
    print("Ready to retrain: py -3.11 train_isl.py")

print("\n" + "=" * 50)
print("Saved -> " + DATA_PATH)
print("Total extracted: " + str(total_extracted) + " | Skipped: " + str(total_skipped + total_skipped_hands))

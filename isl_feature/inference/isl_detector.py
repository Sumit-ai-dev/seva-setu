"""
isl_detector.py — v2.0
───────────────────────────────────────────────────────────────────────────────
ISL symptom recognition backend — follows master training prompt v2.0.

Key changes from v1:
  • 12 classes: 10 signs + UNCERTAIN + NO_SIGN
  • Demographic-aware profiles (women / men / child / elderly) per §3A–D
  • Elderly tremor filter: EMA bandpass approximation
  • Rolling 60-frame window, 10fps classification (§8)
  • CRITICAL signs fire on FIRST qualifying frame (§8)
  • Non-critical: VOTE_FRAMES consecutive agreement
  • CARDIAC_EMERGENCY: SEENE-DARD + SANS-TAKLEEF within 10s
  • Per-class, per-demographic confidence thresholds
  • GDPR/DPDP Act 2023: no raw video stored; landmark tensors only

Signs:
  00 DARD          — Pain            HIGH
  01 BUKHAR        — Fever           HIGH
  02 SAR-DARD      — Headache        MEDIUM
  03 PET-DARD      — Stomach Pain    HIGH
  04 ULTI          — Vomiting        MEDIUM
  05 KHANSI        — Cough           MEDIUM
  06 SANS-TAKLEEF  — Breathlessness  CRITICAL  ← fire on first frame
  07 SEENE-DARD    — Chest Pain      CRITICAL  ← fire on first frame
  08 CHAKKAR       — Dizziness       MEDIUM
  09 KAMZORI       — Weakness        MEDIUM
  10 UNCERTAIN     — reserved
  11 NO_SIGN       — reserved
───────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
import os
import time
import urllib.request
from collections import deque
from pathlib import Path
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions, HandLandmarker
from mediapipe.tasks.python.core.base_options import BaseOptions

logger = logging.getLogger(__name__)

# ── Labels ────────────────────────────────────────────────────────────────────
LABELS = [
    "DARD",          # 00
    "BUKHAR",        # 01
    "SAR-DARD",      # 02
    "PET-DARD",      # 03
    "ULTI",          # 04
    "SANS-TAKLEEF",  # 05 — CRITICAL
    "SEENE-DARD",    # 06 — CRITICAL
    "CHAKKAR",       # 07
    "KAMZORI",       # 08
    "UNCERTAIN",     # 09 — reserved
    "NO_SIGN",       # 10 — reserved
]

CRITICAL_SIGNS = {"SANS-TAKLEEF", "SEENE-DARD"}

# Hand-count gates
ONE_HAND_SIGNS = {"DARD", "BUKHAR", "PET-DARD", "ULTI", "SEENE-DARD", "CHAKKAR", "KAMZORI"}
TWO_HAND_SIGNS = {"SANS-TAKLEEF", "SAR-DARD"}

URGENCY: dict[str, str] = {
    "DARD":          "high",
    "BUKHAR":        "high",
    "SAR-DARD":      "medium",
    "PET-DARD":      "high",
    "ULTI":          "medium",
    "SANS-TAKLEEF":  "critical",
    "SEENE-DARD":    "critical",
    "CHAKKAR":       "medium",
    "KAMZORI":       "medium",
    "UNCERTAIN":     "unknown",
    "NO_SIGN":       "unknown",
}

HINDI_LABELS: dict[str, str] = {
    "DARD":          "दर्द",
    "BUKHAR":        "बुखार",
    "SAR-DARD":      "सर दर्द",
    "PET-DARD":      "पेट दर्द",
    "ULTI":          "उल्टी",
    "SANS-TAKLEEF":  "सांस तकलीफ",
    "SEENE-DARD":    "सीने में दर्द",
    "CHAKKAR":       "चक्कर",
    "KAMZORI":       "कमज़ोरी",
}

ICD10: dict[str, str] = {
    "DARD":          "R52",
    "BUKHAR":        "R50.9",
    "SAR-DARD":      "R51",
    "PET-DARD":      "R10.9",
    "ULTI":          "R11.2",
    "SANS-TAKLEEF":  "R06.00",
    "SEENE-DARD":    "R07.9",
    "CHAKKAR":       "R42",
    "KAMZORI":       "R53.83",
}

# ── Base confidence thresholds ────────────────────────────────────────────────
_BASE_THRESHOLDS: dict[str, float] = {
    "DARD":          0.85,
    "BUKHAR":        0.82,
    "SAR-DARD":      0.80,
    "PET-DARD":      0.76,
    "ULTI":          0.84,
    "SANS-TAKLEEF":  0.85,
    "SEENE-DARD":    0.86,
    "CHAKKAR":       0.80,  # lowered from 0.87: better detection of CHAKKAR gesture (index finger to forehead)
    "KAMZORI":       0.75,
}

# Signs that also require a minimum confidence margin over the 2nd-best class.
# Prevents "slightly more than something else" from firing.
_MARGIN_REQUIRED: dict[str, float] = {
    "CHAKKAR": 0.05,   # lowered from 0.08: must beat 2nd-best by at least 0.05
}

# ── Demographic threshold adjustments (§3A–D) ─────────────────────────────────
# Negative delta = lower threshold (easier to fire)
_DEMO_DELTA: dict[str, dict[str, float]] = {
    # Women: atypical MI presentation → lower SEENE-DARD threshold
    "women":   {"SEENE-DARD": -0.05},
    # Men: no adjustments
    "men":     {},
    # Children: partial signs accepted → lower across the board
    "child":   {"_default": -0.15},
    # Elderly: SEENE-DARD at ≥0.55 (§3D "HIGHEST PRIORITY"), SANS-TAKLEEF lower too
    "elderly": {"SEENE-DARD": -0.31, "SANS-TAKLEEF": -0.25, "KAMZORI": -0.05},
}

def _get_threshold(sign: str, demographic: str = "men") -> float:
    base  = _BASE_THRESHOLDS.get(sign, 0.80)
    adj   = _DEMO_DELTA.get(demographic, {})
    delta = adj.get(sign, adj.get("_default", 0.0))
    return max(0.50, base + delta)


# ── Runtime constants ─────────────────────────────────────────────────────────
VOTE_FRAMES            = 5      # consecutive frames for non-critical confirmation
WINDOW_SIZE            = 60     # rolling history (6s at 10fps)
CARDIAC_COMBO_WINDOW_S = 10.0   # seconds for CARDIAC_EMERGENCY combo
EMA_ALPHA              = 0.35   # tremor filter smoothing factor (elderly)

# ── Proximity gates (sign -> (body_part, max_dist_normalised)) ────────────────
# Gate: at least one hand wrist must be within max_dist of the body part.
# If face/pose not detected, gate is skipped (fail-open — never breaks detection).
PROXIMITY_GATES: dict[str, tuple[str, float]] = {
    "BUKHAR":       ("forehead", 0.28),   # hand near forehead (fever gesture)
    "SAR-DARD":     ("head",     0.32),   # hand near head (headache gesture)
    "PET-DARD":     ("abdomen",  0.30),   # hand near stomach
    "ULTI":         ("mouth",    0.24),   # hand near mouth (vomiting gesture)
    "SANS-TAKLEEF": ("chest",    0.32),   # hand near chest (breathless)
    "SEENE-DARD":   ("chest",    0.30),   # hand near chest (chest pain)
    "CHAKKAR":      ("head",     0.45),   # hand near head (dizziness)
}


# ── Normalisation ─────────────────────────────────────────────────────────────
def _finger_curl_ratio(norm_vec: np.ndarray) -> float:
    """
    Returns 0.0 (fully open hand) → 1.0 (full fist).
    norm_vec: wrist-centred, palm-scaled (63,) float32 from one hand.
    Checks 4 fingers (skip thumb — unreliable in fists): if fingertip is
    closer to wrist than its MCP joint, the finger is curled.
    """
    if not np.any(norm_vec):
        return 0.0
    pts = norm_vec.reshape(21, 3)
    # (tip_idx, mcp_idx) for index, middle, ring, pinky
    pairs = [(8, 5), (12, 9), (16, 13), (20, 17)]
    curl_count = 0
    for tip_i, mcp_i in pairs:
        tip_d = float(np.linalg.norm(pts[tip_i]))
        mcp_d = float(np.linalg.norm(pts[mcp_i]))
        if tip_d < mcp_d * 0.85:  # tip closer to wrist than 85% of MCP dist
            curl_count += 1
    return curl_count / 4.0


def _normalize(landmarks) -> np.ndarray:
    """
    Wrist-centred, palm-width normalised — matches frontend islNormalize.js exactly.
    landmarks: list of 21 objects with .x .y .z attributes (MediaPipe format).
    Returns float32 (63,).
    """
    pts   = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    wrist = pts[0]
    mcp   = pts[9]   # middle-finger MCP
    scale = float(np.linalg.norm(mcp - wrist)) or 1.0
    return ((pts - wrist) / scale).flatten()


# ── HandLandmarker model path ─────────────────────────────────────────────────
def _get_landmarker_model() -> str:
    here = Path(__file__).resolve().parent
    candidates = [
        here.parents[1] / "frontend" / "model" / "hand_landmarker.task",
        here.parents[1] / "hand_landmarker.task",
        here / "hand_landmarker.task",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    dest = here / "hand_landmarker.task"
    logger.info("Downloading hand_landmarker.task...")
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task",
        str(dest),
    )
    return str(dest)


# ── ISLDetector ───────────────────────────────────────────────────────────────
class ISLDetector:
    """
    Stateful, frame-by-frame ISL symptom detector.

    Usage:
        detector = ISLDetector()
        detector.set_demographic("elderly")   # optional — adjusts thresholds
        result   = detector.process_frame(cv2_bgr_frame)
        detector.reset()   # between patients
        detector.close()   # on session end
    """

    def __init__(self, model_path: Optional[str] = None, demographic: str = "men"):
        # ── MediaPipe HandLandmarker — Tasks API (better fist/occlusion) ─────
        # VIDEO mode: monotonic timestamps, temporal tracking between frames.
        # min_hand_presence_confidence = key param for fists (hand IS there, just occluded).
        _lm_model = _get_landmarker_model()
        _opts = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=_lm_model),
            num_hands=2,
            min_hand_detection_confidence=0.40,
            min_hand_presence_confidence=0.40,
            min_tracking_confidence=0.40,
            running_mode=mp_vision.RunningMode.VIDEO,
        )
        self._detector = HandLandmarker.create_from_options(_opts)
        self._ts_ms: int = 0   # monotonically increasing timestamp for VIDEO mode

        # ── MediaPipe FaceMesh — face reference landmarks ─────────────────────
        self._mp_face = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,         # skip iris — saves ~3ms/frame
            min_detection_confidence=0.50,
            min_tracking_confidence=0.50,
        )

        # ── MediaPipe Pose (lite) — chest / abdomen landmarks ─────────────────
        self._mp_pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=0,             # lite model, fast enough for real-time
            min_detection_confidence=0.50,
            min_tracking_confidence=0.50,
        )

        # ── CLAHE for frame enhancement (Fix 2) ──────────────────────────────
        self._clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

        # ── Keras model ───────────────────────────────────────────────────────
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__),
                "..", "..", "frontend", "isl_model.h5"
            )
        self._model = None
        if os.path.exists(model_path):
            try:
                import tensorflow as tf
                self._model = tf.keras.models.load_model(model_path)
                self._model.predict(np.zeros((1, 126), dtype=np.float32), verbose=0)
                logger.info(f"[ISLDetector] model loaded from {model_path}")
            except Exception as exc:
                logger.error(f"[ISLDetector] model load failed: {exc}")
        else:
            logger.warning(f"[ISLDetector] model not found at {model_path} — landmark-only mode")

        # ── Demographic profile ───────────────────────────────────────────────
        self._demographic: str = demographic

        # ── State ─────────────────────────────────────────────────────────────
        self._vote_buffer: deque[str]  = deque(maxlen=VOTE_FRAMES)
        self._history: deque[str]      = deque(maxlen=WINDOW_SIZE)
        self._fill: float              = 0.0
        self._last_confirmed: Optional[str] = None
        self._critical_timestamps: dict[str, float] = {}

        # Tremor EMA state (elderly)
        self._ema: Optional[np.ndarray] = None

        # Fix 4: carry-forward — last good landmarks per hand
        self._prev_right: np.ndarray = np.zeros(63, dtype=np.float32)
        self._prev_left:  np.ndarray = np.zeros(63, dtype=np.float32)

        # Bonus: landmark smoothing — rolling buffer of last 3 feature vectors
        self._smooth_buf: deque[np.ndarray] = deque(maxlen=3)

    # ── Public API ────────────────────────────────────────────────────────────

    def set_demographic(self, demographic: str) -> None:
        """Update the demographic profile; resets EMA filter."""
        valid = {"women", "men", "child", "elderly"}
        if demographic not in valid:
            logger.warning(f"[ISLDetector] unknown demographic '{demographic}', keeping '{self._demographic}'")
            return
        self._demographic = demographic
        self._ema = None
        logger.info(f"[ISLDetector] demographic set to '{demographic}'")

    def process_frame(self, bgr_frame: np.ndarray) -> dict:
        """
        Process one BGR video frame.

        Returns dict with keys:
            sign, english, hindi, icd10, urgency,
            confidence, confirmed, escalate, fill,
            has_hand, cardiac_emergency, all_confidences,
            demographic, model_notes
        """
        now = time.time()

        # ── Fix 2: CLAHE enhancement + horizontal flip ────────────────────────
        flipped = cv2.flip(bgr_frame, 1)
        lab     = cv2.cvtColor(flipped, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l       = self._clahe.apply(l)
        enhanced = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
        rgb      = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)

        # ── Tasks API: detect_for_video (monotonic timestamps required) ─────────
        mp_image   = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        self._ts_ms = max(self._ts_ms + 1, int(time.time() * 1000))
        hand_result  = self._detector.detect_for_video(mp_image, self._ts_ms)
        face_results = self._mp_face.process(rgb)
        pose_results = self._mp_pose.process(rgb)

        if not hand_result.hand_landmarks:
            self._vote_buffer.clear()
            self._fill  = max(0.0, self._fill - 0.15)
            self._ema   = None
            return self._no_hand_result()

        # ── x-position sorting + per-hand confidence gate ─────────────────────
        hand_data = sorted(
            [
                (
                    lm_group[0].x,                                    # wrist x
                    hand_result.handedness[i][0].score                # confidence
                    if hand_result.handedness else 1.0,
                    lm_group,                                         # landmark list
                )
                for i, lm_group in enumerate(hand_result.hand_landmarks)
            ],
            key=lambda t: t[0],
        )

        right = np.zeros(63, dtype=np.float32)
        left  = np.zeros(63, dtype=np.float32)

        for rank, (_, hand_conf, lm_group) in enumerate(hand_data):
            if hand_conf < 0.60:   # slightly lower gate for fists (confidence naturally drops)
                continue
            normed = _normalize(lm_group)  # Tasks API: lm_group is list of NormalizedLandmark
            if rank == 0:
                left  = normed   # leftmost wrist
            else:
                right = normed   # rightmost wrist

        # Convenience alias so proximity gate below can iterate wrist positions
        hands_sorted = [t[2] for t in hand_data]  # list of lm_groups in x order

        # Fix 4: carry-forward — if a hand dropped this frame use last known
        if np.any(right):
            self._prev_right = right.copy()
        else:
            right = self._prev_right

        if np.any(left):
            self._prev_left = left.copy()
        else:
            left = self._prev_left

        features = np.concatenate([right, left])

        # Bonus: landmark smoothing — average last 3 frames to reduce jitter
        self._smooth_buf.append(features.copy())
        features = np.mean(self._smooth_buf, axis=0).astype(np.float32)

        # ── Elderly tremor filter (EMA) ───────────────────────────────────────
        if self._demographic == "elderly":
            if self._ema is None:
                self._ema = features.copy()
            else:
                self._ema  = EMA_ALPHA * features + (1 - EMA_ALPHA) * self._ema
            features = self._ema

        # ── Model inference ───────────────────────────────────────────────────
        if self._model is None:
            return {**self._base_result(), "has_hand": True,
                    "model_notes": "Model not loaded — landmark-only mode"}

        raw_scores = self._model.predict(
            features.reshape(1, 126), verbose=0
        )[0].tolist()

        all_confidences = {
            LABELS[i]: round(raw_scores[i], 4)
            for i in range(min(len(LABELS), len(raw_scores)))
        }

        best_idx  = int(np.argmax(raw_scores))
        best_conf = float(raw_scores[best_idx])
        best_lbl  = LABELS[best_idx] if best_idx < len(LABELS) else "UNCERTAIN"

        # Anti-hallucination: cap suspiciously high confidence
        notes = ""
        if best_conf > 0.95:
            notes     = "High confidence flagged — verify model calibration"
            best_conf = 0.95

        # Skip reserved output classes from voting
        if best_lbl in ("UNCERTAIN", "NO_SIGN"):
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": "Reserved class output"}

        # ── Demographic-adjusted threshold ────────────────────────────────────
        threshold = _get_threshold(best_lbl, self._demographic)
        if best_conf < threshold:
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": notes or "Below confidence threshold"}

        # ── Confidence margin gate (anti-confusion for ambiguous signs) ────────
        margin_req = _MARGIN_REQUIRED.get(best_lbl, 0.0)
        if margin_req > 0.0:
            sorted_scores = sorted(raw_scores, reverse=True)
            margin = sorted_scores[0] - sorted_scores[1]
            if margin < margin_req:
                self._vote_buffer.clear()
                self._fill = 0.0
                return {**self._base_result(), "has_hand": True,
                        "all_confidences": all_confidences,
                        "model_notes": f"Margin {margin:.3f} < required {margin_req} for {best_lbl}"}

        # ── Proximity gate (face + pose body reference) ───────────────────────
        if best_lbl in PROXIMITY_GATES:
            part, max_dist = PROXIMITY_GATES[best_lbl]
            body_pts = self._extract_body_points(face_results, pose_results)
            ref = body_pts.get(part)
            if ref is not None:
                # Check if ANY detected wrist is close enough to the body part
                min_dist = float("inf")
                for lm_group in hands_sorted:
                    wx = lm_group[0].x   # Tasks API: list index, not .landmark
                    wy = lm_group[0].y
                    d  = ((wx - ref[0]) ** 2 + (wy - ref[1]) ** 2) ** 0.5
                    min_dist = min(min_dist, d)
                if min_dist > max_dist:
                    self._vote_buffer.clear()
                    self._fill = 0.0
                    return {**self._base_result(), "has_hand": True,
                            "all_confidences": all_confidences,
                            "model_notes": f"Proximity gate: hand {min_dist:.2f} > {max_dist} from {part}"}

        # ── Hand-count gate ───────────────────────────────────────────────────
        num_hands = len(hand_result.hand_landmarks)
        if num_hands == 1 and best_lbl in TWO_HAND_SIGNS:
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": "Two-hand sign blocked: only 1 hand visible"}
        if num_hands >= 2 and best_lbl in ONE_HAND_SIGNS:
            self._vote_buffer.clear()
            self._fill = 0.0
            return {**self._base_result(), "has_hand": True,
                    "all_confidences": all_confidences,
                    "model_notes": "One-hand sign blocked: 2 hands visible"}

        # ── Fist gate: SANS-TAKLEEF requires actual closed fist ──────────────
        # Prevents any-hand-shape-near-chest from hallucinating breathlessness.
        if best_lbl == "SANS-TAKLEEF":
            right_curl = _finger_curl_ratio(right)
            left_curl  = _finger_curl_ratio(left)
            if max(right_curl, left_curl) < 0.50:
                self._vote_buffer.clear()
                self._fill = 0.0
                return {**self._base_result(), "has_hand": True,
                        "all_confidences": all_confidences,
                        "model_notes": f"Fist gate: curl={max(right_curl, left_curl):.2f} < 0.50 for SANS-TAKLEEF"}

        # ── Claw gate: DARD is a claw hand (fingers partially curled) ─────────
        # A flat open palm in front of the camera is NOT the DARD sign.
        # Block if the best active hand is fully open (curl < 0.25).
        if best_lbl == "DARD":
            right_curl = _finger_curl_ratio(right)
            left_curl  = _finger_curl_ratio(left)
            best_curl  = max(right_curl, left_curl)
            if best_curl < 0.25:
                self._vote_buffer.clear()
                self._fill = 0.0
                return {**self._base_result(), "has_hand": True,
                        "all_confidences": all_confidences,
                        "model_notes": f"Claw gate: curl={best_curl:.2f} < 0.25 — open palm is not DARD"}

        # ── CRITICAL signs: fire immediately (§8) ────────────────────────────
        if best_lbl in CRITICAL_SIGNS:
            self._critical_timestamps[best_lbl] = now
            cardiac_emergency = self._check_cardiac_emergency()
            self._history.append(best_lbl)
            self._fill            = 1.0
            self._last_confirmed  = best_lbl

            return {
                "sign":              best_lbl,
                "english":           best_lbl.replace("-", " ").title(),
                "hindi":             HINDI_LABELS.get(best_lbl),
                "icd10":             ICD10.get(best_lbl),
                "urgency":           URGENCY.get(best_lbl, "unknown"),
                "confidence":        round(best_conf, 4),
                "confirmed":         True,
                "escalate":          True,
                "fill":              1.0,
                "has_hand":          True,
                "cardiac_emergency": cardiac_emergency,
                "all_confidences":   all_confidences,
                "demographic":       self._demographic,
                "model_notes":       notes,
            }

        # ── Non-critical: VOTE_FRAMES consecutive agreement ───────────────────
        self._vote_buffer.append(best_lbl)
        vote_count = sum(1 for v in self._vote_buffer if v == best_lbl)
        self._fill = vote_count / VOTE_FRAMES

        confirmed = vote_count >= VOTE_FRAMES
        if confirmed:
            self._last_confirmed = best_lbl
            self._history.append(best_lbl)

        return {
            "sign":              best_lbl if confirmed else None,
            "english":           best_lbl.replace("-", " ").title() if confirmed else None,
            "hindi":             HINDI_LABELS.get(best_lbl) if confirmed else None,
            "icd10":             ICD10.get(best_lbl) if confirmed else None,
            "urgency":           URGENCY.get(best_lbl, "unknown"),
            "confidence":        round(best_conf, 4),
            "confirmed":         confirmed,
            "escalate":          confirmed and URGENCY.get(best_lbl) in ("high", "critical"),
            "fill":              round(self._fill, 3),
            "has_hand":          True,
            "cardiac_emergency": False,
            "all_confidences":   all_confidences,
            "demographic":       self._demographic,
            "model_notes":       notes,
        }

    def reset(self) -> None:
        """Reset voting state between patients."""
        self._vote_buffer.clear()
        self._fill           = 0.0
        self._last_confirmed = None
        self._critical_timestamps.clear()
        self._ema            = None
        self._prev_right     = np.zeros(63, dtype=np.float32)
        self._prev_left      = np.zeros(63, dtype=np.float32)
        self._smooth_buf.clear()
        logger.info("[ISLDetector] state reset")

    def close(self) -> None:
        self._detector.close()
        self._mp_face.close()
        self._mp_pose.close()
        logger.info("[ISLDetector] closed")

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _extract_body_points(face_results, pose_results) -> dict[str, tuple[float, float]]:
        """
        Extract normalised (x, y) reference points for body parts.
        Returns only the parts that could be detected — caller must handle missing keys.
        Coordinates are in flipped-frame space (0–1), consistent with hand landmarks.
        """
        pts: dict[str, tuple[float, float]] = {}

        # ── Face landmarks ────────────────────────────────────────────────────
        if face_results and face_results.multi_face_landmarks:
            fl = face_results.multi_face_landmarks[0].landmark
            # forehead: landmark 10
            pts["forehead"] = (fl[10].x, fl[10].y)
            # head center: average of forehead(10), nose(1), left(234), right(454)
            pts["head"] = (
                (fl[10].x + fl[1].x + fl[234].x + fl[454].x) / 4,
                (fl[10].y + fl[1].y + fl[234].y + fl[454].y) / 4,
            )
            # mouth: upper-lip center (landmark 13)
            pts["mouth"] = (fl[13].x, fl[13].y)

            # Approximate chest + abdomen from face when pose is unavailable.
            # Uses chin(152) as anchor: chin + 1× face_height ≈ chest,
            # chin + 2× face_height ≈ abdomen.  Rough but better than nothing.
            face_height = abs(fl[10].y - fl[152].y)
            nose_x = fl[1].x
            pts["chest_approx"]   = (nose_x, fl[152].y + face_height * 1.0)
            pts["abdomen_approx"] = (nose_x, fl[152].y + face_height * 2.0)

        # ── Pose landmarks ────────────────────────────────────────────────────
        if pose_results and pose_results.pose_landmarks:
            pl = pose_results.pose_landmarks.landmark
            # chest: midpoint of shoulders(11, 12) + small downward offset
            cx = (pl[11].x + pl[12].x) / 2
            cy = (pl[11].y + pl[12].y) / 2 + 0.07
            pts["chest"] = (cx, cy)
            # abdomen: midpoint of hips(23, 24) shifted slightly up
            ax = (pl[23].x + pl[24].x) / 2
            ay = (pl[23].y + pl[24].y) / 2 - 0.05
            pts["abdomen"] = (ax, ay)
        else:
            # Fall back to face-derived approximations
            if "chest_approx" in pts:
                pts["chest"]   = pts["chest_approx"]
                pts["abdomen"] = pts["abdomen_approx"]

        return pts

    def _check_cardiac_emergency(self) -> bool:
        """CARDIAC_EMERGENCY = SEENE-DARD + SANS-TAKLEEF within CARDIAC_COMBO_WINDOW_S."""
        ts1 = self._critical_timestamps.get("SEENE-DARD", 0.0)
        ts2 = self._critical_timestamps.get("SANS-TAKLEEF", 0.0)
        return ts1 > 0 and ts2 > 0 and abs(ts1 - ts2) <= CARDIAC_COMBO_WINDOW_S

    @staticmethod
    def _base_result() -> dict:
        return {
            "sign":              None,
            "english":           None,
            "hindi":             None,
            "icd10":             None,
            "urgency":           "unknown",
            "confidence":        0.0,
            "confirmed":         False,
            "escalate":          False,
            "fill":              0.0,
            "has_hand":          False,
            "cardiac_emergency": False,
            "all_confidences":   {},
            "demographic":       "men",
            "model_notes":       "",
        }

    @staticmethod
    def _no_hand_result() -> dict:
        return {**ISLDetector._base_result(), "model_notes": "NO_HAND_DETECTED"}

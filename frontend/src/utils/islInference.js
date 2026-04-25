/**
 * islInference.js — v2.0
 * TF.js model loader + single-sample inference.
 *
 * 12 classes: 10 symptom signs + UNCERTAIN + NO_SIGN (per master training prompt §2).
 * Demographic-aware confidence thresholds (per §3 A–D).
 */

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

// ── Class labels (must match label_classes.json from training) ─────────────────
export const LABELS = [
  'DARD',          // 00 — Pain          HIGH
  'BUKHAR',        // 01 — Fever         HIGH
  'SAR-DARD',      // 02 — Headache      MEDIUM
  'PET-DARD',      // 03 — Stomach Pain  HIGH
  'ULTI',          // 04 — Vomiting      MEDIUM
  'SANS-TAKLEEF',  // 05 — Breathless    CRITICAL
  'SEENE-DARD',    // 06 — Chest Pain    CRITICAL
  'CHAKKAR',       // 07 — Dizziness     MEDIUM
  'KAMZORI',       // 08 — Weakness      MEDIUM
  'UNCERTAIN',     // 09 — reserved: low confidence output
  'NO_SIGN',       // 10 — reserved: no valid gesture detected
]

export const URGENCY = {
  DARD:           'high',
  BUKHAR:         'high',
  'SAR-DARD':     'medium',
  'PET-DARD':     'high',
  ULTI:           'medium',
  'SANS-TAKLEEF': 'critical',
  'SEENE-DARD':   'critical',
  CHAKKAR:        'medium',
  KAMZORI:        'medium',
}

// Signs that fire immediately without voting (§8: CRITICAL signs)
export const CRITICAL_SIGNS = new Set(['SANS-TAKLEEF', 'SEENE-DARD'])

// ── Base confidence thresholds per sign ───────────────────────────────────────
const BASE_THRESHOLDS = {
  DARD:           0.85,
  BUKHAR:         0.82,
  'SAR-DARD':     0.80,
  'PET-DARD':     0.76,
  ULTI:           0.84,
  'SANS-TAKLEEF': 0.85,
  'SEENE-DARD':   0.86,
  CHAKKAR:        0.87,  // raised: open-palm false positives at 0.79
  KAMZORI:        0.75,
}

// Signs requiring minimum confidence margin over 2nd-best class
const MARGIN_REQUIRED = {
  CHAKKAR: 0.08,
}

// ── Demographic adjustments (§3A–D) ──────────────────────────────────────────
// Delta applied to base threshold. Negative = lower threshold (easier to fire).
const DEMO_DELTA = {
  // Women: atypical MI presentation — lower SEENE-DARD threshold
  women: { 'SEENE-DARD': -0.05 },
  // Men: no adjustments from base
  men: {},
  // Children: partial signs accepted — lower across-the-board (§3C)
  child: { _default: -0.15 },
  // Elderly: SEENE-DARD at ≥0.55 (§3D "HIGHEST PRIORITY"), SANS-TAKLEEF lower too
  elderly: { 'SEENE-DARD': -0.31, 'SANS-TAKLEEF': -0.25, KAMZORI: -0.05 },
}

/**
 * Get the effective confidence threshold for a sign + demographic combination.
 * @param {string} sign
 * @param {'women'|'men'|'child'|'elderly'} demographic
 * @returns {number} threshold (floored at 0.50)
 */
export function getThreshold(sign, demographic = 'men') {
  const base  = BASE_THRESHOLDS[sign] ?? 0.80
  const adj   = DEMO_DELTA[demographic] ?? {}
  const delta = adj[sign] ?? adj._default ?? 0
  return Math.max(0.50, base + delta)
}

// ── Model lifecycle ───────────────────────────────────────────────────────────
let _ready = false

/**
 * Load TF.js model from url and warm it up. Call once at app boot.
 * @param {string} url
 * @returns {Promise<tf.LayersModel>}
 */
export async function loadModel(url = '/tfjs_model/model.json') {
  try {
    await tf.setBackend('webgl')
    await tf.ready()
  } catch {
    await tf.setBackend('cpu')
    console.warn('[ISL] WebGL unavailable — falling back to CPU')
  }
  console.log('[ISL] TF.js backend:', tf.getBackend())

  const model = await tf.loadLayersModel(url)
  const inputDim = model.inputs[0].shape[1]
  tf.tidy(() => model.predict(tf.zeros([1, inputDim])))

  _ready = true
  console.log('[ISL] model ready, inputDim:', inputDim, 'classes:', LABELS.length)
  return model
}

/**
 * Run inference on a single normalised feature vector.
 * @param {tf.LayersModel} model
 * @param {Float32Array}   features
 * @returns {{ label: string, confidence: number, scores: number[] }}
 */
export function predict(model, features) {
  if (!model || !_ready) return { label: 'NO_SIGN', confidence: 0, scores: [] }

  return tf.tidy(() => {
    const input  = tf.tensor2d([Array.from(features)], [1, features.length])
    const output = model.predict(input)
    const scores = Array.from(output.dataSync())

    let bestIdx = 0
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[bestIdx]) bestIdx = i
    }

    const label      = LABELS[bestIdx] ?? 'UNCERTAIN'
    const confidence = scores[bestIdx]

    // Confidence margin gate — prevents ambiguous signs from firing
    const marginReq = MARGIN_REQUIRED[label] ?? 0
    if (marginReq > 0) {
      const sorted   = [...scores].sort((a, b) => b - a)
      const margin   = sorted[0] - sorted[1]
      if (margin < marginReq) {
        return { label: 'NO_SIGN', confidence, scores }
      }
    }

    return { label, confidence, scores }
  })
}

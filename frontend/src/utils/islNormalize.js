/**
 * islNormalize.js — v2.0
 * Wrist-centred, palm-width normalised hand landmark vectors.
 *
 * Normalisation: subtract wrist (landmark 0), divide by wrist→middle-MCP
 * (landmark 9) distance. This is scale and translation invariant.
 * Matches backend isl_detector.py _normalize() exactly.
 */

/**
 * Normalise a single hand (21 MediaPipe landmarks).
 * @param {Array<{x,y,z}>} landmarks
 * @returns {Float32Array} length 63 (21 × xyz)
 */
export function normalizeSingleHand(landmarks) {
  const wrist = landmarks[0]
  const mcp   = landmarks[9]  // middle-finger MCP — scale reference

  const scale = Math.sqrt(
    (mcp.x - wrist.x) ** 2 +
    (mcp.y - wrist.y) ** 2 +
    (mcp.z - wrist.z) ** 2
  ) || 1.0

  const out = new Float32Array(63)
  for (let i = 0; i < 21; i++) {
    out[i * 3]     = (landmarks[i].x - wrist.x) / scale
    out[i * 3 + 1] = (landmarks[i].y - wrist.y) / scale
    out[i * 3 + 2] = (landmarks[i].z - wrist.z) / scale
  }
  return out
}

/**
 * Build the 126-float feature vector: right[63] + left[63].
 * Missing hand slots are left as zeros.
 * Handles single-hand-only signing correctly (§3A post-mastectomy, §3D post-stroke).
 *
 * @param {Array<Array<{x,y,z}>>} multiHandLandmarks
 * @param {Array<{label:string}>}  multiHandedness
 * @returns {Float32Array} length 126
 */
export function normalizeTwoHands(multiHandLandmarks, multiHandedness) {
  const right = new Float32Array(63)  // default zeros = hand absent
  const left  = new Float32Array(63)

  if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
    return new Float32Array(126)
  }

  for (let i = 0; i < multiHandLandmarks.length; i++) {
    const side   = multiHandedness?.[i]?.label ?? 'Right'
    const normed = normalizeSingleHand(multiHandLandmarks[i])
    if (side === 'Right') right.set(normed)
    else                  left.set(normed)
  }

  const out = new Float32Array(126)
  out.set(right, 0)
  out.set(left, 63)
  return out
}

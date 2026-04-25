/**
 * ISLCamera.jsx — v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Detection pipeline (master training prompt §8):
 *
 *   1. WebRTC webcam → MediaPipe Hands (30fps visual refresh)
 *   2. Inference throttled to 10fps (100ms interval) — rolling 60-frame window
 *   3. Landmark normalisation: wrist-centred, palm-width scaled (126 floats)
 *   4. Elderly demographic: EMA tremor filter applied before inference
 *   5. Confidence check vs demographic-adjusted threshold
 *   6. CRITICAL signs (SANS-TAKLEEF, SEENE-DARD): fire on FIRST qualifying frame
 *   7. Non-critical: require VOTE_FRAMES (5) consecutive agreeing frames
 *   8. CARDIAC_EMERGENCY: both critical signs within 10s → escalate
 *   9. GDPR/DPDP Act 2023: no raw video stored; only landmark tensors processed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { normalizeSingleHand } from '../../utils/islNormalize'
import { loadModel, predict, LABELS, CRITICAL_SIGNS, getThreshold } from '../../utils/islInference'
import { loadMediaPipeHands }    from '../../utils/loadMediaPipeHands'
import { loadMediaPipeFaceMesh } from '../../utils/loadMediaPipeFaceMesh'

const TEAL             = '#0F6E56'
const INFER_INTERVAL   = 100   // ms between inference calls (10fps)
const VOTE_FRAMES      = 5     // consecutive frames to confirm non-critical sign
const WINDOW_FRAMES    = 60    // rolling window size (6s at 10fps)
const CARDIAC_WINDOW   = 10000 // ms — SEENE-DARD + SANS-TAKLEEF combo window
const EMA_ALPHA        = 0.35  // smoothing factor for elderly tremor filter

// Hand-count gates: signs that require exactly one or two hands
const ONE_HAND_SIGNS = new Set(['DARD', 'BUKHAR', 'PET-DARD', 'ULTI', 'SEENE-DARD', 'CHAKKAR', 'KAMZORI'])
const TWO_HAND_SIGNS = new Set(['SANS-TAKLEEF', 'SAR-DARD'])

// Proximity gates: sign -> { part, maxDist } in normalised image coords (0–1).
// Gate is skipped (fail-open) when face is not detected.
const PROXIMITY_GATES = {
  BUKHAR:          { part: 'forehead', maxDist: 0.28 },
  'SAR-DARD':      { part: 'head',     maxDist: 0.32 },
  'PET-DARD':      { part: 'abdomen',  maxDist: 0.30 },
  ULTI:            { part: 'mouth',    maxDist: 0.24 },
  'SANS-TAKLEEF':  { part: 'chest',    maxDist: 0.32 },
  'SEENE-DARD':    { part: 'chest',    maxDist: 0.30 },
  CHAKKAR:         { part: 'head',     maxDist: 0.45 },
}

// DARD is a claw hand: fingers partially curled (not flat open, not full fist).
// Block if curl < 0.25 (flat open palm) — idle open hand is NOT dard.
const DARD_MIN_CURL = 0.25

/**
 * Extract normalised body reference points from FaceMesh landmarks.
 * Chest and abdomen are approximated from face geometry (no Pose needed on frontend).
 * Returns null if landmarks not available.
 */
/**
 * Returns 0.0 (open hand) → 1.0 (full fist).
 * lm: array of 21 MediaPipe landmark objects {x,y,z}.
 * Checks 4 fingers: if fingertip is closer to wrist than MCP → curled.
 */
function fingerCurlRatio(lm) {
  if (!lm) return 0
  const wrist = lm[0]
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
  // (tip_idx, mcp_idx) for index, middle, ring, pinky
  const pairs = [[8,5],[12,9],[16,13],[20,17]]
  let curled = 0
  for (const [ti, mi] of pairs) {
    if (dist(lm[ti], wrist) < dist(lm[mi], wrist) * 0.85) curled++
  }
  return curled / 4
}

function extractBodyPoints(fl) {
  if (!fl || fl.length < 468) return null
  const forehead = { x: fl[10].x,  y: fl[10].y  }
  const head     = {
    x: (fl[10].x + fl[1].x + fl[234].x + fl[454].x) / 4,
    y: (fl[10].y + fl[1].y + fl[234].y + fl[454].y) / 4,
  }
  const mouth    = { x: fl[13].x,  y: fl[13].y  }
  const faceH    = Math.abs(fl[10].y - fl[152].y)   // forehead→chin height
  const noseX    = fl[1].x
  const chest    = { x: noseX,     y: fl[152].y + faceH * 1.0 }
  const abdomen  = { x: noseX,     y: fl[152].y + faceH * 2.0 }
  return { forehead, head, mouth, chest, abdomen }
}

// MediaPipe hand skeleton connections
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
]

/**
 * @param {object}   props
 * @param {function} props.onSymptomDetected   called with sign label string when confirmed
 * @param {function} [props.onDebugUpdate]     called each frame with debug payload
 * @param {'women'|'men'|'child'|'elderly'} [props.demographic='men']
 */
export default function ISLCamera({ onSymptomDetected, onDebugUpdate, demographic = 'men' }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const modelRef  = useRef(null)

  // Rolling window of predicted labels (max WINDOW_FRAMES)
  const windowRef = useRef([])

  // Voting state for non-critical signs
  const voteRef   = useRef({ label: null, count: 0 })

  // Already-fired signs this session — suppress re-firing
  const firedRef  = useRef(new Set())

  // CARDIAC_EMERGENCY tracking: stores timestamps of critical sign detections
  const criticalTs = useRef({})

  // 10fps inference throttle
  const lastInferTs = useRef(0)

  // Tremor EMA filter state (elderly only)
  const emaRef = useRef(null)

  // FPS tracker
  const fpsRef = useRef({ frames: 0, last: Date.now(), fps: 0 })

  // Fix 4: carry-forward — last good landmarks per hand
  const prevRightRef = useRef(new Float32Array(63))
  const prevLeftRef  = useRef(new Float32Array(63))

  // Bonus: landmark smoothing — rolling buffer of last 3 feature vectors
  const smoothBufRef = useRef([])

  // Face landmarks — updated by FaceMesh, read by proximity gate
  const faceLandmarksRef = useRef(null)

  const [status,       setStatus]       = useState('loading')   // 'loading'|'ready'|'no-model'
  const [prediction,   setPrediction]   = useState(null)        // { label, confidence }
  const [handVisible,  setHandVisible]  = useState(false)
  const [sentence,     setSentence]     = useState([])          // captured signs
  const [cardiacAlert, setCardiacAlert] = useState(false)

  // ── Load TF.js model ────────────────────────────────────────────────────────
  useEffect(() => {
    loadModel('/tfjs_model/model.json')
      .then(m => {
        modelRef.current = m
        setStatus('ready')
        onDebugUpdate?.({
          modelInfo: {
            loaded: true,
            inputShape: m.inputs[0].shape.join('×'),
            numClasses: LABELS.length,
            demographic,
          },
        })
      })
      .catch(err => {
        console.error('[ISLCamera] model load failed:', err)
        setStatus('no-model')
        onDebugUpdate?.({ modelInfo: { loaded: false } })
      })
  }, [])

  // ── CARDIAC_EMERGENCY check ─────────────────────────────────────────────────
  const checkCardiacEmergency = useCallback((sign, now) => {
    criticalTs.current[sign] = now
    const ts1 = criticalTs.current['SEENE-DARD']
    const ts2 = criticalTs.current['SANS-TAKLEEF']
    if (ts1 && ts2 && Math.abs(ts1 - ts2) <= CARDIAC_WINDOW) {
      setCardiacAlert(true)
      onDebugUpdate?.({ cardiacEmergency: true })
    }
  }, [onDebugUpdate])

  // ── EMA tremor filter (elderly) ─────────────────────────────────────────────
  const applyTremorFilter = useCallback((features) => {
    if (demographic !== 'elderly') return features
    if (!emaRef.current || emaRef.current.length !== features.length) {
      emaRef.current = new Float32Array(features)
      return features
    }
    const smoothed = new Float32Array(features.length)
    for (let i = 0; i < features.length; i++) {
      smoothed[i] = EMA_ALPHA * features[i] + (1 - EMA_ALPHA) * emaRef.current[i]
    }
    emaRef.current = smoothed
    return smoothed
  }, [demographic])

  // ── MediaPipe results callback ──────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.clientWidth  || canvas.width
    const H = canvas.clientHeight || canvas.height
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // FPS counter
    const fp = fpsRef.current
    fp.frames++
    const now = Date.now()
    if (now - fp.last >= 1000) { fp.fps = fp.frames; fp.frames = 0; fp.last = now }

    const handsDetected = results.multiHandLandmarks?.length ?? 0

    // Gate 0: no hands → reset state
    if (handsDetected === 0) {
      setHandVisible(false)
      setPrediction(null)
      voteRef.current      = { label: null, count: 0 }
      emaRef.current       = null
      prevRightRef.current = new Float32Array(63)
      prevLeftRef.current  = new Float32Array(63)
      smoothBufRef.current = []
      onDebugUpdate?.({ handsDetected: 0, fps: fp.fps, scores: null })
      return
    }

    setHandVisible(true)
    for (const lm of results.multiHandLandmarks) drawSkeleton(ctx, lm, canvas.width, canvas.height)

    if (!modelRef.current) return

    // 10fps inference throttle
    if (now - lastInferTs.current < INFER_INTERVAL) return
    lastInferTs.current = now

    // Fix 3: x-position sort instead of MediaPipe L/R labels (no more swaps)
    // Fix 4: carry-forward if a hand is missing this frame
    const handsWithIdx = (results.multiHandLandmarks || []).map((lm, i) => ({
      lm,
      handedness: results.multiHandedness?.[i],
      wristX: lm[0].x,
    })).sort((a, b) => a.wristX - b.wristX)  // leftmost wrist first

    const right = new Float32Array(63)
    const left  = new Float32Array(63)

    handsWithIdx.forEach((h, rank) => {
      const conf = h.handedness?.classification?.[0]?.score ?? 1
      if (conf < 0.75) return  // Bonus: per-hand confidence gate
      const normed = normalizeSingleHand(h.lm)
      if (rank === 0) left.set(normed)   // leftmost = left hand
      else            right.set(normed)  // rightmost = right hand
    })

    // carry-forward: if hand dropped this frame use last known
    const finalRight = right.some(v => v !== 0) ? right : prevRightRef.current
    const finalLeft  = left.some(v => v !== 0)  ? left  : prevLeftRef.current
    if (right.some(v => v !== 0)) prevRightRef.current = right
    if (left.some(v => v !== 0))  prevLeftRef.current  = left

    let features = new Float32Array(126)
    features.set(finalRight, 0)
    features.set(finalLeft, 63)

    // Bonus: landmark smoothing — average last 3 frames to reduce jitter
    smoothBufRef.current.push(features)
    if (smoothBufRef.current.length > 3) smoothBufRef.current.shift()
    if (smoothBufRef.current.length > 1) {
      const avg = new Float32Array(126)
      for (const f of smoothBufRef.current)
        for (let i = 0; i < 126; i++) avg[i] += f[i] / smoothBufRef.current.length
      features = avg
    }

    features = applyTremorFilter(features)

    // Inference
    const raw = predict(modelRef.current, features)
    onDebugUpdate?.({ features, scores: raw.scores, handsDetected, fps: fp.fps })

    // Threshold check (demographic-adjusted)
    const threshold = getThreshold(raw.label, demographic)
    if (
      raw.confidence < threshold ||
      raw.label === 'UNCERTAIN' ||
      raw.label === 'NO_SIGN'
    ) {
      setPrediction(null)
      voteRef.current = { label: null, count: 0 }
      return
    }

    // Hand-count gate: 1 hand → only single-hand signs valid; 2 hands → only two-hand signs valid
    if (handsDetected === 1 && TWO_HAND_SIGNS.has(raw.label)) {
      setPrediction(null)
      voteRef.current = { label: null, count: 0 }
      return
    }
    if (handsDetected >= 2 && ONE_HAND_SIGNS.has(raw.label)) {
      setPrediction(null)
      voteRef.current = { label: null, count: 0 }
      return
    }

    // Fist gate: SANS-TAKLEEF requires a closed fist — blocks any-hand-near-chest hallucinations
    if (raw.label === 'SANS-TAKLEEF') {
      const curls = handsWithIdx.map(h => fingerCurlRatio(h.lm))
      if (Math.max(...curls) < 0.50) {
        setPrediction(null)
        voteRef.current = { label: null, count: 0 }
        return
      }
    }

    // Claw gate: DARD is a claw hand (fingers partially curled).
    // Block if ALL active hands are flat open (curl < DARD_MIN_CURL).
    // A completely flat open palm in front of the camera is NOT the DARD sign.
    if (raw.label === 'DARD') {
      const curls = handsWithIdx.map(h => fingerCurlRatio(h.lm))
      if (Math.max(...curls) < DARD_MIN_CURL) {
        setPrediction(null)
        voteRef.current = { label: null, count: 0 }
        return
      }
    }

    // Proximity gate: hand must be near the relevant body part for face-area signs.
    // Skipped (fail-open) when face not detected — never blocks detection in bad lighting.
    const gate = PROXIMITY_GATES[raw.label]
    if (gate) {
      const bodyPts = extractBodyPoints(faceLandmarksRef.current)
      const ref = bodyPts?.[gate.part]
      if (ref) {
        // Find minimum wrist distance across all detected hands
        const minDist = handsWithIdx.reduce((best, h) => {
          const wx = h.lm[0].x, wy = h.lm[0].y
          const d  = Math.hypot(wx - ref.x, wy - ref.y)
          return Math.min(best, d)
        }, Infinity)
        if (minDist > gate.maxDist) {
          setPrediction(null)
          voteRef.current = { label: null, count: 0 }
          return
        }
      }
    }

    // Update rolling window
    const win = windowRef.current
    win.push(raw.label)
    if (win.length > WINDOW_FRAMES) win.shift()

    setPrediction(raw)

    // Already fired this sign — suppress
    if (firedRef.current.has(raw.label)) return

    // CRITICAL signs: fire immediately (§8)
    if (CRITICAL_SIGNS.has(raw.label)) {
      firedRef.current.add(raw.label)
      checkCardiacEmergency(raw.label, now)
      onSymptomDetected?.(raw.label)
      voteRef.current = { label: null, count: 0 }
      return
    }

    // Non-critical: 5-frame majority vote
    const vote = voteRef.current
    if (vote.label === raw.label) {
      vote.count++
      if (vote.count >= VOTE_FRAMES) {
        firedRef.current.add(raw.label)
        onSymptomDetected?.(raw.label)
        voteRef.current = { label: null, count: 0 }
      }
    } else {
      voteRef.current = { label: raw.label, count: 1 }
    }
  }, [onSymptomDetected, onDebugUpdate, demographic, applyTremorFilter, checkCardiacEmergency])

  // ── Webcam + MediaPipe init ─────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let rafId = null, handsInstance = null, faceMeshInstance = null, stream = null

    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      video.srcObject = stream
      await video.play()

      // Hands
      const Hands = await loadMediaPipeHands()
      handsInstance = new Hands({
        locateFile: f => `https://unpkg.com/@mediapipe/hands@0.4.1646424915/${f}`,
      })
      handsInstance.setOptions({
        maxNumHands:            2,
        modelComplexity:        0,    // lite model — better fist / self-occlusion tracking
        minDetectionConfidence: 0.40, // lowered: fists lose confidence fast
        minTrackingConfidence:  0.40, // lowered: keep tracking through curl
      })
      handsInstance.onResults(onResults)

      // FaceMesh — only used for position, not expressions
      try {
        const FaceMesh = await loadMediaPipeFaceMesh()
        faceMeshInstance = new FaceMesh({
          locateFile: f => `https://unpkg.com/@mediapipe/face_mesh@0.4.1633559619/${f}`,
        })
        faceMeshInstance.setOptions({
          maxNumFaces:            1,
          refineLandmarks:        false,   // skip iris — saves ~3ms/frame
          minDetectionConfidence: 0.50,
          minTrackingConfidence:  0.50,
        })
        faceMeshInstance.onResults(r => {
          // Just store the latest face landmarks — used by proximity gate in onResults
          faceLandmarksRef.current = r.multiFaceLandmarks?.[0] ?? null
        })
      } catch (e) {
        console.warn('[ISLCamera] FaceMesh unavailable — proximity gate disabled:', e)
      }

      const tick = async () => {
        if (video.readyState >= 2) {
          await handsInstance.send({ image: video })
          // FaceMesh runs on same frame — results stored in faceLandmarksRef
          if (faceMeshInstance) await faceMeshInstance.send({ image: video })
        }
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    init().catch(console.error)

    return () => {
      if (rafId)             cancelAnimationFrame(rafId)
      if (stream)            stream.getTracks().forEach(t => t.stop())
      if (handsInstance)     handsInstance.close()
      if (faceMeshInstance)  faceMeshInstance.close()
    }
  }, [onResults])

  // ── Skeleton drawing ────────────────────────────────────────────────────────
  function drawSkeleton(ctx, lm, w, h) {
    const mx = x => (1 - x) * w  // mirror for selfie view
    ctx.strokeStyle = 'rgba(15,110,86,0.75)'
    ctx.lineWidth   = 2
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath()
      ctx.moveTo(mx(lm[a].x), lm[a].y * h)
      ctx.lineTo(mx(lm[b].x), lm[b].y * h)
      ctx.stroke()
    })
    lm.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(mx(p.x), p.y * h, i === 0 ? 7 : 4, 0, Math.PI * 2)
      ctx.fillStyle   = i === 0 ? TEAL : 'rgba(15,110,86,0.9)'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 1.5
      ctx.fill(); ctx.stroke()
    })
  }

  // ── Session helpers ─────────────────────────────────────────────────────────
  const clearSession = () => {
    setSentence([])
    setCardiacAlert(false)
    firedRef.current.clear()
    voteRef.current    = { label: null, count: 0 }
    windowRef.current  = []
    emaRef.current     = null
    criticalTs.current = {}
  }

  const speak = () => {
    if (!sentence.length) return
    const u = new SpeechSynthesisUtterance(sentence.join(' '))
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  const voteProgress = prediction && !CRITICAL_SIGNS.has(prediction.label)
    ? (voteRef.current.label === prediction.label ? voteRef.current.count : 0)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* CARDIAC_EMERGENCY banner */}
      {cardiacAlert && (
        <div style={{
          background: '#7f1d1d', color: '#fff',
          padding: '0.85rem 1.25rem', borderRadius: 14,
          fontWeight: 800, fontSize: '0.88rem', textAlign: 'center',
          animation: 'islPulse 1s infinite',
        }}>
          🚨 CARDIAC EMERGENCY — Chest pain + Breathlessness detected. Escalate immediately.
        </div>
      )}

      {/* Camera card */}
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        background: '#0f172a', aspectRatio: '4/3', maxHeight: 420,
      }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          muted playsInline
        />
        <canvas
          ref={canvasRef} width={640} height={480}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <StatusBadge status={status} handVisible={handVisible} />
        {prediction && (
          <PredictionOverlay
            label={prediction.label}
            confidence={prediction.confidence}
            voteCount={voteProgress ?? VOTE_FRAMES}
            voteMax={VOTE_FRAMES}
            isCritical={CRITICAL_SIGNS.has(prediction.label)}
          />
        )}
      </div>

      {/* Sentence builder */}
      <SentenceBar
        sentence={sentence}
        currentLabel={prediction?.label ?? null}
        onAdd={() => { if (prediction) setSentence(p => [...p, prediction.label]) }}
        onClear={clearSession}
        onSpeak={speak}
      />

      <style>{`
        @keyframes islPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status, handVisible }) {
  const cfg =
    status === 'loading'  ? { dot: '#f59e0b', text: 'Loading model...' }
    : status === 'no-model' ? { dot: '#ef4444', text: 'No model — check /public/tfjs_model/' }
    : handVisible           ? { dot: TEAL,      text: '● Hand detected' }
    :                         { dot: '#64748b',  text: 'Show your hand to camera' }

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      borderRadius: 20, padding: '5px 12px',
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      <span style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 600 }}>{cfg.text}</span>
    </div>
  )
}

function PredictionOverlay({ label, confidence, voteCount, voteMax, isCritical }) {
  const pct    = isCritical ? 1 : Math.min(voteCount / voteMax, 1)
  const locked = pct >= 1
  const bg     = locked
    ? (isCritical ? 'rgba(163,45,45,0.92)' : 'rgba(15,110,86,0.92)')
    : 'rgba(0,0,0,0.65)'

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: bg, backdropFilter: 'blur(8px)',
      borderRadius: 16, padding: '10px 22px', textAlign: 'center', minWidth: 180,
      transition: 'background 0.3s',
    }}>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginTop: 2 }}>
        {(confidence * 100).toFixed(0)}% confidence
        {isCritical && <span style={{ marginLeft: 6, color: '#fca5a5', fontWeight: 700 }}>CRITICAL</span>}
      </div>
      {!isCritical && (
        <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2, background: '#fff',
            width: `${pct * 100}%`, transition: 'width 0.1s linear',
          }} />
        </div>
      )}
    </div>
  )
}

function SentenceBar({ sentence, currentLabel, onAdd, onClear, onSpeak }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1rem 1.25rem',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>
          SESSION CAPTURE
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={onAdd}   disabled={!currentLabel} bg={TEAL}>
            + Add {currentLabel ? `"${currentLabel}"` : '...'}
          </Btn>
          <Btn onClick={onSpeak} disabled={!sentence.length} bg="#3b82f6">Speak</Btn>
          <Btn onClick={onClear} disabled={!sentence.length} bg="#ef4444">Clear</Btn>
        </div>
      </div>
      <div style={{
        minHeight: 44, background: '#f8fafc', borderRadius: 10,
        padding: '0.6rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      }}>
        {sentence.length === 0
          ? <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Confirmed signs appear here automatically
            </span>
          : sentence.map((w, i) => (
            <span key={i} style={{
              background: 'rgba(15,110,86,0.12)', color: TEAL,
              borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: '0.85rem',
            }}>{w}</span>
          ))
        }
      </div>
    </div>
  )
}

function Btn({ onClick, disabled, bg, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#e2e8f0' : bg,
        color: disabled ? '#94a3b8' : '#fff',
        border: 'none', borderRadius: 8, padding: '5px 12px',
        fontSize: '0.72rem', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
      }}
    >{children}</button>
  )
}

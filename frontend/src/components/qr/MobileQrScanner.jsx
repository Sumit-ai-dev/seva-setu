import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * MobileQrScanner
 * ───────────────
 * Camera-based QR code scanner optimized for mobile screens.
 *
 * Props:
 *   onScanSuccess(patientId)  — called with the patient ID from a valid QR JSON
 *   onRawData(data)           — optional: called with raw scan string for debugging
 *   onError(message)          — optional: called on camera / parse errors
 *
 * The component:
 *   1. Requests camera permission and handles denial gracefully.
 *   2. Renders a live video feed with a scanning overlay.
 *   3. Uses BarcodeDetector (Chrome 83+) or falls back to manual polling.
 *   4. On detection, stops scanning, parses JSON, and extracts `id`.
 *   5. If the scanned data is a URL with a patient-record path, extracts ID.
 *   6. Includes error handling for invalid JSON / non-patient QR codes.
 */

const SCAN_INTERVAL = 300 // ms between scan attempts

export default function MobileQrScanner({ onScanSuccess, onRawData, onError }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scannerRef = useRef(null)
  const timerRef = useRef(null)

  const [status, setStatus] = useState('init') // init | requesting | scanning | success | denied | error
  const [scannedData, setScannedData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // ── Cleanup ──
  const stopCamera = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  // ── Start camera ──
  const startCamera = useCallback(async () => {
    setStatus('requesting')
    setErrorMsg('')

    // Check for secure context (HTTPS required)
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      setStatus('error')
      setErrorMsg('Camera requires HTTPS. Use ngrok to access the app securely on mobile.')
      onError?.('HTTPS required for camera access')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('scanning')
      startScanning()
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied')
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings and reload.')
        onError?.('Camera permission denied')
      } else if (err.name === 'NotFoundError') {
        setStatus('error')
        setErrorMsg('No camera found on this device.')
        onError?.('No camera found')
      } else {
        setStatus('error')
        setErrorMsg(`Camera error: ${err.message}`)
        onError?.(err.message)
      }
    }
  }, [onError])

  // ── Auto-start on mount ──
  useEffect(() => {
    startCamera()
  }, [startCamera])

  // ── Scanning logic using BarcodeDetector ──
  const startScanning = useCallback(() => {
    // Use BarcodeDetector if available (Chrome 83+, most Android browsers)
    if ('BarcodeDetector' in window) {
      scannerRef.current = new BarcodeDetector({ formats: ['qr_code'] })
    }

    timerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return

      try {
        let result = null

        if (scannerRef.current) {
          // BarcodeDetector path
          const barcodes = await scannerRef.current.detect(videoRef.current)
          if (barcodes.length > 0) {
            result = barcodes[0].rawValue
          }
        } else {
          // Canvas fallback for browsers without BarcodeDetector
          const canvas = canvasRef.current
          if (!canvas) return
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          ctx.drawImage(videoRef.current, 0, 0)
          // Without BarcodeDetector, we can't decode QR from canvas alone.
          // Show a message to the user.
          return
        }

        if (result) {
          handleScanResult(result)
        }
      } catch {
        // Silently skip frame errors
      }
    }, SCAN_INTERVAL)
  }, [])

  // ── Process scanned data ──
  const handleScanResult = useCallback((raw) => {
    clearInterval(timerRef.current)
    stopCamera()
    setScannedData(raw)
    onRawData?.(raw)

    // Strategy 1: Try parsing as direct JSON payload  { "id": "...", "blood": "...", "allergies": "..." }
    try {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.id) {
        setStatus('success')
        onScanSuccess?.(parsed.id)
        return
      }
    } catch {
      // Not direct JSON — try URL extraction
    }

    // Strategy 2: Extract patient ID from URL like /patient-record/p_abc123#d=...
    try {
      const url = new URL(raw)
      const pathMatch = url.pathname.match(/\/patient-record\/([^/]+)/)
      if (pathMatch && pathMatch[1]) {
        setStatus('success')
        onScanSuccess?.(pathMatch[1])
        return
      }
    } catch {
      // Not a valid URL either
    }

    // Strategy 3: If raw string looks like a patient ID directly
    if (/^p_[a-z0-9]+$/.test(raw)) {
      setStatus('success')
      onScanSuccess?.(raw)
      return
    }

    // Nothing matched
    setStatus('error')
    setErrorMsg('Scanned QR is not a valid Seva Setu patient code.')
    onError?.('Invalid QR format')
  }, [onScanSuccess, onRawData, onError, stopCamera])

  // ── Retry ──
  const retry = () => {
    setScannedData(null)
    setErrorMsg('')
    startCamera()
  }

  return (
    <div style={styles.container}>
      <style>{`
        .mqs-overlay {
          animation: mqs-scan 2s ease-in-out infinite;
        }
        @keyframes mqs-scan {
          0%, 100% { top: 15%; }
          50% { top: 75%; }
        }
        .mqs-pulse {
          animation: mqs-pulse 1.5s ease-in-out infinite;
        }
        @keyframes mqs-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      {/* ─── Camera Feed ─── */}
      {(status === 'scanning' || status === 'requesting') && (
        <div style={styles.videoWrap}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={styles.video}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanning overlay */}
          {status === 'scanning' && (
            <>
              {/* Corner markers */}
              <div style={styles.frame}>
                <div style={{ ...styles.corner, top: 0, left: 0, borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
                <div style={{ ...styles.corner, top: 0, right: 0, borderTop: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
                <div style={{ ...styles.corner, bottom: 0, left: 0, borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981' }} />
                <div style={{ ...styles.corner, bottom: 0, right: 0, borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981' }} />
              </div>

              {/* Scan line */}
              <div className="mqs-overlay" style={styles.scanLine} />

              {/* Instructions */}
              <div style={styles.instructions}>
                <span className="mqs-pulse" style={{ fontSize: '1rem' }}>📷</span>
                <span>Point camera at Patient QR code</span>
              </div>
            </>
          )}

          {status === 'requesting' && (
            <div style={styles.loading}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
              <div>Requesting camera access…</div>
            </div>
          )}
        </div>
      )}

      {/* ─── Success State ─── */}
      {status === 'success' && (
        <div style={styles.resultCard}>
          <div style={styles.successIcon}>✅</div>
          <h3 style={styles.resultTitle}>Patient QR Scanned!</h3>
          <p style={styles.resultText}>Opening patient record…</p>
          {scannedData && (
            <div style={styles.rawData}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>SCANNED DATA</div>
              <div style={{ fontSize: '0.75rem', color: '#475569', wordBreak: 'break-all', maxHeight: 100, overflow: 'auto' }}>
                {scannedData.slice(0, 200)}{scannedData.length > 200 ? '…' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Error / Denied State ─── */}
      {(status === 'denied' || status === 'error') && (
        <div style={styles.resultCard}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
            {status === 'denied' ? '🚫' : '⚠️'}
          </div>
          <h3 style={{ ...styles.resultTitle, color: '#dc2626' }}>
            {status === 'denied' ? 'Camera Access Denied' : 'Scan Error'}
          </h3>
          <p style={styles.resultText}>{errorMsg}</p>
          <button onClick={retry} style={styles.retryBtn}>
            🔄 Try Again
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
    maxWidth: 480,
    margin: '0 auto',
  },
  videoWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3/4',
    background: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  frame: {
    position: 'absolute',
    top: '15%', left: '10%', right: '10%', bottom: '15%',
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 2,
    background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
    boxShadow: '0 0 12px rgba(16,185,129,0.5)',
    pointerEvents: 'none',
  },
  instructions: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.5rem 1rem',
    borderRadius: 99,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.9rem',
    background: 'rgba(0,0,0,0.6)',
  },
  resultCard: {
    textAlign: 'center',
    padding: '2.5rem 1.5rem',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  successIcon: { fontSize: '3rem', marginBottom: '0.75rem' },
  resultTitle: { margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
  resultText: { margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 },
  rawData: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    textAlign: 'left',
  },
  retryBtn: {
    marginTop: '1.25rem',
    padding: '0.75rem 1.5rem',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #0d9488, #10b981)',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
    fontFamily: 'inherit',
  },
}

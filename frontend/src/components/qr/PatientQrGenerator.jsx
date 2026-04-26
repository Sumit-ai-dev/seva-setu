import React, { useMemo } from 'react'
import { buildQRUrl, qrImageUrl } from '../../lib/medicalQRStore'

/**
 * PatientQrGenerator
 * ──────────────────
 * Accepts a `patient` object as a prop and renders a printable,
 * dark-mode-safe QR card.
 *
 * The QR payload is a URL whose hash carries a base64-encoded JSON snapshot:
 *   { id, blood, allergies, name, visits, ... }
 *
 * Props:
 *   patient  — full patient object from medicalQRStore
 *   size     — QR image size in px (default 280)
 *   onCopy   — optional callback after link is copied
 */
export default function PatientQrGenerator({ patient, size = 280, onCopy }) {
  const qrUrl = useMemo(() => buildQRUrl(patient), [patient])
  const qrImg = useMemo(() => qrImageUrl(qrUrl, size), [qrUrl, size])

  const payload = useMemo(() => JSON.stringify({
    id: patient.id,
    blood: patient.bloodGroup || 'Unknown',
    allergies: patient.allergies || 'None',
  }, null, 2), [patient])

  function copyLink() {
    navigator.clipboard?.writeText(qrUrl)
      .then(() => onCopy?.())
      .catch(() => {})
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrImg
    a.download = `${(patient.name || 'patient').replace(/\s+/g, '_')}_QR.png`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div style={styles.wrapper}>
      <style>{`
        .pqg-card { transition: box-shadow .25s; }
        .pqg-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; }
        .pqg-btn {
          padding: 0.5rem 1rem;
          border-radius: 9px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #334155;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          font-family: inherit;
          transition: all .15s;
        }
        .pqg-btn:hover { background: #f1f5f9; transform: translateY(-1px); }
      `}</style>

      <div className="pqg-card" style={styles.card}>
        {/* White background ensures QR scans even in dark mode */}
        <div style={styles.qrBox}>
          <img
            src={qrImg}
            alt={`QR code for ${patient.name}`}
            style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block' }}
          />
        </div>

        <div style={styles.info}>
          <div style={styles.name}>{patient.name}</div>
          <div style={styles.meta}>
            {[
              patient.age && `${patient.age} yrs`,
              patient.gender,
              patient.bloodGroup && `🩸 ${patient.bloodGroup}`,
            ].filter(Boolean).join(' · ')}
          </div>
          {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
            <div style={styles.allergy}>⚠ Allergy: {patient.allergies}</div>
          )}
        </div>

        <div style={styles.actions}>
          <button className="pqg-btn" onClick={copyLink}>📋 Copy Link</button>
          <button className="pqg-btn" onClick={downloadQR}>⬇ Download</button>
        </div>

        <details style={styles.details}>
          <summary style={styles.summary}>QR Payload (JSON)</summary>
          <pre style={styles.pre}>{payload}</pre>
        </details>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    maxWidth: 360,
  },
  qrBox: {
    background: '#ffffff',
    padding: '0.75rem',
    borderRadius: 12,
    border: '2px dashed #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  info: { marginBottom: '1rem' },
  name: { fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', marginBottom: 4 },
  meta: { fontSize: '0.85rem', color: '#64748b' },
  allergy: {
    marginTop: 6, fontSize: '0.8rem', fontWeight: 700, color: '#dc2626',
    background: '#fef2f2', padding: '0.3rem 0.6rem', borderRadius: 6,
    display: 'inline-block',
  },
  actions: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' },
  details: { borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' },
  summary: { fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 },
  pre: {
    marginTop: 6, fontSize: '0.72rem', color: '#64748b',
    background: '#f8fafc', padding: '0.5rem', borderRadius: 6,
    overflow: 'auto', whiteSpace: 'pre-wrap',
  },
}

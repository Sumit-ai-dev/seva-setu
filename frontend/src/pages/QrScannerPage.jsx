import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileQrScanner from '../components/qr/MobileQrScanner'

/**
 * QrScannerPage — Public route (/scan)
 * ─────────────
 * Doctors open this on their phone to scan a patient QR code.
 * On successful scan, navigates to the live patient record page.
 */
export default function QrScannerPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function handleSuccess(patientId) {
    // Navigate to the patient record page — the live-update logic lives there
    navigate(`/patient-record/${patientId}`)
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo} onClick={() => navigate('/')}>
          <span style={{ fontSize: '1.25rem' }}>🩺</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>Seva Setu</span>
        </div>
        <div style={styles.badge}>Doctor Mode</div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>Scan Patient QR</h1>
        <p style={styles.subtitle}>
          Point your camera at the patient's QR card to view their complete medical history with live updates.
        </p>

        <MobileQrScanner
          onScanSuccess={handleSuccess}
          onError={(msg) => setError(msg)}
        />

        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.hint}>
          <div style={styles.hintIcon}>💡</div>
          <div>
            <strong>Tip:</strong> Make sure you're using HTTPS (via ngrok) for camera access on mobile.
            The QR code contains the patient's full record — viewable offline.
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
  },
  badge: {
    padding: '0.3rem 0.75rem', borderRadius: 99,
    background: '#f0fdf4', border: '1px solid #86efac',
    color: '#15803d', fontSize: '0.75rem', fontWeight: 700,
  },
  content: {
    maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem',
  },
  title: {
    margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#64748b',
    textAlign: 'center', lineHeight: 1.5,
  },
  errorBanner: {
    marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 10,
    background: '#fef2f2', border: '1px solid #fca5a5',
    color: '#dc2626', fontSize: '0.85rem', fontWeight: 600,
  },
  hint: {
    marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: 10,
    background: '#fffbeb', border: '1px dashed #fcd34d',
    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
    fontSize: '0.8rem', color: '#78350f', lineHeight: 1.45,
  },
  hintIcon: { fontSize: '1rem', flexShrink: 0 },
}

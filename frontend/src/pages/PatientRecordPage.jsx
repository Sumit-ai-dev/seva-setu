import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { decodePatientFromHash, getPatient } from '../lib/medicalQRStore'

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PatientRecordPage() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [source, setSource] = useState(null) // 'qr' | 'local' | null
  const [isLive, setIsLive] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  // ── Initial load: hash first, then localStorage ──
  useEffect(() => {
    const hash = window.location.hash || ''
    const m = hash.match(/d=([^&]+)/)
    if (m && m[1]) {
      const fromHash = decodePatientFromHash(m[1])
      if (fromHash) {
        setPatient(fromHash)
        setSource('qr')
        setLastRefresh(new Date())
        return
      }
    }
    if (id) {
      const local = getPatient(id)
      if (local) {
        setPatient(local)
        setSource('local')
        setIsLive(true)
        setLastRefresh(new Date())
      }
    }
  }, [id])

  // ── Live-update polling (every 3 seconds) ──
  // Polls BOTH localStorage (same browser) AND the sync API (cross-device/phone)
  useEffect(() => {
    if (!id) return

    const poll = setInterval(async () => {
      let latest = null

      // Strategy 1: Check localStorage (same browser)
      const fromLocal = getPatient(id)
      if (fromLocal) latest = fromLocal

      // Strategy 2: Check sync API (cross-device — phone via ngrok)
      try {
        const res = await fetch(`/patient-sync/${id}`)
        if (res.ok) {
          const fromServer = await res.json()
          if (fromServer && fromServer.id) {
            // Use whichever is newer
            if (!latest || (fromServer.updatedAt || 0) > (latest.updatedAt || 0)) {
              latest = fromServer
            }
          }
        }
      } catch { /* server sync unavailable — localStorage is fine */ }

      if (latest) {
        setPatient(prev => {
          if (!prev || latest.updatedAt !== prev.updatedAt) {
            setLastRefresh(new Date())
            setIsLive(true)
            setSource(fromLocal ? 'local' : 'sync')
            return latest
          }
          return prev
        })
      }
    }, 3000)

    // Also listen for cross-tab localStorage changes (instant)
    const onStorage = (e) => {
      if (e.key === 'swasth_medical_qr_patients_v1') {
        const latest = getPatient(id)
        if (latest) {
          setPatient(latest)
          setLastRefresh(new Date())
          setIsLive(true)
        }
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(poll)
      window.removeEventListener('storage', onStorage)
    }
  }, [id])

  const visits = useMemo(
    () => (patient?.visits || []).slice().sort((a, b) => (b.date || 0) - (a.date || 0)),
    [patient]
  )

  if (!patient) {
    return (
      <div style={pageWrap}>
        <div style={cardWrap}>
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>❓</div>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>
              Record not found
            </h1>
            <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
              This QR code may be invalid or expired. Ask the ASHA worker to regenerate the
              patient's health card.
            </p>
            {id && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Patient ID: {id}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageWrap}>
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
        }
      `}</style>

      {/* Doctor-facing banner */}
      <div className="no-print" style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
        color: '#fff', padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap',
      }}>
        <style>{`
          @keyframes live-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
          .live-dot { width:8px;height:8px;border-radius:50%;background:#4ade80;animation:live-pulse 1.5s ease-in-out infinite;display:inline-block; }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🩺</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Seva Setu — Patient Health Record
              {isLive && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '0.15rem 0.5rem', borderRadius: 99 }}>
                  <span className="live-dot" /> LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>Source: {source === 'qr' ? 'QR scan' : 'Local record'}</span>
              {lastRefresh && (
                <span>• Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              )}
              {isLive && <span>• Auto-refreshing every 3s</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            padding: '0.5rem 1rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.825rem',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}>
          🖨 Print
        </button>
      </div>

      <div style={cardWrap}>
        <div className="print-card" style={cardInner}>
          {/* Header */}
          <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Patient ID: {patient.id}
            </div>
            <h1 style={{ margin: '0.25rem 0 0.4rem', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {patient.name}
            </h1>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center', color: '#475569', fontSize: '0.875rem' }}>
              {patient.age && <span>{patient.age} yrs</span>}
              {patient.gender && <Sep>•</Sep>}
              {patient.gender && <span>{patient.gender}</span>}
              {patient.district && <Sep>•</Sep>}
              {patient.district && <span>📍 {patient.district}{patient.tehsil ? `, ${patient.tehsil}` : ''}</span>}
            </div>

            <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {patient.phone && <Pill color="#0f172a" bg="#f1f5f9">📞 {patient.phone}</Pill>}
              {patient.bloodGroup && <Pill color="#b91c1c" bg="#fef2f2" border="#fecaca">🩸 Blood Group: {patient.bloodGroup}</Pill>}
              {patient.allergies && (
                <Pill color="#b45309" bg="#fffbeb" border="#fcd34d">
                  ⚠ Allergies: {patient.allergies}
                </Pill>
              )}
            </div>
          </div>

          {/* Critical alerts */}
          {patient.allergies && patient.allergies.toLowerCase() !== 'none' && (
            <div style={{
              margin: '1.25rem 1.5rem 0', padding: '0.875rem 1rem',
              background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
              display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🚨</span>
              <div>
                <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.875rem' }}>
                  ALLERGY WARNING
                </div>
                <div style={{ fontSize: '0.825rem', color: '#7f1d1d', marginTop: 2 }}>
                  Do NOT prescribe: <strong>{patient.allergies}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Visits */}
          <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Medical History
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                {visits.length} visit{visits.length !== 1 ? 's' : ''} on record
              </span>
            </div>

            {visits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                No visits have been recorded yet for this patient.
              </div>
            )}

            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              {/* Timeline rail */}
              {visits.length > 0 && (
                <div style={{
                  position: 'absolute', left: 7, top: 0, bottom: 0,
                  width: 2, background: 'linear-gradient(180deg, #10b981 0%, #cbd5e1 100%)',
                }} />
              )}

              {visits.map((visit, idx) => {
                const isLatest = idx === 0
                return (
                  <div key={visit.id} style={{ position: 'relative', marginBottom: idx < visits.length - 1 ? '1.25rem' : 0 }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: -22, top: 14,
                      width: 16, height: 16, borderRadius: '50%',
                      background: isLatest ? '#10b981' : '#fff',
                      border: `3px solid ${isLatest ? '#10b981' : '#cbd5e1'}`,
                      boxShadow: isLatest ? '0 0 0 4px rgba(16,185,129,0.18)' : 'none',
                    }} />

                    <div style={{
                      background: isLatest ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${isLatest ? '#86efac' : '#e2e8f0'}`,
                      borderRadius: 12, padding: '0.875rem 1rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800,
                            padding: '0.15rem 0.5rem', borderRadius: 99,
                            background: isLatest ? '#10b981' : '#94a3b8', color: '#fff',
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                          }}>
                            {isLatest ? 'Most recent' : `Visit #${visits.length - idx}`}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                            {fmtDate(visit.date)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '0.625rem' }}>
                        {visit.symptoms && (
                          <Field label="Symptoms" icon="🩺" value={visit.symptoms} />
                        )}
                        {visit.diagnosis && (
                          <Field label="Diagnosis" icon="🧬" value={visit.diagnosis} />
                        )}
                        {visit.medications && (
                          <Field label="Medications" icon="💊" value={visit.medications} highlight />
                        )}
                        {visit.notes && (
                          <Field label="Notes" icon="📝" value={visit.notes} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '0.875rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.7rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Last updated: {fmtDate(patient.updatedAt)}</span>
            <span>Generated via Seva Setu QR Card</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const pageWrap = {
  minHeight: '100vh',
  background: '#f1f5f9',
  fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
  color: '#0f172a',
}

const cardWrap = {
  maxWidth: 820,
  margin: '0 auto',
  padding: '1.5rem 1rem 3rem',
}

const cardInner = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
  overflow: 'hidden',
}

function Sep({ children }) {
  return <span style={{ color: '#cbd5e1' }}>{children}</span>
}

function Pill({ children, color, bg, border = 'transparent' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0.25rem 0.625rem', borderRadius: 99,
      background: bg, border: `1px solid ${border}`,
      color, fontSize: '0.75rem', fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

function Field({ label, icon, value, highlight = false }) {
  return (
    <div style={{
      display: 'flex', gap: '0.625rem',
      padding: highlight ? '0.5rem 0.75rem' : '0.125rem 0',
      background: highlight ? '#ffffff' : 'transparent',
      borderRadius: highlight ? 8 : 0,
      border: highlight ? '1px solid #86efac' : 'none',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: highlight ? '#15803d' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#0f172a', lineHeight: 1.5, marginTop: 1, wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

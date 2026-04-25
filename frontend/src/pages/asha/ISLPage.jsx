/**
 * ISLPage.jsx — v2.0
 * ISL Symptom Detection — full-page experience for ASHA workers.
 *
 * New vs v1:
 *   • Demographic profile selector (women / men / child / elderly)
 *   • Rolling-window + voting pipeline (no gate system)
 *   • CRITICAL signs fire immediately; non-critical require 5-frame vote
 *   • CARDIAC_EMERGENCY banner on SEENE-DARD + SANS-TAKLEEF combo
 *   • ICD-10 codes + differential suggestions per sign
 */

import { useState, useCallback } from 'react'
import { useNavigate }  from 'react-router-dom'
import ISLCamera        from '../../components/asha/ISLCamera'
import { CRITICAL_SIGNS } from '../../utils/islInference'

const TEAL       = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.12)'

// ── Sign metadata ─────────────────────────────────────────────────────────────
const SIGNS_META = {
  DARD:           { label: 'Dard / दर्द',              icd10: 'R52',    urgency: 'high',     differentials: ['Acute injury', 'Chronic condition', 'Referred pain', 'Post-surgical pain'] },
  BUKHAR:         { label: 'Bukhar / बुखार',            icd10: 'R50.9',  urgency: 'high',     differentials: ['Dengue', 'Malaria', 'Typhoid', 'COVID-19', 'Sepsis'] },
  'SAR-DARD':     { label: 'Sar Dard / सर दर्द',        icd10: 'R51',    urgency: 'medium',   differentials: ['Migraine', 'Hypertension', 'Meningitis', 'Tension headache'] },
  'PET-DARD':     { label: 'Pet Dard / पेट दर्द',       icd10: 'R10.9',  urgency: 'high',     differentials: ['Appendicitis', 'Gastritis', 'IBS', 'Renal colic', 'Ectopic pregnancy'] },
  ULTI:           { label: 'Ulti / उल्टी',              icd10: 'R11.2',  urgency: 'medium',   differentials: ['GI infection', 'Pregnancy', 'Migraine', 'Meningitis'] },
  'SANS-TAKLEEF': { label: 'Sans Takleef / सांस तकलीफ', icd10: 'R06.00', urgency: 'critical', differentials: ['Asthma attack', 'Pulmonary embolism', 'Anaphylaxis', 'MI', 'COPD'] },
  'SEENE-DARD':   { label: 'Seene Dard / सीने दर्द',    icd10: 'R07.9',  urgency: 'critical', differentials: ['Myocardial infarction', 'Angina', 'Aortic dissection', 'Pulmonary embolism'] },
  CHAKKAR:        { label: 'Chakkar / चक्कर',           icd10: 'R42',    urgency: 'medium',   differentials: ['BPPV', 'Vertigo', 'Hypotension', 'TIA', 'Anaemia'] },
  KAMZORI:        { label: 'Kamzori / कमज़ोरी',         icd10: 'R53.83', urgency: 'medium',   differentials: ['Anaemia', 'Hypothyroidism', 'Diabetes', 'Depression'] },
}

const URGENCY_STYLE = {
  critical: { bg: '#FCEBEB', color: '#A32D2D', label: 'CRITICAL' },
  high:     { bg: '#FAEEDA', color: '#854F0B', label: 'HIGH' },
  medium:   { bg: '#E6F1FB', color: '#185FA5', label: 'MEDIUM' },
}

const DEMOGRAPHICS = [
  { id: 'men',     label: 'Adult Man',    icon: '👨' },
  { id: 'women',   label: 'Adult Woman',  icon: '👩' },
  { id: 'child',   label: 'Child',        icon: '🧒' },
  { id: 'elderly', label: 'Elderly 65+',  icon: '🧓' },
]

export default function ISLPage() {
  const navigate = useNavigate()
  const [detectedSymptoms, setDetectedSymptoms] = useState([])
  const [activeDetail,     setActiveDetail]     = useState(null)
  const [demographic,      setDemographic]      = useState('men')
  const [cardiacAlert,     setCardiacAlert]     = useState(false)

  const handleSymptomDetected = useCallback((signId) => {
    const key  = signId.toUpperCase()
    const meta = SIGNS_META[key]
    if (!meta) return

    setDetectedSymptoms(prev => {
      if (prev.some(s => s.sign === key)) return prev
      return [{ sign: key, meta, id: Date.now() }, ...prev]
    })

    // Auto-open detail for critical signs
    if (meta.urgency === 'critical') {
      setActiveDetail(key)
    }

    // Check for cardiac combo (ISLCamera also fires this, but we track locally too)
    setDetectedSymptoms(prev => {
      const signs = new Set(prev.map(s => s.sign))
      signs.add(key)
      if (signs.has('SEENE-DARD') && signs.has('SANS-TAKLEEF')) {
        setCardiacAlert(true)
      }
      return prev
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Header */}
      <header style={{
        maxWidth: 1280, margin: '0 auto 1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: TEAL, margin: 0 }}>
            ISL SYMPTOM DETECTOR
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.82rem' }}>
            10 signs · Rolling-window pipeline · Demographic-aware thresholds
          </p>
        </div>
        <button
          onClick={() => navigate('/patient')}
          style={{ padding: '0.65rem 1.25rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← Back to Triage
        </button>
      </header>

      {/* CARDIAC_EMERGENCY banner */}
      {cardiacAlert && (
        <div style={{
          maxWidth: 1280, margin: '0 auto 1rem',
          background: '#7f1d1d', color: '#fff',
          padding: '1rem 1.25rem', borderRadius: 14,
          fontWeight: 800, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.3rem' }}>🚨</span>
          <div>
            <div>CARDIAC EMERGENCY — Chest Pain + Breathlessness detected together</div>
            <div style={{ fontWeight: 400, fontSize: '0.75rem', marginTop: 2, opacity: 0.85 }}>
              Possible MI / PE — refer immediately and call emergency services
            </div>
          </div>
        </div>
      )}

      {/* Critical sign banner */}
      {!cardiacAlert && detectedSymptoms.some(s => CRITICAL_SIGNS.has(s.sign)) && (
        <div style={{
          maxWidth: 1280, margin: '0 auto 1rem',
          background: '#FCEBEB', border: '2px solid #A32D2D',
          borderRadius: 12, padding: '0.85rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <div>
            <strong style={{ color: '#A32D2D', fontSize: '0.88rem' }}>CRITICAL SIGN DETECTED — Escalate immediately</strong>
            <div style={{ color: '#A32D2D', fontSize: '0.75rem', marginTop: 2 }}>
              {detectedSymptoms.filter(s => CRITICAL_SIGNS.has(s.sign)).map(s => s.sign).join(' + ')} · Refer patient urgently
            </div>
          </div>
        </div>
      )}

      <main style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: '1.5rem',
      }}>

        {/* Left column: demographic selector + camera */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Demographic selector */}
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Patient Profile — adjusts detection thresholds
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DEMOGRAPHICS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDemographic(d.id)}
                  style={{
                    padding: '7px 16px', borderRadius: 20,
                    border: `1.5px solid ${demographic === d.id ? TEAL : '#e2e8f0'}`,
                    background: demographic === d.id ? TEAL : '#fff',
                    color: demographic === d.id ? '#fff' : '#475569',
                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
            {demographic === 'elderly' && (
              <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#854F0B', background: '#FAEEDA', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                Elderly mode: tremor filter active · SEENE-DARD threshold lowered to 0.55
              </div>
            )}
            {demographic === 'child' && (
              <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#185FA5', background: '#E6F1FB', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                Child mode: partial sign acceptance · lower confidence threshold
              </div>
            )}
          </div>

          {/* Camera */}
          <ISLCamera
            onSymptomDetected={handleSymptomDetected}
            demographic={demographic}
          />

          {/* Sign reference grid */}
          <div>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              SIGN REFERENCE — 10 ISL SYMPTOM SIGNS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '0.65rem' }}>
              {Object.entries(SIGNS_META).map(([key, meta]) => {
                const detected = detectedSymptoms.some(s => s.sign === key)
                const urgCfg   = URGENCY_STYLE[meta.urgency]
                return (
                  <div
                    key={key}
                    onClick={() => setActiveDetail(activeDetail === key ? null : key)}
                    style={{
                      background: '#fff', padding: '0.65rem', borderRadius: 14,
                      border: `1.5px solid ${detected ? TEAL : meta.urgency === 'critical' ? '#A32D2D44' : '#e2e8f0'}`,
                      textAlign: 'center', cursor: 'pointer', position: 'relative',
                      boxShadow: detected ? `0 0 0 3px ${TEAL}18` : 'none',
                    }}
                  >
                    {detected && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        background: TEAL, color: '#fff', borderRadius: '50%',
                        width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.55rem', fontWeight: 900,
                      }}>✓</div>
                    )}
                    <div style={{ fontSize: '0.64rem', fontWeight: 900, color: meta.urgency === 'critical' ? '#A32D2D' : TEAL, marginBottom: 3 }}>
                      {key}
                    </div>
                    <div style={{
                      display: 'inline-block', fontSize: '0.52rem', padding: '1px 6px',
                      borderRadius: 8, background: urgCfg.bg, color: urgCfg.color, fontWeight: 700,
                    }}>
                      {urgCfg.label}
                    </div>
                    <div style={{ fontSize: '0.56rem', color: '#64748b', marginTop: 3 }}>
                      {meta.label.split('/')[1]?.trim() || meta.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Detail panel */}
            {activeDetail && SIGNS_META[activeDetail] && (
              <div style={{
                marginTop: '0.75rem', background: '#fff',
                border: `1.5px solid ${URGENCY_STYLE[SIGNS_META[activeDetail].urgency].bg}`,
                borderRadius: 14, padding: '1rem 1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{activeDetail}</span>
                    <span style={{ marginLeft: 8, color: '#64748b', fontSize: '0.78rem' }}>{SIGNS_META[activeDetail].label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem', padding: '2px 9px', borderRadius: 8, fontWeight: 600,
                      background: URGENCY_STYLE[SIGNS_META[activeDetail].urgency].bg,
                      color: URGENCY_STYLE[SIGNS_META[activeDetail].urgency].color,
                    }}>
                      {URGENCY_STYLE[SIGNS_META[activeDetail].urgency].label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                      ICD-10: {SIGNS_META[activeDetail].icd10}
                    </span>
                    <button onClick={() => setActiveDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem' }}>×</button>
                  </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#374151', fontWeight: 600, marginBottom: 5 }}>Differentials to surface:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SIGNS_META[activeDetail].differentials.map(d => (
                    <span key={d} style={{ fontSize: '0.68rem', padding: '2px 8px', background: '#f1f5f9', borderRadius: 6, color: '#475569' }}>{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right sidebar: session capture */}
        <aside>
          <div style={{
            background: '#fff', padding: '1.25rem', borderRadius: 20,
            border: '1px solid #e2e8f0', position: 'sticky', top: '1rem',
          }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>
              SESSION CAPTURE
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {detectedSymptoms.map(s => {
                const urgCfg = URGENCY_STYLE[s.meta.urgency]
                return (
                  <div key={s.id} style={{
                    padding: '0.85rem 1rem',
                    background: s.meta.urgency === 'critical' ? '#FCEBEB' : TEAL_LIGHT,
                    borderRadius: 12,
                    border: `1px solid ${s.meta.urgency === 'critical' ? '#A32D2D44' : `${TEAL}33`}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: s.meta.urgency === 'critical' ? '#A32D2D' : TEAL, fontSize: '0.85rem' }}>
                            {s.sign}
                          </span>
                          <span style={{
                            fontSize: '0.58rem', padding: '1px 6px', borderRadius: 6,
                            background: urgCfg.bg, color: urgCfg.color, fontWeight: 700,
                          }}>
                            {urgCfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                          {s.meta.label} · {s.meta.icd10}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2 }}>
                          {s.meta.differentials.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/patient', {
                          state: { prefill: { symptomText: s.sign.toLowerCase().replace(/-/g, ' ') } },
                        })}
                        style={{
                          background: s.meta.urgency === 'critical' ? '#A32D2D' : TEAL,
                          color: '#fff', border: 'none',
                          padding: '0.4rem 0.75rem', borderRadius: 7,
                          fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        USE
                      </button>
                    </div>
                  </div>
                )
              })}

              {detectedSymptoms.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Detected symptoms appear here.
                  <br />
                  <span style={{ fontSize: '0.7rem' }}>Hold a sign for ~0.5s to trigger</span>
                </div>
              )}
            </div>

            {detectedSymptoms.length > 0 && (
              <button
                onClick={() => { setDetectedSymptoms([]); setActiveDetail(null); setCardiacAlert(false) }}
                style={{
                  marginTop: '0.75rem', width: '100%', padding: '0.45rem',
                  background: 'transparent', border: '1px solid #e2e8f0',
                  borderRadius: 8, color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer',
                }}
              >
                Clear session
              </button>
            )}

            {/* Urgency legend */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.05em' }}>URGENCY LEGEND</div>
              {Object.entries(URGENCY_STYLE).map(([key, cfg]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                    {key === 'critical' ? 'Fire immediately — no voting' :
                     key === 'high'     ? '5-frame vote · escalate' : '5-frame vote · surface'}
                  </span>
                </div>
              ))}
            </div>

            {/* Pipeline info */}
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#166534', marginBottom: 3 }}>PIPELINE v2.0</div>
              <div style={{ fontSize: '0.62rem', color: '#166534', lineHeight: 1.5 }}>
                10fps · 60-frame window · demographic thresholds · tremor filter (elderly) · cardiac combo detection
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

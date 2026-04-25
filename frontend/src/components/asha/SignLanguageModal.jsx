/**
 * SignLanguageModal.jsx — v2.0
 * ISL symptom scanner modal for ASHA triage form.
 * Uses new ISLCamera (rolling-window + voting + demographic pipeline).
 */

import { useState, useCallback } from 'react'
import ISLCamera from './ISLCamera'

const TEAL = '#0F6E56'

// ── Animated SVG hand diagrams ────────────────────────────────────────────────

function SvgDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="0.8s" repeatCount="indefinite" additive="sum"/>
        <circle cx="60" cy="24" r="6" fill="none" stroke="#ef4444" strokeWidth="2.5"/>
        <line x1="56" y1="20" x2="64" y2="28" stroke="#ef4444" strokeWidth="2"/>
        <line x1="64" y1="20" x2="56" y2="28" stroke="#ef4444" strokeWidth="2"/>
      </g>
    </svg>
  )
}
function SvgBukhar() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="12" y="100" width="22" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
    </svg>
  )
}
function SvgSarDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="52" y="30" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="0.7s" repeatCount="indefinite" additive="sum"/>
        <circle cx="58" cy="20" r="10" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4"/>
      </g>
    </svg>
  )
}
function SvgPetDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="30" width="12" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="28" width="12" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="60" y="32" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="75" y="38" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="translate" values="0,0;0,4;0,0" dur="1s" repeatCount="indefinite"/>
        <ellipse cx="60" cy="115" rx="14" ry="8" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4"/>
      </g>
    </svg>
  )
}
function SvgUlti() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="30" width="12" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="28" width="12" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="60" y="32" width="12" height="54" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="75" y="38" width="10" height="48" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-6;0,0" dur="1s" repeatCount="indefinite"/>
        <polygon points="60,110 54,122 66,122" fill={TEAL}/>
        <line x1="60" y1="108" x2="60" y2="130" stroke={TEAL} strokeWidth="2.5"/>
      </g>
    </svg>
  )
}
function SvgKhansi() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="72" width="60" height="52" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="33" y="54" width="12" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="48" y="50" width="12" height="26" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="63" y="52" width="12" height="24" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="77" y="58" width="10" height="18" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-8;0,0" dur="0.6s" repeatCount="indefinite"/>
        <polygon points="60,22 54,34 66,34" fill={TEAL}/>
        <polygon points="60,46 54,34 66,34" fill={TEAL}/>
        <line x1="60" y1="22" x2="60" y2="46" stroke={TEAL} strokeWidth="2.5"/>
      </g>
    </svg>
  )
}
function SvgSansTakleef() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="80" width="64" height="60" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="28" width="13" height="55" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="46" y="22" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="62" y="26" width="13" height="57" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="78" y="34" width="10" height="50" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="translate" values="0,0;8,0;0,0" dur="1s" repeatCount="indefinite"/>
        <polygon points="108,55 96,49 96,61" fill="#ef4444"/>
        <line x1="110" y1="55" x2="90" y2="55" stroke="#ef4444" strokeWidth="2.5"/>
      </g>
    </svg>
  )
}
function SvgSeeneDard() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="28" y="80" width="64" height="60" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="30" y="28" width="13" height="55" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="46" y="22" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="62" y="26" width="13" height="57" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="78" y="34" width="10" height="50" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="0.6s" repeatCount="indefinite" additive="sum"/>
        <circle cx="60" cy="100" r="10" fill="none" stroke="#ef4444" strokeWidth="2.5"/>
        <line x1="55" y1="95" x2="65" y2="105" stroke="#ef4444" strokeWidth="2"/>
      </g>
    </svg>
  )
}
function SvgChakkar() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="52" y="30" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 58 28;360 58 28" dur="1.5s" repeatCount="indefinite"/>
        <circle cx="58" cy="16" r="8" stroke={TEAL} fill="none" strokeWidth="2.5" strokeDasharray="14 8"/>
      </g>
    </svg>
  )
}
function SvgKamzori() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <rect x="40" y="60" width="50" height="80" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <g><animateTransform attributeName="transform" type="rotate" values="0 65 100;12 65 100;0 65 100" dur="1.8s" repeatCount="indefinite"/>
        <rect x="42" y="100" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
        <rect x="55" y="105" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
        <rect x="68" y="103" width="10" height="40" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
        <rect x="80" y="108" width="8"  height="35" rx="4" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      </g>
      <g><animateTransform attributeName="transform" type="translate" values="0,0;0,6;0,0" dur="1.8s" repeatCount="indefinite"/>
        <polygon points="25,40 19,28 31,28" fill={TEAL}/>
        <line x1="25" y1="42" x2="25" y2="20" stroke={TEAL} strokeWidth="2.5"/>
      </g>
    </svg>
  )
}

const SIGNS_MAP = {
  DARD:         { hindi: 'दर्द',          Diagram: SvgDard,        desc: 'Pain — general' },
  BUKHAR:       { hindi: 'बुखार',         Diagram: SvgBukhar,      desc: 'Fever — open palm' },
  'SAR-DARD':   { hindi: 'सर दर्द',       Diagram: SvgSarDard,     desc: 'Headache' },
  'PET-DARD':   { hindi: 'पेट दर्द',      Diagram: SvgPetDard,     desc: 'Stomach pain' },
  ULTI:         { hindi: 'उल्टी',         Diagram: SvgUlti,        desc: 'Vomiting' },
  KHANSI:       { hindi: 'खांसी',         Diagram: SvgKhansi,      desc: 'Cough — fist bounce' },
  'SANS-TAKLEEF':{ hindi: 'सांस तकलीफ',  Diagram: SvgSansTakleef, desc: 'Breathlessness' },
  'SEENE-DARD': { hindi: 'सीने में दर्द', Diagram: SvgSeeneDard,   desc: 'Chest pain' },
  CHAKKAR:      { hindi: 'चक्कर',         Diagram: SvgChakkar,     desc: 'Dizziness — spinning' },
  KAMZORI:      { hindi: 'कमज़ोरी',       Diagram: SvgKamzori,     desc: 'Weakness' },
}

const DEMOGRAPHICS = [
  { id: 'men',     label: 'Adult Man' },
  { id: 'women',   label: 'Adult Woman' },
  { id: 'child',   label: 'Child' },
  { id: 'elderly', label: 'Elderly (65+)' },
]

/**
 * @param {{ isOpen: boolean, onClose: function, onAddSymptom: function }} props
 */
export default function SignLanguageModal({ isOpen, onClose, onAddSymptom }) {
  const [detectedSymptoms, setDetectedSymptoms] = useState([])
  const [demographic,      setDemographic]      = useState('men')

  const handleSymptomDetected = useCallback((label) => {
    const key = label.toUpperCase()
    setDetectedSymptoms(prev => {
      if (prev.some(s => s.sign === key)) return prev
      return [{ sign: key, id: Date.now() }, ...prev]
    })
    onAddSymptom?.(label)
  }, [onAddSymptom])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 28,
        width: '100%', maxWidth: 560,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f0f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#fafafa', position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: 900, color: TEAL, fontSize: '1rem' }}>🤟 ISL SYMPTOM SCANNER</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2 }}>
              Signs auto-added to triage form · 10fps rolling-window detection
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: '#eee', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 900, color: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        <div style={{ padding: '1.25rem' }}>

          {/* Demographic selector */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Patient Profile
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DEMOGRAPHICS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDemographic(d.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    border: `1.5px solid ${demographic === d.id ? TEAL : '#e2e8f0'}`,
                    background: demographic === d.id ? TEAL : '#fff',
                    color: demographic === d.id ? '#fff' : '#475569',
                    fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                  }}
                >{d.label}</button>
              ))}
            </div>
          </div>

          {/* Camera */}
          <ISLCamera
            onSymptomDetected={handleSymptomDetected}
            demographic={demographic}
          />

          {/* Recently captured */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detected Signs
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 40 }}>
              {detectedSymptoms.map(s => (
                <div key={s.id} style={{
                  background: '#f0fdf4', border: '1.5px solid #22c55e',
                  color: '#15803d', padding: '5px 14px',
                  borderRadius: 12, fontSize: '0.8rem', fontWeight: 800,
                }}>
                  {s.sign}
                </div>
              ))}
              {detectedSymptoms.length === 0 && (
                <div style={{ color: '#bbb', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  Waiting for sign…
                </div>
              )}
            </div>
          </div>

          {/* Sign reference strip */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sign Reference
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              {Object.entries(SIGNS_MAP).map(([key, info]) => {
                const detected = detectedSymptoms.some(s => s.sign === key)
                return (
                  <div key={key} style={{
                    minWidth: 96, flexShrink: 0, background: '#f8fafc',
                    borderRadius: 16, padding: '0.65rem 0.5rem', textAlign: 'center',
                    border: `1px solid ${detected ? TEAL : '#e2e8f0'}`,
                    boxShadow: detected ? `0 0 0 2px ${TEAL}22` : 'none',
                  }}>
                    <div style={{ height: 60, marginBottom: 4 }}>
                      <info.Diagram />
                    </div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 900, color: TEAL }}>{key}</div>
                    <div style={{ fontSize: '0.52rem', color: '#94a3b8', marginTop: 1, lineHeight: 1.3 }}>{info.desc}</div>
                    <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: 1 }}>{info.hindi}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '1.25rem', padding: '1rem',
              background: TEAL, color: '#fff', border: 'none',
              borderRadius: 16, fontWeight: 800, cursor: 'pointer',
              fontSize: '1rem', boxShadow: '0 8px 20px rgba(15,110,86,0.3)',
            }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  )
}

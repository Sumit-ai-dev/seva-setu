import React from 'react'

function getSeverityLabel(record) {
  if (record?.severity === 'red' || Number(record?.severity) >= 7) return 'CRITICAL'
  if (record?.severity === 'yellow' || (Number(record?.severity) >= 4 && Number(record?.severity) <= 6)) return 'MODERATE'
  return 'STABLE'
}

function getSeverityColor(record) {
  if (record?.severity === 'red' || Number(record?.severity) >= 7) return '#ef4444'
  if (record?.severity === 'yellow' || (Number(record?.severity) >= 4 && Number(record?.severity) <= 6)) return '#f59e0b'
  return '#10b981'
}

export default function PatientRecordModal({ record, isOpen, onClose, g }) {
  if (!isOpen || !record) return null

  const symptoms = Array.isArray(record.symptoms) ? record.symptoms : []
  const severityColor = getSeverityColor(record)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 760, background: g.cardBg, borderRadius: 24, border: `1px solid ${g.cardBdr}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)', overflow: 'hidden', backdropFilter: g.blur }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: g.text }}>{record.patient_name || 'Anonymous Patient'}</h2>
            <div style={{ marginTop: 6, fontSize: '0.85rem', color: g.muted }}>
              {[record.age ? `${record.age} yrs` : null, record.gender || null, record.tehsil || record.district || 'General'].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: g.insetBg, color: g.text, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '2rem', display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Severity</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: severityColor }}>{getSeverityLabel(record)}</div>
            </div>
            <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: record.reviewed ? '#10b981' : '#ef4444' }}>{record.reviewed ? 'REVIEWED' : 'PENDING'}</div>
            </div>
            <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Visit Date</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: g.text }}>{record.created_at ? new Date(record.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Health Condition</div>
              <div style={{ fontSize: '0.95rem', color: g.text, lineHeight: 1.5 }}>{record.health_condition || 'N/A'}</div>
            </div>
            <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Sickle Cell Risk</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: record.sickle_cell_risk ? '#8b5cf6' : g.text }}>{record.sickle_cell_risk ? 'Flagged' : 'Not flagged'}</div>
            </div>
          </div>

          <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Clinical Summary</div>
            <div style={{ fontSize: '0.95rem', color: g.text, lineHeight: 1.6 }}>{record.brief || 'No description available.'}</div>
          </div>

          <div style={{ background: g.insetBg, border: `1px solid ${g.divider}`, borderRadius: 16, padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 10 }}>Symptoms</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {symptoms.length > 0 ? symptoms.map((symptom, index) => (
                <span key={`${symptom}-${index}`} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700 }}>
                  {symptom}
                </span>
              )) : <span style={{ fontSize: '0.9rem', color: g.muted }}>No symptoms recorded.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

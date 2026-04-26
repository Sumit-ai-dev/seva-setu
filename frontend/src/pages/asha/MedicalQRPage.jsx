import React, { useState, useMemo, useEffect } from 'react'
import DashboardLayout from '../../components/asha/DashboardLayout.jsx'
import {
  getAllPatients, getPatient, createPatient, addVisit,
  deleteVisit, deletePatient, buildQRUrl, qrImageUrl,
  getPublicBaseUrl, setPublicBaseUrl,
} from '../../lib/medicalQRStore'

const DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar',
  'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
  'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar',
  'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru',
  'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir',
]

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MedicalQRPage() {
  const [patients, setPatients] = useState(() => getAllPatients())
  const [selectedId, setSelectedId] = useState(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [search, setSearch] = useState('')

  const selected = useMemo(
    () => (selectedId ? getPatient(selectedId) : null),
    [selectedId, patients]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.district?.toLowerCase().includes(q)
    )
  }, [patients, search])

  function refresh() {
    setPatients(getAllPatients())
  }

  function handleCreate(form) {
    const p = createPatient(form)
    refresh()
    setSelectedId(p.id)
    setShowNewPatient(false)
  }

  function handleAddVisit(visitForm) {
    if (!selectedId) return
    addVisit(selectedId, visitForm)
    refresh()
  }

  function handleDeleteVisit(visitId) {
    if (!selectedId) return
    if (!window.confirm('Delete this visit?')) return
    deleteVisit(selectedId, visitId)
    refresh()
  }

  function handleDeletePatient() {
    if (!selectedId) return
    if (!window.confirm('Delete this patient and ALL their visits?')) return
    deletePatient(selectedId)
    setSelectedId(null)
    refresh()
  }

  return (
    <DashboardLayout>
      <div style={{ padding: 'clamp(1rem, 3.5vw, 2.25rem)', overflowY: 'auto', flex: 1 }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em',
            color: 'var(--g-accent)', textTransform: 'uppercase', marginBottom: '0.25rem',
          }}>
            QR Medical Record
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', fontWeight: 800, color: 'var(--g-text)' }}>
            Patient Health Card / ರೋಗಿಯ ಆರೋಗ್ಯ ಚೀಟಿ
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--g-muted)', fontSize: '0.875rem', maxWidth: 720 }}>
            Register a patient, log every visit (symptoms + medication), and generate a QR.
            When a doctor scans it, the full visit history opens — no login needed. New visits
            update the record instantly.
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }} className="qr-layout">
          <style>{`
            @media (max-width: 900px) {
              .qr-layout { grid-template-columns: 1fr !important; }
            }
            .qr-card {
              background: var(--g-card-bg);
              border: 1px solid var(--g-card-bdr);
              border-radius: 16px;
              backdrop-filter: var(--g-blur);
              -webkit-backdrop-filter: var(--g-blur);
              box-shadow: var(--g-card-shd);
            }
            .qr-input {
              width: 100%;
              padding: 0.625rem 0.75rem;
              background: var(--g-btn);
              border: 1px solid var(--g-btn-bdr);
              border-radius: 9px;
              color: var(--g-text);
              font-size: 0.875rem;
              outline: none;
              transition: border-color .15s;
              font-family: inherit;
            }
            .qr-input:focus { border-color: var(--g-accent); }
            .qr-label {
              font-size: 0.7rem;
              font-weight: 700;
              color: var(--g-label);
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-bottom: 0.35rem;
              display: block;
            }
            .qr-btn-primary {
              padding: 0.625rem 1.125rem;
              border-radius: 10px;
              background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
              color: #fff;
              border: 1px solid rgba(255,255,255,0.28);
              font-weight: 700;
              font-size: 0.875rem;
              cursor: pointer;
              box-shadow: 0 4px 14px rgba(16,185,129,0.35);
              transition: transform .15s, opacity .15s;
            }
            .qr-btn-primary:hover { transform: translateY(-1px); opacity: 0.92; }
            .qr-btn-secondary {
              padding: 0.5rem 1rem;
              border-radius: 9px;
              background: var(--g-btn);
              color: var(--g-text);
              border: 1px solid var(--g-btn-bdr);
              font-weight: 600;
              font-size: 0.825rem;
              cursor: pointer;
            }
            .qr-btn-danger {
              padding: 0.4rem 0.75rem;
              border-radius: 8px;
              background: transparent;
              color: #ef4444;
              border: 1px solid rgba(239,68,68,0.35);
              font-weight: 600;
              font-size: 0.75rem;
              cursor: pointer;
            }
            .qr-row { transition: background .12s; }
            .qr-row:hover { background: var(--g-row-hover); }
          `}</style>

          {/* ── Left: Patient list ─────────────────────────────────────── */}
          <div className="qr-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--g-divider)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--g-text)' }}>
                  Registered ({patients.length})
                </span>
                <button className="qr-btn-primary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                  onClick={() => setShowNewPatient(true)}>
                  + New
                </button>
              </div>
              <input
                className="qr-input"
                placeholder="Search by name, phone, district…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '0.5rem 0.65rem', fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--g-muted)', fontSize: '0.875rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪪</div>
                  No patients yet. Click <strong style={{ color: 'var(--g-text)' }}>+ New</strong> to register one.
                </div>
              )}
              {filtered.map(p => {
                const last = p.visits?.[0]
                const on = p.id === selectedId
                return (
                  <button
                    key={p.id}
                    className="qr-row"
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--g-divider)',
                      borderLeft: on ? '3px solid var(--g-accent)' : '3px solid transparent',
                      background: on ? 'var(--g-nav-active-bg)' : 'transparent',
                      color: 'var(--g-text)',
                      display: 'block', border: 'none',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--g-muted)', fontWeight: 600 }}>
                        {p.visits?.length || 0} visit{(p.visits?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--g-muted)', marginTop: 2 }}>
                      {[p.age && `${p.age}y`, p.gender, p.district].filter(Boolean).join(' · ') || '—'}
                    </div>
                    {last && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--g-muted)', marginTop: 3, opacity: 0.8 }}>
                        Last: {fmtDate(last.date)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Right: Detail panel ────────────────────────────────────── */}
          <div>
            {showNewPatient && (
              <NewPatientForm
                onCancel={() => setShowNewPatient(false)}
                onSave={handleCreate}
              />
            )}

            {!showNewPatient && !selected && (
              <div className="qr-card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--g-text)', marginBottom: '0.4rem' }}>
                  Select a patient or register a new one
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--g-muted)', maxWidth: 380, margin: '0 auto' }}>
                  Each patient gets a QR card. The QR encodes their full visit history so any doctor can scan it and read the record offline.
                </div>
              </div>
            )}

            {!showNewPatient && selected && (
              <PatientDetail
                patient={selected}
                onAddVisit={handleAddVisit}
                onDeleteVisit={handleDeleteVisit}
                onDeletePatient={handleDeletePatient}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ─── New patient form ────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'Male',   label: 'Male',   sub: 'ಪುರುಷ', icon: '👨' },
  { value: 'Female', label: 'Female', sub: 'ಮಹಿಳೆ',  icon: '👩' },
  { value: 'Other',  label: 'Other',  sub: 'ಇತರ',   icon: '⚧' },
]
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function NewPatientForm({ onCancel, onSave }) {
  const [f, setF] = useState({
    name: '', age: '', gender: '', phone: '', district: '', tehsil: '',
    bloodGroup: '', allergies: '',
  })
  const [err, setErr] = useState('')
  const [touched, setTouched] = useState({})

  const update = (k, v) => {
    setF(prev => ({ ...prev, [k]: v }))
    if (err) setErr('')
  }

  function submit(e) {
    e.preventDefault()
    setTouched({ name: true, age: true, gender: true })
    if (!f.name.trim() || !f.age || !f.gender) {
      setErr('Please fill in Name, Age, and Gender to continue.')
      return
    }
    onSave(f)
  }

  const phoneClean = f.phone.replace(/\D/g, '').slice(0, 10)
  const phoneValid = phoneClean.length === 0 || phoneClean.length === 10

  return (
    <form className="qr-card npf-form" onSubmit={submit}>
      <style>{`
        .npf-form {
          padding: 1.5rem;
          background: linear-gradient(180deg, rgba(16,185,129,0.04) 0%, var(--g-card-bg) 80%);
        }
        .npf-header {
          display: flex; align-items: center; gap: 0.75rem;
          padding-bottom: 1rem; margin-bottom: 1.25rem;
          border-bottom: 2px dashed var(--g-divider);
        }
        .npf-header-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #0d9488 0%, #10b981 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        .npf-title { font-weight: 800; font-size: 1.15rem; color: var(--g-text); line-height: 1.2; }
        .npf-subtitle { font-size: 0.78rem; color: var(--g-muted); margin-top: 2px; }
        .npf-section {
          background: var(--g-btn);
          border: 1px solid var(--g-btn-bdr);
          border-radius: 14px;
          padding: 1.1rem 1.15rem;
          margin-bottom: 1rem;
        }
        .npf-section-step {
          display: flex; align-items: center; gap: 0.6rem;
          margin-bottom: 0.9rem;
        }
        .npf-step-num {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--g-accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.78rem;
          box-shadow: 0 2px 6px rgba(16,185,129,0.35);
        }
        .npf-section-title {
          font-weight: 800; font-size: 0.92rem; color: var(--g-text);
        }
        .npf-section-hint {
          font-size: 0.72rem; color: var(--g-muted); margin-left: auto;
        }
        .npf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.85rem;
        }
        .npf-field { display: flex; flex-direction: column; }
        .npf-field-label {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.78rem; font-weight: 700; color: var(--g-text);
          margin-bottom: 0.35rem;
        }
        .npf-field-label-sub {
          font-size: 0.7rem; color: var(--g-muted); font-weight: 500;
        }
        .npf-required { color: #ef4444; margin-left: 3px; }
        .npf-input {
          width: 100%;
          padding: 0.7rem 0.85rem;
          background: var(--g-card-bg);
          border: 1.5px solid var(--g-btn-bdr);
          border-radius: 10px;
          color: var(--g-text);
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          transition: border-color .15s, box-shadow .15s;
        }
        .npf-input:focus {
          border-color: var(--g-accent);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
        }
        .npf-input.invalid {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
        }
        .npf-help {
          font-size: 0.7rem; color: var(--g-muted); margin-top: 0.3rem;
        }
        .npf-help.error { color: #ef4444; font-weight: 600; }
        .npf-pills {
          display: flex; gap: 0.45rem; flex-wrap: wrap;
        }
        .npf-pill {
          flex: 1 1 90px;
          min-height: 56px;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          background: var(--g-card-bg);
          border: 1.5px solid var(--g-btn-bdr);
          color: var(--g-text);
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.88rem;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px;
          transition: all .15s;
        }
        .npf-pill:hover { border-color: var(--g-accent); transform: translateY(-1px); }
        .npf-pill.active {
          background: linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(16,185,129,0.12) 100%);
          border-color: var(--g-accent);
          color: var(--g-accent);
          box-shadow: 0 2px 8px rgba(16,185,129,0.18);
        }
        .npf-pill-sub { font-size: 0.7rem; font-weight: 500; opacity: 0.75; }
        .npf-blood-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.4rem;
        }
        .npf-blood-pill {
          padding: 0.55rem 0.4rem;
          border-radius: 9px;
          background: var(--g-card-bg);
          border: 1.5px solid var(--g-btn-bdr);
          color: var(--g-text);
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all .15s;
        }
        .npf-blood-pill:hover { border-color: #ef4444; }
        .npf-blood-pill.active {
          background: rgba(239,68,68,0.1);
          border-color: #ef4444;
          color: #ef4444;
        }
        .npf-blood-unknown {
          grid-column: 1 / -1;
          margin-top: 0.25rem;
          padding: 0.5rem;
          font-size: 0.78rem;
          background: transparent;
          border: 1.5px dashed var(--g-btn-bdr);
          border-radius: 9px;
          color: var(--g-muted);
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .npf-blood-unknown.active { border-style: solid; border-color: var(--g-accent); color: var(--g-accent); background: rgba(16,185,129,0.08); }
        .npf-tip {
          display: flex; gap: 0.5rem; align-items: flex-start;
          padding: 0.6rem 0.8rem; margin-top: 0.85rem;
          background: rgba(245,158,11,0.08);
          border: 1px dashed rgba(245,158,11,0.4);
          border-radius: 9px;
          font-size: 0.76rem; color: var(--g-text); line-height: 1.45;
        }
        .npf-actions {
          margin-top: 1.25rem;
          display: flex; gap: 0.625rem; justify-content: flex-end;
          flex-wrap: wrap;
        }
        .npf-error-banner {
          display: flex; gap: 0.55rem; align-items: center;
          margin-bottom: 1rem;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          font-size: 0.85rem; font-weight: 600;
        }
        .npf-save-btn {
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
          min-width: 180px;
        }
        @media (max-width: 600px) {
          .npf-blood-grid { grid-template-columns: repeat(4, 1fr); }
          .npf-save-btn { width: 100%; }
        }
      `}</style>

      <div className="npf-header">
        <div className="npf-header-icon">🪪</div>
        <div>
          <div className="npf-title">Register New Patient</div>
          <div className="npf-subtitle">ಹೊಸ ರೋಗಿಯನ್ನು ನೋಂದಾಯಿಸಿ · Fill in what you know — only 3 fields are required.</div>
        </div>
      </div>

      {err && (
        <div className="npf-error-banner">
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <span>{err}</span>
        </div>
      )}

      {/* ── Step 1: Who is the patient? ── */}
      <div className="npf-section">
        <div className="npf-section-step">
          <div className="npf-step-num">1</div>
          <div className="npf-section-title">👤 Basic Information</div>
          <div className="npf-section-hint">ಮೂಲ ಮಾಹಿತಿ</div>
        </div>

        <div className="npf-grid">
          <div className="npf-field" style={{ gridColumn: '1 / -1' }}>
            <label className="npf-field-label">
              <span>Full Name<span className="npf-required">*</span></span>
              <span className="npf-field-label-sub">ಪೂರ್ಣ ಹೆಸರು</span>
            </label>
            <input
              className={`npf-input ${touched.name && !f.name.trim() ? 'invalid' : ''}`}
              value={f.name}
              onChange={e => update('name', e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="e.g. Lakshmi Devi"
              autoFocus
            />
          </div>

          <div className="npf-field">
            <label className="npf-field-label">
              <span>Age<span className="npf-required">*</span></span>
              <span className="npf-field-label-sub">ವಯಸ್ಸು (years)</span>
            </label>
            <input
              className={`npf-input ${touched.age && !f.age ? 'invalid' : ''}`}
              type="number" min={0} max={120}
              value={f.age}
              onChange={e => update('age', e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, age: true }))}
              placeholder="e.g. 34"
              inputMode="numeric"
            />
          </div>

          <div className="npf-field" style={{ gridColumn: 'span 2' }}>
            <label className="npf-field-label">
              <span>Gender<span className="npf-required">*</span></span>
              <span className="npf-field-label-sub">ಲಿಂಗ — tap to select</span>
            </label>
            <div className="npf-pills">
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`npf-pill ${f.gender === opt.value ? 'active' : ''}`}
                  onClick={() => update('gender', opt.value)}
                >
                  <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span className="npf-pill-sub">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 2: Where & how to reach them ── */}
      <div className="npf-section">
        <div className="npf-section-step">
          <div className="npf-step-num">2</div>
          <div className="npf-section-title">📍 Contact & Location</div>
          <div className="npf-section-hint">Optional — skip if unknown</div>
        </div>

        <div className="npf-grid">
          <div className="npf-field">
            <label className="npf-field-label">
              <span>📞 Phone Number</span>
              <span className="npf-field-label-sub">ಫೋನ್</span>
            </label>
            <input
              className={`npf-input ${!phoneValid ? 'invalid' : ''}`}
              value={f.phone}
              onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              inputMode="numeric"
            />
            {!phoneValid && (
              <div className="npf-help error">Phone must be 10 digits.</div>
            )}
          </div>

          <div className="npf-field">
            <label className="npf-field-label">
              <span>🏘 District</span>
              <span className="npf-field-label-sub">ಜಿಲ್ಲೆ</span>
            </label>
            <select
              className="npf-input"
              value={f.district}
              onChange={e => update('district', e.target.value)}
            >
              <option value="">Select district…</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="npf-field">
            <label className="npf-field-label">
              <span>🏡 Tehsil / Village</span>
              <span className="npf-field-label-sub">ತಾಲೂಕು</span>
            </label>
            <input
              className="npf-input"
              value={f.tehsil}
              onChange={e => update('tehsil', e.target.value)}
              placeholder="e.g. Hospet"
            />
          </div>
        </div>
      </div>

      {/* ── Step 3: Medical info ── */}
      <div className="npf-section">
        <div className="npf-section-step">
          <div className="npf-step-num">3</div>
          <div className="npf-section-title">🩺 Medical Details</div>
          <div className="npf-section-hint">Optional but helpful</div>
        </div>

        <div className="npf-field" style={{ marginBottom: '1rem' }}>
          <label className="npf-field-label">
            <span>🩸 Blood Group</span>
            <span className="npf-field-label-sub">ರಕ್ತ ಗುಂಪು — tap one</span>
          </label>
          <div className="npf-blood-grid">
            {BLOOD_GROUPS.map(b => (
              <button
                key={b}
                type="button"
                className={`npf-blood-pill ${f.bloodGroup === b ? 'active' : ''}`}
                onClick={() => update('bloodGroup', b)}
              >
                {b}
              </button>
            ))}
            <button
              type="button"
              className={`npf-blood-unknown ${f.bloodGroup === '' ? 'active' : ''}`}
              onClick={() => update('bloodGroup', '')}
            >
              Don't know / ಗೊತ್ತಿಲ್ಲ
            </button>
          </div>
        </div>

        <div className="npf-field">
          <label className="npf-field-label">
            <span>⚠ Known Allergies</span>
            <span className="npf-field-label-sub">ಅಲರ್ಜಿ</span>
          </label>
          <input
            className="npf-input"
            value={f.allergies}
            onChange={e => update('allergies', e.target.value)}
            placeholder="e.g. Penicillin, Sulfa drugs — or write 'None'"
          />
          <div className="npf-help">Important for doctors. If patient has none, type "None".</div>
        </div>

        <div className="npf-tip">
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span><strong>Tip:</strong> You can save now and update medical details later. Each visit you log will automatically refresh the QR card.</span>
        </div>
      </div>

      <div className="npf-actions">
        <button type="button" className="qr-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="qr-btn-primary npf-save-btn">
          ✓ Save &amp; Continue
        </button>
      </div>
    </form>
  )
}

// ─── Patient detail (visits + QR) ────────────────────────────────────────────
function PatientDetail({ patient, onAddVisit, onDeleteVisit, onDeletePatient }) {
  const [v, setV] = useState({ symptoms: '', medications: '', diagnosis: '', notes: '' })
  const [showQR, setShowQR] = useState(true)
  const [publicUrl, setPublicUrlState] = useState(() => getPublicBaseUrl())
  const [editingUrl, setEditingUrl] = useState(false)
  const [draftUrl, setDraftUrl] = useState(publicUrl)

  const qrUrl = useMemo(() => buildQRUrl(patient), [patient, publicUrl])
  const qrImg = useMemo(() => qrImageUrl(qrUrl, 320), [qrUrl])

  function savePublicUrl() {
    const cleaned = draftUrl.trim().replace(/\/+$/, '')
    setPublicBaseUrl(cleaned)
    setPublicUrlState(getPublicBaseUrl())
    setEditingUrl(false)
  }
  function clearPublicUrl() {
    setPublicBaseUrl('')
    const fresh = getPublicBaseUrl()
    setPublicUrlState(fresh)
    setDraftUrl(fresh)
    setEditingUrl(false)
  }
  const isLocalhost = /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/.test(publicUrl)

  function submit(e) {
    e.preventDefault()
    if (!v.symptoms.trim() && !v.medications.trim()) return
    onAddVisit(v)
    setV({ symptoms: '', medications: '', diagnosis: '', notes: '' })
  }

  function copyLink() {
    navigator.clipboard?.writeText(qrUrl)
      .then(() => alert('Patient record link copied to clipboard.'))
      .catch(() => {})
  }

  function downloadQR() {
    const a = document.createElement('a')
    a.href = qrImg
    a.download = `${patient.name.replace(/\s+/g, '_')}_QR.png`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Header card ─────────────────────────────────────────────── */}
      <div className="qr-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--g-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Patient ID: {patient.id}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--g-text)', marginTop: 2 }}>
              {patient.name}
            </div>
            <div style={{ color: 'var(--g-muted)', fontSize: '0.875rem', marginTop: 4 }}>
              {[patient.age && `${patient.age} yrs`, patient.gender, patient.district, patient.tehsil].filter(Boolean).join(' · ')}
            </div>
            {(patient.phone || patient.bloodGroup || patient.allergies) && (
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginTop: '0.625rem' }}>
                {patient.phone && <Pill icon="📞" label={patient.phone} />}
                {patient.bloodGroup && <Pill icon="🩸" label={patient.bloodGroup} color="#ef4444" />}
                {patient.allergies && <Pill icon="⚠" label={`Allergy: ${patient.allergies}`} color="#f59e0b" />}
              </div>
            )}
          </div>
          <button className="qr-btn-danger" onClick={onDeletePatient}>Delete patient</button>
        </div>
      </div>

      {/* ── QR card ─────────────────────────────────────────────────── */}
      <div className="qr-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--g-text)' }}>
            🔳 Health Record QR
          </div>
          <button className="qr-btn-secondary" onClick={() => setShowQR(s => !s)}>
            {showQR ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Public URL editor — lets ASHA point QR at ngrok URL when working locally */}
        <div style={{
          marginBottom: '0.875rem', padding: '0.7rem 0.85rem', borderRadius: 10,
          background: isLocalhost ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.06)',
          border: `1px dashed ${isLocalhost ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.4)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--g-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{isLocalhost ? '⚠️' : '🌐'}</span>
              <span>Public URL for QR</span>
              {isLocalhost && (
                <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 600 }}>
                  — phone can't open localhost. Paste your ngrok URL below.
                </span>
              )}
            </div>
            {!editingUrl ? (
              <button type="button" className="qr-btn-secondary"
                style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                onClick={() => { setDraftUrl(publicUrl); setEditingUrl(true) }}>
                ✏ Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="qr-btn-secondary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                  onClick={() => setEditingUrl(false)}>Cancel</button>
                <button type="button" className="qr-btn-secondary"
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                  onClick={clearPublicUrl}>Reset</button>
                <button type="button" className="qr-btn-primary"
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}
                  onClick={savePublicUrl}>Save</button>
              </div>
            )}
          </div>

          {editingUrl ? (
            <input
              className="qr-input"
              style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}
              value={draftUrl}
              onChange={e => setDraftUrl(e.target.value)}
              placeholder="https://endorphin-darkening-manor.ngrok-free.dev"
              autoFocus
            />
          ) : (
            <div style={{
              marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--g-muted)',
              wordBreak: 'break-all', fontFamily: 'ui-monospace, Menlo, monospace',
            }}>
              {publicUrl}
            </div>
          )}
        </div>

        {showQR && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '1.25rem', alignItems: 'center' }} className="qr-display">
            <style>{`
              @media (max-width: 600px) {
                .qr-display { grid-template-columns: 1fr !important; justify-items: center; }
              }
            `}</style>
            <div style={{
              background: '#fff',
              padding: '0.75rem',
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src={qrImg}
                alt="Patient record QR"
                style={{ width: '100%', maxWidth: 260, height: 'auto', display: 'block' }}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 0.625rem', color: 'var(--g-text)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                A doctor can scan this QR to view <strong>{patient.name}'s</strong> full medical history.
                The QR carries all visits, medications and allergies — no internet required to read.
              </p>
              <div style={{ fontSize: '0.7rem', color: 'var(--g-muted)', marginBottom: '0.875rem', wordBreak: 'break-all', padding: '0.5rem 0.625rem', background: 'var(--g-btn)', borderRadius: 8, border: '1px solid var(--g-btn-bdr)', maxHeight: 60, overflow: 'auto' }}>
                {qrUrl}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="qr-btn-secondary" onClick={copyLink}>📋 Copy link</button>
                <button className="qr-btn-secondary" onClick={downloadQR}>⬇ Download QR</button>
                <a className="qr-btn-secondary"
                   href={`/patient-record/${patient.id}#d=${qrUrl.split('#d=')[1] || ''}`}
                   target="_blank" rel="noreferrer"
                   style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  👁 Preview as doctor
                </a>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--g-muted)', marginTop: '0.625rem' }}>
                💡 Add a new visit below — the QR refreshes automatically.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add visit form ──────────────────────────────────────────── */}
      <form className="qr-card" onSubmit={submit} style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--g-text)', marginBottom: '0.875rem' }}>
          ➕ Log a new visit
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }} className="qr-visit-grid">
          <style>{`@media (max-width: 600px) { .qr-visit-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="qr-label">Symptoms *</label>
            <textarea className="qr-input" rows={2}
              placeholder="e.g. High fever for 3 days, cough, body ache"
              value={v.symptoms}
              onChange={e => setV({ ...v, symptoms: e.target.value })}
              style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label className="qr-label">Diagnosis</label>
            <input className="qr-input"
              placeholder="e.g. Suspected viral fever"
              value={v.diagnosis}
              onChange={e => setV({ ...v, diagnosis: e.target.value })} />
          </div>
          <div>
            <label className="qr-label">Medications Prescribed *</label>
            <input className="qr-input"
              placeholder="e.g. Paracetamol 500mg × 5 days"
              value={v.medications}
              onChange={e => setV({ ...v, medications: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="qr-label">Notes (optional)</label>
            <input className="qr-input"
              placeholder="e.g. Refer to PHC if fever persists beyond 48 hrs"
              value={v.notes}
              onChange={e => setV({ ...v, notes: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="qr-btn-primary">Save Visit & Update QR</button>
        </div>
      </form>

      {/* ── Visit history ───────────────────────────────────────────── */}
      <div className="qr-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--g-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--g-text)' }}>
            📜 Past Visits ({patient.visits?.length || 0})
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--g-muted)' }}>Newest first</span>
        </div>

        {(!patient.visits || patient.visits.length === 0) && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--g-muted)', fontSize: '0.875rem' }}>
            No visits logged yet. Add the first one above.
          </div>
        )}

        {(patient.visits || []).map((visit, idx) => (
          <div key={visit.id} style={{
            padding: '1rem',
            borderBottom: idx < patient.visits.length - 1 ? '1px solid var(--g-divider)' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--g-nav-active-bg)', color: 'var(--g-accent)',
                  fontWeight: 800, fontSize: '0.75rem',
                }}>
                  {patient.visits.length - idx}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--g-muted)' }}>
                  {fmtDate(visit.date)}
                </span>
              </div>
              <button className="qr-btn-danger" onClick={() => onDeleteVisit(visit.id)}>
                Delete
              </button>
            </div>
            <div style={{ marginTop: '0.625rem', display: 'grid', gap: '0.5rem' }}>
              {visit.symptoms && (
                <FieldRow label="Symptoms" value={visit.symptoms} icon="🩺" />
              )}
              {visit.diagnosis && (
                <FieldRow label="Diagnosis" value={visit.diagnosis} icon="🧬" />
              )}
              {visit.medications && (
                <FieldRow label="Medications" value={visit.medications} icon="💊" highlight />
              )}
              {visit.notes && (
                <FieldRow label="Notes" value={visit.notes} icon="📝" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pill({ icon, label, color = 'var(--g-accent)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0.2rem 0.625rem', borderRadius: 99,
      background: 'var(--g-btn)', border: '1px solid var(--g-btn-bdr)',
      fontSize: '0.75rem', fontWeight: 600, color,
    }}>
      <span>{icon}</span> <span style={{ color: 'var(--g-text)' }}>{label}</span>
    </span>
  )
}

function FieldRow({ label, value, icon, highlight = false }) {
  return (
    <div style={{
      display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
      padding: highlight ? '0.5rem 0.75rem' : '0.25rem 0',
      background: highlight ? 'rgba(16,185,129,0.07)' : 'transparent',
      borderRadius: highlight ? 8 : 0,
      border: highlight ? '1px solid rgba(16,185,129,0.18)' : 'none',
    }}>
      <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--g-label)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--g-text)', lineHeight: 1.45, marginTop: 1 }}>
          {value}
        </div>
      </div>
    </div>
  )
}

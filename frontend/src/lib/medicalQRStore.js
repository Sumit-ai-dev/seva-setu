// ─────────────────────────────────────────────────────────────────────────────
// medicalQRStore.js — local persistence for the QR medical-record demo
//
// Each patient has a stable short id (e.g. "p_x9k2a"). Records live in
// localStorage so the ASHA worker's device keeps a list across sessions.
// The QR code itself encodes a public URL whose hash carries a base64-encoded
// snapshot of the patient (so the doctor's scanning device does NOT need
// access to the ASHA worker's localStorage to view the record).
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'swasth_medical_qr_patients_v1'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function write(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// ── Cross-device sync: push patient data to the Vite dev server ──
// The doctor's phone polls /patient-sync/:id to get live updates
function syncToServer(patient) {
  if (!patient?.id) return
  try {
    fetch(`/patient-sync/${patient.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    }).catch(() => {}) // silently fail — localStorage is the source of truth
  } catch { /* ignore */ }
}

// Sync ALL patients (called on bulk operations)
function syncAllToServer() {
  try {
    const all = read()
    all.forEach(p => syncToServer(p))
  } catch { /* ignore */ }
}

function shortId() {
  return 'p_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3)
}

export function getAllPatients() {
  return read().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getPatient(id) {
  return read().find(p => p.id === id) || null
}

export function createPatient({ name, age, gender, phone, district, tehsil, bloodGroup, allergies }) {
  const list = read()
  const now = Date.now()
  const patient = {
    id: shortId(),
    name: (name || '').trim(),
    age: age ? parseInt(age, 10) : null,
    gender: gender || '',
    phone: (phone || '').trim(),
    district: district || '',
    tehsil: (tehsil || '').trim(),
    bloodGroup: (bloodGroup || '').trim(),
    allergies: (allergies || '').trim(),
    visits: [],
    createdAt: now,
    updatedAt: now,
  }
  list.push(patient)
  write(list)
  syncToServer(patient)
  return patient
}

export function addVisit(patientId, { symptoms, medications, diagnosis, notes }) {
  const list = read()
  const idx = list.findIndex(p => p.id === patientId)
  if (idx === -1) return null
  const visit = {
    id: 'v_' + Math.random().toString(36).slice(2, 8),
    date: Date.now(),
    symptoms: (symptoms || '').trim(),
    medications: (medications || '').trim(),
    diagnosis: (diagnosis || '').trim(),
    notes: (notes || '').trim(),
  }
  list[idx].visits = [visit, ...(list[idx].visits || [])]
  list[idx].updatedAt = Date.now()
  write(list)
  syncToServer(list[idx])
  return visit
}

export function updatePatient(patientId, partial) {
  const list = read()
  const idx = list.findIndex(p => p.id === patientId)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...partial, updatedAt: Date.now() }
  write(list)
  syncToServer(list[idx])
  return list[idx]
}

export function deleteVisit(patientId, visitId) {
  const list = read()
  const idx = list.findIndex(p => p.id === patientId)
  if (idx === -1) return
  list[idx].visits = (list[idx].visits || []).filter(v => v.id !== visitId)
  list[idx].updatedAt = Date.now()
  write(list)
  syncToServer(list[idx])
}

export function deletePatient(patientId) {
  const list = read().filter(p => p.id !== patientId)
  write(list)
}

// ── Encoding helpers for QR payload ──────────────────────────────────────────
// We base64-encode a compact JSON snapshot and put it in the URL hash so the
// doctor's device does not need network/auth/backend to render the record.

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

export function base64ToUtf8(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)))
  } catch {
    return null
  }
}

export function encodePatientToHash(patient) {
  const compact = {
    i: patient.id,
    n: patient.name,
    a: patient.age,
    g: patient.gender,
    p: patient.phone,
    d: patient.district,
    t: patient.tehsil,
    b: patient.bloodGroup,
    al: patient.allergies,
    u: patient.updatedAt,
    v: (patient.visits || []).map(v => ({
      i: v.id, d: v.date, s: v.symptoms, m: v.medications,
      x: v.diagnosis, n: v.notes,
    })),
  }
  return utf8ToBase64(JSON.stringify(compact))
}

export function decodePatientFromHash(b64) {
  const raw = base64ToUtf8(b64)
  if (!raw) return null
  try {
    const c = JSON.parse(raw)
    return {
      id: c.i,
      name: c.n,
      age: c.a,
      gender: c.g,
      phone: c.p,
      district: c.d,
      tehsil: c.t,
      bloodGroup: c.b,
      allergies: c.al,
      updatedAt: c.u,
      visits: (c.v || []).map(v => ({
        id: v.i, date: v.d, symptoms: v.s, medications: v.m,
        diagnosis: v.x, notes: v.n,
      })),
    }
  } catch {
    return null
  }
}

// User-overridable public base URL (e.g. an ngrok https URL) so the QR can be
// scanned from another device even when the ASHA worker is on http://localhost.
const PUBLIC_URL_KEY = 'swasth_public_base_url'

export function getPublicBaseUrl() {
  try {
    const v = localStorage.getItem(PUBLIC_URL_KEY)
    if (v) return v.replace(/\/+$/, '')
  } catch { /* ignore */ }
  if (import.meta.env.VITE_BASE_URL) return import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')
  return window.location.origin
}

export function setPublicBaseUrl(url) {
  try {
    if (url && url.trim()) localStorage.setItem(PUBLIC_URL_KEY, url.trim().replace(/\/+$/, ''))
    else localStorage.removeItem(PUBLIC_URL_KEY)
  } catch { /* ignore */ }
}

export function buildQRUrl(patient) {
  const hash = encodePatientToHash(patient)
  return `${getPublicBaseUrl()}/patient-record/${patient.id}#d=${hash}`
}

export function qrImageUrl(text, size = 320) {
  // Free public QR generation service — no API key, no install.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(text)}`
}

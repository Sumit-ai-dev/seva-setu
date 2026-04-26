/**
 * triageStore.js — Shared localStorage bridge for triage records
 * 
 * Enables real-time flow: ASHA Worker adds patient → THO Dashboard sees it instantly.
 * Works in both guest mode (localStorage) and authenticated mode (API + localStorage cache).
 */

const STORE_KEY = 'seva_setu_live_triage'

/**
 * Save a new triage record to the shared store.
 * Called after ASHA worker completes a triage analysis.
 */
export function pushTriageRecord(record) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
    const newRecord = {
      id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patient_name: record.patient_name || record.name,
      age: record.age,
      gender: record.gender,
      tehsil: record.tehsil || '',
      district: record.district,
      severity: record.severity,
      symptoms: record.symptoms || [],
      sickle_cell_risk: record.sickle_cell_risk || false,
      brief: record.brief || '',
      health_condition: record.brief || (record.symptoms || []).join(', '),
      latitude: record.latitude || null,
      longitude: record.longitude || null,
      reviewed: false,
      created_at: new Date().toISOString(),
      source: 'live', // marks this as a live ASHA submission
    }
    existing.unshift(newRecord)
    localStorage.setItem(STORE_KEY, JSON.stringify(existing))

    // Dispatch a custom event so other tabs/components can react immediately
    window.dispatchEvent(new CustomEvent('seva-setu-triage-update', { detail: newRecord }))

    return newRecord
  } catch (err) {
    console.error('[TriageStore] Failed to save record:', err)
    return null
  }
}

/**
 * Get all live triage records from the shared store.
 * THO dashboard merges these with demo/API data.
 */
export function getLiveTriageRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Clear all live records (useful for reset/logout).
 */
export function clearLiveTriageRecords() {
  localStorage.removeItem(STORE_KEY)
}

/**
 * Outbreak Store — localStorage bridge for instant cross-device sync.
 * When an ASHA worker flags an outbreak, the THO dashboard picks it up
 * immediately via localStorage (before the backend API roundtrip completes).
 */

const STORAGE_KEY = 'seva_setu_outbreaks'

/**
 * Push a new outbreak flag to localStorage.
 * @param {{ disease: string, district: string, latitude: number|null, longitude: number|null, state?: string }} outbreak
 */
export function pushOutbreak(outbreak) {
  try {
    const existing = getOutbreaks()
    const entry = {
      ...outbreak,
      id: `local-${Date.now()}`,
      cases: 1,
      deaths: 0,
      year: new Date().getFullYear(),
      week: getISOWeek(new Date()),
      state: outbreak.state || 'Karnataka',
      created_at: new Date().toISOString(),
    }
    existing.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    // Dispatch a storage event so other tabs/components can listen
    window.dispatchEvent(new Event('seva_setu_outbreak_update'))
  } catch (e) {
    console.error('Failed to push outbreak to localStorage:', e)
  }
}

/**
 * Get all outbreak flags from localStorage.
 * @returns {Array}
 */
export function getOutbreaks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Clear all outbreak flags from localStorage.
 */
export function clearOutbreaks() {
  localStorage.removeItem(STORAGE_KEY)
}

/** Get ISO week number */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

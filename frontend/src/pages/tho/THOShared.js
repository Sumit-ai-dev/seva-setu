export { apiFetch as apiFetch } from '../../lib/api'
export const API = 'http://localhost:8000/api/v1'

export const DISTRICT_CENTERS = {
  'Sangli': [17.0000, 74.5800],
  'Bengaluru': [12.9716, 77.5946],
  'Mumbai': [19.0760, 72.8777],
  'Nagpur': [21.1458, 79.0882],
  'Nashik': [20.0059, 73.7897],
  'Aurangabad': [19.8762, 75.3433],
  'Solapur': [17.6805, 75.9064],
  'Amravati': [20.9320, 77.7523],
  'Kolhapur': [16.7050, 74.2433],
  'Satara': [17.6805, 74.0183],
  'Ahmednagar': [19.0948, 74.7480],
  'Thane': [19.2183, 72.9781],
}

export const DISTRICT_BOUNDS = {
  'Sangli': [[16.60, 73.90], [17.55, 75.40]],
  'Bengaluru': [[12.80, 77.40], [13.15, 77.80]],
  'Mumbai': [[18.85, 72.70], [19.35, 73.10]],
  'Nagpur': [[20.60, 78.40], [21.70, 79.80]],
  'Nashik': [[19.40, 73.20], [20.60, 74.60]],
  'Aurangabad': [[19.40, 74.80], [20.40, 75.90]],
  'Solapur': [[17.10, 75.40], [18.20, 76.50]],
  'Kolhapur': [[16.20, 73.80], [17.20, 74.70]],
  'Thane': [[18.90, 72.70], [19.60, 73.50]],
}

export function buildMapPoints(records, center) {
  if (!records.length) return []
  const withGps = records.filter(r => r.latitude && r.longitude)
  const withoutGps = records.filter(r => !r.latitude || !r.longitude)

  const gpsPoints = withGps.map(r => ({
    village: r.village || r.patient_name || 'Patient',
    total: 1,
    critical: r.severity === 'red' || Number(r.severity) >= 7 ? 1 : 0,
    moderate: r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6) ? 1 : 0,
    mild: (r.severity === 'green' || Number(r.severity) < 4) ? 1 : 0,
    lastReported: new Date(r.created_at).toLocaleString('en-IN'),
    lat: r.latitude,
    lng: r.longitude
  }))

  const groups = {}
  withoutGps.forEach(r => {
    const village = r.patient_name || 'Unknown'
    if (!groups[village]) {
      groups[village] = { village, total: 0, critical: 0, moderate: 0, mild: 0, lastReported: r.created_at }
    }
    const g = groups[village]
    g.total++
    if (r.severity === 'red' || Number(r.severity) >= 7) g.critical++
    else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) g.moderate++
    else g.mild++
    if (r.created_at > g.lastReported) g.lastReported = r.created_at
  })

  const legacyPoints = Object.values(groups).map((g, i) => {
    const angle = (i / (Object.keys(groups).length || 1)) * 2 * Math.PI
    const radius = 0.06 + (i % 4) * 0.08
    return {
      ...g,
      lat: center[0] + Math.sin(angle) * radius,
      lng: center[1] + Math.cos(angle) * radius,
      lastReported: new Date(g.lastReported).toLocaleString('en-IN'),
    }
  })

  return [...gpsPoints, ...legacyPoints]
}

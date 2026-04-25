import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import THOLayout from '../../components/tho/THOSidebar'
import { apiFetch, API, DISTRICT_CENTERS, DISTRICT_BOUNDS, buildMapPoints } from './THOShared'
import { GUEST_TRIAGE_RECORDS } from '../../lib/guestDemoData'

const DistrictHeatmap = lazy(() => import('../../components/common/DistrictHeatmap'))

export default function THOMapPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [triageRecords, setTriageRecords] = useState([])
  const [outbreaks, setOutbreaks] = useState([])
  const [loading, setLoading] = useState(true)

  // Map is always locked to Sangli district for the demo
  const thoDistrict = 'Sangli'
  const center = DISTRICT_CENTERS['Sangli']
  const bounds = DISTRICT_BOUNDS['Sangli']

  const g = useMemo(() => ({
    text: 'var(--g-text)', muted: 'var(--g-muted)', accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)', cardBdr: 'var(--g-card-bdr)', cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)', blur: 'var(--g-blur)'
  }), [isDark])

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setTriageRecords(GUEST_TRIAGE_RECORDS)
        setLoading(false)
        return
      }
      const headers = { 'Authorization': `Bearer ${token}` }
      const [triRes, outRes] = await Promise.allSettled([
        apiFetch(`${API}/triage_records/`, { headers }),
        apiFetch(`${API}/outbreaks/`, { headers }),
      ])
      if (triRes.status === 'fulfilled' && triRes.value.ok) setTriageRecords(await triRes.value.json())
      if (outRes.status === 'fulfilled' && outRes.value.ok) setOutbreaks(await outRes.value.json())
    } catch (err) { console.error('Fetch error:', err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const mapPoints = useMemo(() => buildMapPoints(triageRecords, center), [triageRecords, center])
  const districtOutbreaks = useMemo(() => outbreaks.filter(o => o.district?.toLowerCase() === thoDistrict.toLowerCase()), [outbreaks, thoDistrict])

  return (
    <THOLayout
      onLogout={() => { logout(); navigate('/') }}
      topbarContent={
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: g.text }}>District Map — {thoDistrict}</div>
          <div style={{ fontSize: '0.7rem', color: g.muted, marginTop: 1 }}>
            {loading ? 'Syncing data...' : `${mapPoints.length} clusters · ${districtOutbreaks.length} outbreaks`}
          </div>
        </div>
      }
      contentStyle={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: g.muted }}>Loading Heatmap...</div>}>
          <DistrictHeatmap district={thoDistrict} points={mapPoints} center={center} bounds={bounds} outbreaks={districtOutbreaks} height="100%" />
        </Suspense>

        <div style={{ position: 'absolute', bottom: 24, right: 24, background: g.cardBg, borderRadius: 12, padding: '1rem 1.25rem', boxShadow: g.cardShd, zIndex: 1000, fontSize: '0.75rem', border: `1px solid ${g.cardBdr}`, backdropFilter: g.blur }}>
          <div style={{ fontWeight: 800, color: g.text, marginBottom: 8 }}>Heatmap Legend</div>
          {[
            { color: '#ef4444', label: 'Critical' },
            { color: '#f59e0b', label: 'Moderate' },
            { color: '#22c55e', label: 'Stable' },
            { color: '#8b5cf6', label: 'Outbreak', dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: dashed ? `2px dashed ${color}` : 'none' }} />
              <span style={{ color: g.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </THOLayout>
  )
}

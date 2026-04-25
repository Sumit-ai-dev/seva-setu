import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import THOLayout from '../../components/tho/THOSidebar'
import { apiFetch, API } from './THOShared'
import { GUEST_TRIAGE_RECORDS, GUEST_ASHA_WORKERS } from '../../lib/guestDemoData'

const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const SANGLI_TALUKAS = [
  'Miraj', 'Tasgaon', 'Walwa (Islampur)', 'Shirala', 'Palus', 
  'Kadegaon', 'Khanapur (Vita)', 'Atpadi', 'Kavathe Mahankal', 'Jat'
]

export default function THOAnalyticsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [triageRecords, setTriageRecords] = useState([])
  const [ashaWorkers, setAshaWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTaluka, setSelectedTaluka] = useState(SANGLI_TALUKAS[0])

  const g = useMemo(() => ({
    text: 'var(--g-text)', muted: 'var(--g-muted)', label: 'var(--g-label)', accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)', cardBdr: 'var(--g-card-bdr)', cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)', insetBg: 'var(--g-inset-bg)', blur: 'var(--g-blur)',
  }), [isDark])

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          setAshaWorkers(GUEST_ASHA_WORKERS)
          setTriageRecords(GUEST_TRIAGE_RECORDS)
          setLoading(false)
          return
        }
        const headers = { 'Authorization': `Bearer ${token}` }
        const [usersRes, triageRes] = await Promise.all([
          apiFetch(`${API}/users/asha`, { headers }),
          apiFetch(`${API}/triage_records/`, { headers })
        ])
        if (usersRes.ok) setAshaWorkers(await usersRes.json())
        if (triageRes.ok) setTriageRecords(await triageRes.json())
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Aggregate Data
  const talukaData = useMemo(() => {
    const stats = {}
    SANGLI_TALUKAS.forEach(t => {
      stats[t] = { name: t, critical: 0, moderate: 0, stable: 0, totalSick: 0, ashas: [] }
    })

    triageRecords.forEach(r => {
      const match = SANGLI_TALUKAS.find(t => t.toLowerCase() === (r.tehsil || r.village || '').toLowerCase())
      if (match) {
        const key = match
        stats[key].totalSick++
        if (r.severity === 'red' || Number(r.severity) >= 7) stats[key].critical++
        else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) stats[key].moderate++
        else stats[key].stable++
      }
    })

    ashaWorkers.forEach(a => {
      const match = SANGLI_TALUKAS.find(t => t.toLowerCase() === (a.location || '').toLowerCase())
      if (match) {
        stats[match].ashas.push(a)
      }
    })

    return Object.values(stats).sort((a,b) => b.totalSick - a.totalSick)
  }, [triageRecords, ashaWorkers])

  const activeStats = talukaData.find(t => t.name === selectedTaluka)

  // Weekly Aggregation for the Selected Taluka
  const weeklyData = useMemo(() => {
    if (!selectedTaluka || !triageRecords.length) return []
    
    const filtered = triageRecords.filter(r => 
      (r.tehsil || r.village || '').toLowerCase() === selectedTaluka.toLowerCase()
    )

    const weeks = [
      { id: 0, label: 'Week 1', stats: { stable: 0, moderate: 0, critical: 0 } },
      { id: 1, label: 'Week 2', stats: { stable: 0, moderate: 0, critical: 0 } },
      { id: 2, label: 'Week 3', stats: { stable: 0, moderate: 0, critical: 0 } },
    ]

    const now = new Date()
    filtered.forEach(r => {
      const date = new Date(r.created_at)
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      const weekIdx = Math.floor(diffDays / 7)
      
      if (weekIdx >= 0 && weekIdx < 3) {
        if (r.severity === 'red' || Number(r.severity) >= 7) weeks[weekIdx].stats.critical++
        else if (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) weeks[weekIdx].stats.moderate++
        else weeks[weekIdx].stats.stable++
      }
    })

    return weeks
  }, [triageRecords, selectedTaluka])

  return (
    <THOLayout
      onLogout={() => { logout(); navigate('/') }}
      topbarContent={<h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>Taluka Analytics</h2>}
    >
      <style>{`
        .elevated-panel {
          box-shadow: 0 18px 40px rgba(15,23,42,${isDark ? '0.38' : '0.10'}), 0 2px 10px rgba(59,130,246,${isDark ? '0.14' : '0.08'});
          background-image: linear-gradient(180deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.78)'}, transparent 58%);
        }
        .analyt-main-grid { 
          display: grid; 
          grid-template-columns: 320px 1fr; 
          gap: 2rem; 
          max-width: 1600px; 
          margin: 0 auto; 
          height: calc(100vh - 160px); 
          overflow: hidden;
        }
        .analyt-list { overflow-y: auto; padding-right: 8px; }
        .analyt-item { padding: 1.25rem 1rem; border-bottom: 1px solid ${g.divider}; cursor: pointer; transition: all 0.2s; border-radius: 12px; margin-bottom: 4px; border: 1px solid transparent; }
        .analyt-item:hover { background: ${g.insetBg}; }
        .analyt-item.active { background: ${isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'}; border-color: ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}; }
        
        .bar-wrap { 
          min-height: 400px; 
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          position: relative;
          background: #050505;
        }
        .grid-lines {
          position: absolute;
          top: 0; left: 100px; right: 2rem; bottom: 0;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
        }
        .grid-line {
          width: 1px;
          height: 100%;
          background: rgba(255,255,255,0.05);
        }
        
        .week-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          align-items: center;
          gap: 1.5rem;
          z-index: 1;
        }
        .week-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bar-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .h-bar-container {
          height: 12px;
          width: 100%;
          display: flex;
          align-items: center;
          position: relative;
        }
        .h-bar {
          height: 100%;
          border-radius: 0 4px 4px 0;
          transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 15px currentColor;
        }
        .h-bar-val {
          position: absolute;
          right: -25px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #fff;
          opacity: 0.8;
        }

        @media (max-width: 1000px) {
          .analyt-main-grid { grid-template-columns: 1fr; height: auto; display: flex; flex-direction: column; gap: 1.5rem; }
          .analyt-list { max-height: 400px; }
        }
      `}</style>
      
      <div style={{ padding: '2rem', height: '100%' }}>
        <div className="analyt-main-grid">
          
          {/* LEFT: TALUKA LIST */}
          <div className="elevated-panel" style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}`, background: isDark ? 'linear-gradient(180deg,rgba(59,130,246,0.12),rgba(59,130,246,0.02))' : 'linear-gradient(180deg,rgba(59,130,246,0.08),rgba(59,130,246,0.01))' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TargetIcon /> Sangli District Maps
                </h3>
             </div>
             <div className="analyt-list" style={{ padding: '1rem', flex: 1 }}>
                {loading ? <div style={{ color: g.muted, textAlign: 'center', padding: '2rem' }}>Loading data...</div> : talukaData.map(t => (
                  <div key={t.name} className={`analyt-item ${selectedTaluka === t.name ? 'active' : ''}`} onClick={() => setSelectedTaluka(t.name)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: selectedTaluka === t.name ? '#3b82f6' : g.text, fontSize: '1rem' }}>{t.name}</span>
                      <span style={{ fontWeight: 800, color: t.totalSick > 0 ? '#ef4444' : g.label, fontSize: '0.85rem' }}>{t.totalSick} Cases</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: g.muted, fontWeight: 600 }}>{t.ashas.length} Registered ASHA Workers</div>
                  </div>
                ))}
             </div>
          </div>

          {/* RIGHT: DETAILED GRAPH & ASHA BREAKDOWN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '8px' }}>
            {/* Graph Panel */}
            <div className="elevated-panel" style={{ background: '#0a0a0a', borderRadius: 20, border: `1px solid #262626`, overflow: 'hidden' }}>

              {weeklyData.length > 0 && (
                <div style={{ padding: '0 0 2rem' }}>
                  <div className="bar-wrap">
                    <div className="grid-lines">
                      {[...Array(10)].map((_, i) => <div key={i} className="grid-line" />)}
                    </div>
                    
                    {weeklyData.map(w => {
                      const max = Math.max(...weeklyData.map(wd => Math.max(wd.stats.stable, wd.stats.moderate, wd.stats.critical)), 5)
                      
                      return (
                        <div key={w.label} className="week-row">
                          <div className="week-label">{w.label}</div>
                          <div className="bar-group">
                            {/* Stable - Purple */}
                            <div className="h-bar-container">
                              <div className="h-bar" style={{ width: `${(w.stats.stable / max) * 100}%`, background: '#8b5cf6', color: 'rgba(139, 92, 246, 0.4)' }} />
                              <div className="h-bar-val">{w.stats.stable}</div>
                            </div>
                            {/* Moderate - Yellow */}
                            <div className="h-bar-container">
                              <div className="h-bar" style={{ width: `${(w.stats.moderate / max) * 100}%`, background: '#f59e0b', color: 'rgba(245, 158, 11, 0.4)' }} />
                              <div className="h-bar-val">{w.stats.moderate}</div>
                            </div>
                            {/* Critical - Red */}
                            <div className="h-bar-container">
                              <div className="h-bar" style={{ width: `${(w.stats.critical / max) * 100}%`, background: '#ef4444', color: 'rgba(239, 68, 68, 0.4)' }} />
                              <div className="h-bar-val">{w.stats.critical}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '2rem', padding: '1rem 2rem', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#a3a3a3' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#8b5cf6' }} /> STABLE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#a3a3a3' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} /> MODERATE
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#a3a3a3' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} /> CRITICAL
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-table: Assigned ASHA Workers */}
            <div className="elevated-panel" style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}`, background: g.insetBg }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>ASHA Resource Roster</h3>
                <div style={{ fontSize: '0.8rem', color: g.muted, fontWeight: 600, marginTop: 4 }}>Workers actively stationed in {selectedTaluka}</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {(!activeStats || activeStats.ashas.length === 0) ? (
                      <tr><td style={{ padding: '2rem', textAlign: 'center', color: g.muted }}>No ASHA workers assigned to this taluka yet.</td></tr>
                    ) : (
                      activeStats.ashas.map(a => (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${g.divider}` }}>
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                {a.full_name[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: g.text, fontSize: '0.9rem' }}>{a.full_name}</div>
                                <div style={{ fontSize: '0.7rem', color: g.muted, fontWeight: 700 }}>{a.employee_id}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </THOLayout>
  )
}

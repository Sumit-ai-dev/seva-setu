import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import THOLayout from '../../components/tho/THOSidebar'
import PatientRecordModal from '../../components/shared/PatientRecordModal'
import { apiFetch, API } from './THOShared'
import { GUEST_TRIAGE_RECORDS, GUEST_ASHA_WORKERS } from '../../lib/guestDemoData'

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default function THOAshaWorkersPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [ashaWorkers, setAshaWorkers] = useState([])
  const [triageRecords, setTriageRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAsha, setSelectedAsha] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

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
        
        // Fetch ASHA workers
        const usersRes = await apiFetch(`${API}/users/asha`, { headers })
        const usersData = usersRes.ok ? await usersRes.json() : []
        setAshaWorkers(usersData)

        // Fetch triage records to map to ASHAs
        const triageRes = await apiFetch(`${API}/triage_records/`, { headers })
        const triageData = triageRes.ok ? await triageRes.json() : []
        setTriageRecords(triageData)

      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Map triage records to specific ASHAs 
  // In demo mode we fake the mapping by indexing the array manually or assigning records 
  // In real mode, r.user_id matches asha.id
  const ashaData = useMemo(() => {
    return ashaWorkers.map((asha, index) => {
      // Logic for guest mapping: distribute 20 demo records among the 10 demo ASHAs roughly
      // Because demo records don't have user_id. In real mode we map by ID.
      const isDemoMode = !localStorage.getItem('access_token')
      
      const records = triageRecords.filter(r => {
        if (isDemoMode) {
          // In demo data, we might not have a reliable ID map. Let's assign based on tehsil
          // or roughly randomly to show functionality if tehsil mismatches. 
          // Our demo data ASHAs have specific district/location. We'll map by location.
          // Fallback to modulo if no match.
          const matchesLocation = (r.tehsil || '').toLowerCase().includes((asha.location || '').toLowerCase())
                             || (r.village || '').toLowerCase().includes((asha.location || '').toLowerCase());
          return matchesLocation || (triageRecords.indexOf(r) % ashaWorkers.length === index);
        }
        return r.user_id === asha.id
      }).sort((a,b) => {
        const sevOrder = { red: 0, yellow: 1, green: 2 }
        const aRank = sevOrder[a.severity] ?? 2
        const bRank = sevOrder[b.severity] ?? 2
        if (aRank !== bRank) return aRank - bRank
        return new Date(b.created_at) - new Date(a.created_at)
      })

      return {
        ...asha,
        records,
        criticalCount: records.filter(x => x.severity === 'red' || Number(x.severity) >= 7).length,
        pendingCount: records.filter(x => !x.reviewed).length,
        totalCases: records.length
      }
    }).sort((a, b) => b.criticalCount - a.criticalCount || b.totalCases - a.totalCases)
  }, [ashaWorkers, triageRecords])

  const selectedAshaDetails = useMemo(() => {
    if (!selectedAsha) return null
    return ashaData.find(a => a.id === selectedAsha)
  }, [selectedAsha, ashaData])

  return (
    <>
      <THOLayout
        onLogout={() => { logout(); navigate('/') }}
        topbarContent={<h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>ASHA Network Overview</h2>}
      >
        <style>{`
          .elevated-panel {
            box-shadow: 0 18px 40px rgba(15,23,42,${isDark ? '0.38' : '0.10'}), 0 2px 10px rgba(59,130,246,${isDark ? '0.14' : '0.08'});
            background-image: linear-gradient(180deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.78)'}, transparent 58%);
          }
          .table-row:hover { background: ${g.insetBg}; cursor: pointer; }
          .patient-row td { transition: background 0.2s ease, box-shadow 0.2s ease; }
          .patient-row:hover td { background: ${isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)'}; box-shadow: inset 0 1px 0 #22c55e, inset 0 -1px 0 #22c55e; }
          .patient-row.selected td { background: ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)'}; box-shadow: inset 0 1px 0 #3b82f6, inset 0 -1px 0 #3b82f6; border-color: transparent !important; }
          .patient-row:hover td:first-child, .patient-row.selected td:first-child { box-shadow: inset 1px 0 0 ${'var(--hover-border, #22c55e)'}, inset 0 1px 0 ${'var(--hover-border, #22c55e)'}, inset 0 -1px 0 ${'var(--hover-border, #22c55e)'}; }
          .patient-row:hover td:last-child, .patient-row.selected td:last-child { box-shadow: inset -1px 0 0 ${'var(--hover-border, #22c55e)'}, inset 0 1px 0 ${'var(--hover-border, #22c55e)'}, inset 0 -1px 0 ${'var(--hover-border, #22c55e)'}; }
          .panel-header { background: ${isDark ? 'linear-gradient(180deg,rgba(59,130,246,0.12),rgba(59,130,246,0.02))' : 'linear-gradient(180deg,rgba(59,130,246,0.08),rgba(59,130,246,0.01))'}; }
          .tho-main-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2rem; max-width: 1600px; margin: 0 auto; height: calc(100vh - 120px); }
          .tho-calendar-col { order: 2; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
          .tho-content-col { order: 1; display: flex; flex-direction: column; overflow-y: auto; }
          
          @media (max-width: 1000px) {
            .tho-main-grid { grid-template-columns: 1fr; height: auto; display: flex; flex-direction: column; gap: 1rem; }
            .tho-content-col { order: 1; flex: 0 0 auto; }
            .tho-calendar-col { order: 2; height: 500px; }
          }
        `}</style>
        
        <div style={{ padding: '2rem', height: '100%' }}>
          <div className="tho-main-grid">
            
            <div className="tho-content-col elevated-panel" style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}` }}>
              <div className="panel-header" style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <UsersIcon />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>ASHA Directory</h3>
                  <div style={{ fontSize: '0.75rem', color: g.muted, fontWeight: 600 }}>{ashaData.length} active workers registered</div>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: g.muted }}>Loading network data...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: isDark ? '#1e293b' : '#f1f5f9', position: 'sticky', top: 0, zIndex: 2 }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>Worker Profile</th>
                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>Location</th>
                        <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>Total Visits</th>
                        <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: g.label, textTransform: 'uppercase' }}>Alerts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ashaData.map((a) => (
                        <tr 
                          key={a.id} 
                          className={`table-row patient-row ${selectedAsha === a.id ? 'selected' : ''}`}
                          style={{ '--hover-border': selectedAsha === a.id ? '#3b82f6' : '#22c55e', borderBottom: `1px solid ${g.divider}` }}
                          onClick={() => setSelectedAsha(a.id)}
                        >
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0 }}>
                                {a.full_name[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: g.text, fontSize: '0.95rem' }}>{a.full_name}</div>
                                <div style={{ fontSize: '0.7rem', color: g.muted, fontWeight: 700 }}>{a.employee_id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', color: g.text, fontSize: '0.85rem', fontWeight: 600 }}>
                            {a.location || 'Unknown'} <span style={{ color: g.muted, fontWeight: 400, marginLeft: 4 }}>({a.district})</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#3b82f6' }}>{a.totalCases}</span>
                          </td>
                          <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              {a.criticalCount > 0 && <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.18)', color: '#dc2626', fontWeight: 800 }}>{a.criticalCount} CRIT</span>}
                              {a.pendingCount > 0 && <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.18)', color: '#d97706', fontWeight: 800 }}>{a.pendingCount} REV</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="tho-calendar-col">
              {!selectedAshaDetails ? (
                <div className="elevated-panel" style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: g.muted, padding: '2rem', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.label, marginBottom: '1.5rem' }}>
                    <UsersIcon />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text, marginBottom: '0.5rem' }}>Select an ASHA Worker</h3>
                  <div style={{ fontSize: '0.85rem' }}>Click on a worker from the directory to view their complete patient visit history.</div>
                </div>
              ) : (
                <div className="elevated-panel" style={{ background: g.cardBg, borderRadius: 20, border: `1px solid ${g.cardBdr}`, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: `1px solid ${g.divider}`, background: isDark ? 'linear-gradient(180deg,rgba(16,185,129,0.12),rgba(16,185,129,0.02))' : 'linear-gradient(180deg,rgba(16,185,129,0.08),rgba(16,185,129,0.01))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: g.text }}>{selectedAshaDetails.full_name}'s History</h3>
                      <button onClick={() => setSelectedAsha(null)} style={{ border: 'none', background: 'transparent', color: g.muted, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: g.insetBg, borderRadius: 8, border: `1px solid ${g.divider}`, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>{selectedAshaDetails.totalCases}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: g.label, textTransform: 'uppercase' }}>Total Visits</div>
                      </div>
                      <div style={{ padding: '0.5rem', background: g.insetBg, borderRadius: 8, border: `1px solid ${g.divider}`, flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{selectedAshaDetails.criticalCount}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: g.label, textTransform: 'uppercase' }}>Emergencies</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {selectedAshaDetails.records.length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', color: g.muted, fontSize: '0.85rem' }}>No recent patient records found.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {selectedAshaDetails.records.map(r => (
                          <div 
                            key={r.id}
                            onClick={() => setSelectedRecord(r)}
                            style={{ 
                              padding: '1.25rem', borderBottom: `1px solid ${g.divider}`, cursor: 'pointer', transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = g.insetBg}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>{r.patient_name || 'Anonymous'}</div>
                              <div style={{ fontSize: '0.7rem', color: g.muted }}>{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: g.text, marginBottom: '0.5rem', lineHeight: 1.4 }}>{r.health_condition}</div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6, fontWeight: 800,
                                background: (r.severity === 'red' || Number(r.severity) >= 7) ? 'rgba(239,68,68,0.15)' : (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                color: (r.severity === 'red' || Number(r.severity) >= 7) ? '#dc2626' : (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) ? '#d97706' : '#059669'
                              }}>
                                {(r.severity === 'red' || Number(r.severity) >= 7) ? 'CRITICAL' : (r.severity === 'yellow' || (Number(r.severity) >= 4 && Number(r.severity) <= 6)) ? 'MODERATE' : 'STABLE'}
                              </span>
                              {!r.reviewed && <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6, background: '#fef3c7', color: '#d97706', fontWeight: 800 }}>UNREVIEWED</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </THOLayout>
      
      <PatientRecordModal record={selectedRecord} isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} g={g} />
    </>
  )
}

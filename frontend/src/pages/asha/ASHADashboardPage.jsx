import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import DashboardLayout from '../../components/asha/DashboardLayout'
import { GUEST_TRIAGE_RECORDS, buildAshaPatients } from '../../lib/guestDemoData'
import { ReviewModal, ReviewSection } from '../../components/common/ReviewModal'
import { apiFetch } from '../../lib/api'

/* ─── Constants ──────────────────────────────────────────── */
const ALL_DISTRICTS = [
  "Angul", "Boudh", "Balangir", "Bargarh", "Balasore", "Bhadrak", "Cuttack", "Deogarh", "Dhenkanal", "Ganjam", "Gajapati", "Jharsuguda", "Jajpur", "Jagatsinghpur", "Khordha", "Keonjhar", "Kalahandi", "Kandhamal", "Koraput", "Kendrapara", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nuapada", "Nayagarh", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
]
const SEV_ORDER = { red: 0, yellow: 1, green: 2 }

function timeAgo(iso) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}


/* ─── Icons ──────────────────────────────────────────────── */
const GridIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
)
const PatientIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
  </svg>
)
const ChatIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const SearchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ChevRight = ({ color = 'currentColor' }) => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevDown = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)
const MenuBars = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const FilterIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)
const TrashIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

/* ─── Severity ───────────────────────────────────────────── */
const SEV = {
  red: { label: 'Emergency', color: '#ff4d4d', bg: 'rgba(255,77,77,0.18)', bdr: 'rgba(255,77,77,0.45)' },
  yellow: { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', bdr: 'rgba(245,158,11,0.45)' },
  green: { label: 'Stable', color: '#10b981', bg: 'rgba(16,185,129,0.15)', bdr: 'rgba(16,185,129,0.35)' },
}

const SeverityPill = ({ severity }) => {
  const s = SEV[severity]; if (!s) return null
  const { isDark } = useTheme()
  const isCritical = severity === 'red' || severity === 'yellow'
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: 4, 
      padding: '3px 10px', borderRadius: 99, 
      background: s.bg, border: `1px solid ${s.bdr}`, 
      fontSize: '0.71rem', fontWeight: 800, 
      color: isCritical ? (isDark ? '#fff' : '#000') : s.color, 
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' 
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
      {s.label}
    </span>
  )
}
const PriorityBadge = ({ severity }) => {
  const { isDark } = useTheme()
  const map = { 
    red: { l: 'High', c: '#ff4d4d', bg: 'rgba(255,77,77,0.18)', b: 'rgba(255,77,77,0.40)' }, 
    yellow: { l: 'Medium', c: '#f59e0b', bg: 'rgba(245,158,11,0.18)', b: 'rgba(245,158,11,0.40)' }, 
    green: { l: 'Low', c: '#10b981', bg: 'rgba(16,185,129,0.15)', b: 'rgba(16,185,129,0.35)' } 
  }
  const m = map[severity] || { l: '—', c: '#9ca3af', bg: 'rgba(156,163,175,0.12)', b: 'rgba(156,163,175,0.25)' }
  const isCritical = severity === 'red' || severity === 'yellow'
  return (
    <span style={{ 
      display: 'inline-block', padding: '3px 10px', borderRadius: 99, 
      background: m.bg, 
      color: isCritical ? (isDark ? '#fff' : '#000') : m.c, 
      border: `1px solid ${m.b}`, 
      fontSize: '0.71rem', fontWeight: 800, 
      backdropFilter: 'blur(8px)' 
    }}>{m.l}</span>
  )
}


const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]

/* ═══════════════════════════════════════════════════════════
   ASHADashboardPage
   ═══════════════════════════════════════════════════════════ */
export default function ASHADashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isDark } = useTheme()

  const [activeTab, setActiveTab] = useState('ALL')
  const [viewTab, setViewTab] = useState('Table')
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const debounceRef = useRef(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  const [patientResults, setPatientResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [showCount, setShowCount] = useState(50)
  const [dashError, setDashError] = useState(null)
  const [summaryCounts, setSummaryCounts] = useState({ red: 0, yellow: 0, green: 0 })

  useEffect(() => {
    const c = { red: 0, yellow: 0, green: 0 }
    patientResults.forEach(p => { if (p.latestSeverity && c[p.latestSeverity] !== undefined) c[p.latestSeverity]++ })
    setSummaryCounts(c)
  }, [patientResults])

  // Get unique patient names for suggestions
  const uniqueNames = useMemo(() => {
    const names = new Set(patientResults.map(p => p.name).filter(Boolean))
    return Array.from(names)
      .filter(name => name.toLowerCase().includes(query.trim().toLowerCase()) && query.trim().length > 0)
      .sort()
      .slice(0, 8) // Limit to 8 suggestions
  }, [patientResults, query])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')

      // ── Guest mode: use demo data directly ──
      if (!token) {
        let rows = [...GUEST_TRIAGE_RECORDS]
        if (activeTab !== 'ALL') rows = rows.filter(r => r.severity === activeTab.toLowerCase())
        if (query.trim().length >= 2) rows = rows.filter(r => r.patient_name?.toLowerCase().includes(query.trim().toLowerCase()))
        const patients = buildAshaPatients(rows)
        setPatientResults(patients)
        setTotalCount(patients.length)
        setShowCount(50)
        setLoading(false)
        return
      }

      const res = await apiFetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', { headers: { Authorization: `Bearer ${token}` } })
      let rows = res.ok ? await res.json() : []
      rows = rows || []

      if (activeTab !== 'ALL') rows = rows.filter(r => r.severity === activeTab.toLowerCase())
      if (query.trim().length >= 2) rows = rows.filter(r => r.patient_name?.toLowerCase().includes(query.trim().toLowerCase()))

      const grouped = new Map()
      for (const r of rows) {
        const k = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.tehsil || r.district}`
        if (!grouped.has(k)) grouped.set(k, { id: r.patient_id || k, name: r.name || r.patient_name, age: r.age, gender: r.gender, district: r.district, tehsil: r.tehsil, triage_records: [] })
        grouped.get(k).triage_records.push({ id: r.id, severity: r.severity, brief: r.brief, created_at: r.created_at })
      }
      const patients = Array.from(grouped.values()).map(p => {
        p.triage_records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        p.latestSeverity = p.triage_records[0]?.severity || null
        return p
      })
      
      setPatientResults(patients)
      setTotalCount(patients.length)
      setShowCount(50)
    } catch (err) {
      setDashError(err?.message || 'Unknown error')
      setPatientResults([]); setTotalCount(0)
    } finally { setLoading(false) }
  }, [activeTab, query])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchRecords, query ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [activeTab, query, fetchRecords])

  const handlePatientClick = p => navigate('/patient', { state: { prefill: { name: p.name, age: p.age, gender: p.gender, district: p.district, tehsil: p.tehsil }, patientId: p.id } })
  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete ALL records for this patient?')) return
    setPatientResults(prev => prev.filter(p => p.id !== id))
    setTotalCount(prev => prev - 1)
  }

  const visible = patientResults.slice(0, showCount)
  const SEV_ORDER_IDX = { red: 0, yellow: 1, green: 2, none: 3 }

  const sortedResults = [...visible].sort((a, b) => {
    let valA, valB
    if (sortField === 'name') { valA = a.name?.toLowerCase(); valB = b.name?.toLowerCase() }
    else if (sortField === 'date') { valA = new Date(a.triage_records?.[0]?.created_at || 0); valB = new Date(b.triage_records?.[0]?.created_at || 0) }
    else if (sortField === 'tehsil') { valA = a.tehsil?.toLowerCase(); valB = b.tehsil?.toLowerCase() }
    else if (sortField === 'severity') { valA = SEV_ORDER_IDX[a.latestSeverity] ?? 3; valB = SEV_ORDER_IDX[b.latestSeverity] ?? 3 }
    
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const groups = useMemo(() => {
    const sevMap = {
      red: { label: 'Emergency', dot: '#ff4d4d', items: [] },
      yellow: { label: 'Moderate', dot: '#f59e0b', items: [] },
      green: { label: 'Stable', dot: '#10b981', items: [] }
    }
    patientResults.forEach(p => {
      const s = p.latestSeverity?.toLowerCase()
      if (sevMap[s]) sevMap[s].items.push(p)
    })
    return Object.entries(sevMap).map(([key, val]) => ({ key, ...val }))
  }, [patientResults])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIndicator = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return <span style={{ marginLeft: 4 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const g = {
    panelBg: 'var(--g-panel-bg)',
    panelBdr: 'var(--g-panel-bdr)',
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    hover: 'var(--g-hover)',
    rowHover: 'var(--g-row-hover)',
    cardBg: 'var(--g-card-bg)',
    cardBdr: 'var(--g-card-bdr)',
    cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)',
    btn: 'var(--g-btn)',
    btnBdr: 'var(--g-btn-bdr)',
    accentL: 'rgba(16,185,129,0.12)',
    accentB: 'rgba(16,185,129,0.25)',
    accentT: '#059669',
  };

  const cardStyle = {
    background: g.cardBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
    border: `1px solid ${g.cardBdr}`, borderRadius: 16, boxShadow: g.cardShd,
  }
  const glassInput = {
    background: 'var(--g-btn)',
    border: `1px solid ${g.btnBdr}`,
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    color: g.text, outline: 'none', transition: 'all .2s',
  }


  const topbar = (
    <>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: g.muted, pointerEvents: 'none' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            placeholder="Search by name (e.g., Mishra, Ashwati, Abdullahi)…"
            style={{ ...glassInput, width: '100%', height: 36, paddingLeft: '2.1rem', paddingRight: '2.75rem', borderRadius: 10, fontSize: '0.845rem' }}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setShowSearchSuggestions(e.target.value.trim().length > 0)
            }}
            onFocus={() => setShowSearchSuggestions(query.trim().length > 0)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 150)}
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowSearchSuggestions(false) }} style={{ position: 'absolute', right: 34, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: g.muted, cursor: 'pointer' }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', fontWeight: 700, color: g.muted, background: g.btn, border: `1px solid ${g.btnBdr}`, padding: '2px 5px', borderRadius: 5, pointerEvents: 'none' }}>⌘K</span>

          {/* Search suggestions dropdown */}
          {showSearchSuggestions && uniqueNames.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
              background: g.cardBg, border: `1px solid ${g.cardBdr}`, borderRadius: 10,
              boxShadow: g.cardShd, backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
              zIndex: 1000, overflow: 'hidden'
            }}>
              {uniqueNames.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => {
                    setQuery(name)
                    setShowSearchSuggestions(false)
                  }}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', border: 'none',
                    background: idx > 0 ? 'transparent' : g.hover,
                    color: g.text, textAlign: 'left', cursor: 'pointer',
                    borderBottom: idx < uniqueNames.length - 1 ? `1px solid ${g.divider}` : 'none',
                    fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background .12s'
                  }}
                  onMouseEnter={e => e.target.style.background = g.hover}
                  onMouseLeave={e => e.target.style.background = idx > 0 ? 'transparent' : g.hover}
                >
                  🔍 {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <button className="hp-cta" onClick={() => navigate('/patient')} style={{ height: 36, padding: '0 1rem', borderRadius: 10, background: 'linear-gradient(135deg,#0d9488 0%,#10b981 100%)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', fontWeight: 700, fontSize: '0.845rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.38)' }}>
          + New Patient
        </button>
      </div>
    </>
  )

  return (
    <DashboardLayout topbarContent={topbar}>
      <style>{`
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${g.divider};border-radius:99px;}
        .hp-row:hover{background:var(--g-row-hover)!important;cursor:pointer;}
        .hp-btn:hover{background:var(--g-btn-hover)!important;}
        .hp-del:hover{background:rgba(239,68,68,0.15)!important;color:#f87171!important;}
        .hp-cta:hover{opacity:0.87!important;transform:translateY(-1px)!important;}
        .hp-nav:hover{background:var(--g-hover)!important;}
        
        /* Responsive Font Scales */
        .hp-name { font-weight: 700; fontSize: 0.875rem; color: ${g.text}; line-height: 1.25; }
        .hp-details { font-size: 0.72rem; color: ${g.muted}; line-height: 1.4; }
        .hp-header-cell { font-size: 0.65rem; font-weight: 700; color: ${g.label}; letter-spacing: 0.07em; text-transform: uppercase; user-select: none; display: flex; alignItems: center; gap: 4px; }
        .hp-table-grid { display: grid; grid-template-columns: 2fr 1.2fr 1.2fr 1fr 1fr 0.5fr; gap: 0.5rem; }
        .hp-cell-content { display: flex; align-items: center; }

        @media (max-width: 768px) {
          .hp-name { font-size: 0.75rem; }
          .hp-details { font-size: 0.62rem; }
          .hp-header-cell { font-size: 0.55rem; letter-spacing: 0.02em; }
          .hp-table-grid { grid-template-columns: 2fr 1fr 1fr 0.8fr 0.8fr 0.4fr; gap: 0.25rem; }
          .hp-chip { font-size: 0.75rem !important; padding: 0.35rem 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .hp-table-grid { grid-template-columns: 2.5fr 1fr 0.8fr 0.5fr; } /* Hide some columns on very small screens if necessary, or just squash more */
          .hp-hide-mobile { display: none !important; }
        }
      `}</style>

        <div style={{ padding: 'clamp(1rem, 3.5vw, 2.25rem)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ── Inline Review Section ── */}
          <ReviewSection role="asha" isDark={isDark} />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="hp-chip" onClick={() => setActiveTab('ALL')} style={{
              padding: '0.4rem 1rem', borderRadius: 99, cursor: 'pointer', transition: 'all .18s',
              background: activeTab === 'ALL' ? g.accent : g.cardBg,
              backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
              border: `1px solid ${activeTab === 'ALL' ? g.accent : g.cardBdr}`,
              color: activeTab === 'ALL' ? '#fff' : g.text,
              fontWeight: 700, fontSize: '0.845rem',
              boxShadow: activeTab === 'ALL' ? '0 4px 14px rgba(16,185,129,0.40)' : g.cardShd,
            }}>All ({totalCount})</button>

            {[
              { sev: 'red', emoji: '🚨', label: 'Emergency', count: summaryCounts.red, c: '#ff4d4d', activeBg: 'rgba(255,77,77,0.25)', activeBdr: 'rgba(255,77,77,0.60)' },
              { sev: 'yellow', emoji: '⚠️', label: 'Moderate', count: summaryCounts.yellow, c: '#f59e0b', activeBg: 'rgba(245,158,11,0.25)', activeBdr: 'rgba(245,158,11,0.60)' },
              { sev: 'green', emoji: '✅', label: 'Stable', count: summaryCounts.green, c: '#10b981', activeBg: 'rgba(16,185,129,0.22)', activeBdr: 'rgba(16,185,129,0.55)' },
            ].map(s => {
              const on = activeTab === s.sev.toUpperCase()
              return (
                <button key={s.sev} className="hp-chip" onClick={() => setActiveTab(on ? 'ALL' : s.sev.toUpperCase())} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.875rem', borderRadius: 99, cursor: 'pointer', transition: 'all .18s',
                  background: on ? s.activeBg : g.cardBg,
                  backdropFilter: g.blur, WebkitBackdropFilter: g.blur,
                  border: `1px solid ${on ? s.activeBdr : g.cardBdr}`,
                  color: on ? s.c : g.text,
                  fontWeight: 700, fontSize: '0.845rem',
                  boxShadow: on ? `0 4px 14px ${s.c}35` : g.cardShd,
                }}>
                  <span style={{ fontSize: '0.75rem' }}>{s.emoji}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                    <span>{s.label}</span>
                  </div>
                  <span style={{ background: on ? `${s.c}22` : g.btn, color: on ? s.c : g.muted, padding: '0 7px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, backdropFilter: 'blur(8px)' }}>{s.count}</span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['Table', 'Board'].map(t => (
              <button key={t} onClick={() => setViewTab(t)} style={{
                padding: '0.35rem 1rem', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                background: viewTab === t ? g.accentL : g.btn,
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${viewTab === t ? g.accentB : g.btnBdr}`,
                color: viewTab === t ? g.accentT : g.muted,
                fontWeight: viewTab === t ? 700 : 500, fontSize: '0.875rem',
              }}>{t}</button>
            ))}
          </div>

          {dashError && (
            <div style={{ ...cardStyle, padding: '1rem', color: '#f87171', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {dashError} — <button onClick={() => { setDashError(null); fetchRecords() }} style={{ color: g.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
            </div>
          )}

          {loading && patientResults.length === 0 && (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderBottom: `1px solid ${g.divider}`, opacity: .4 }}>
                  {[30, 20, 15, 12, 10].map((w, j) => <div key={j} style={{ height: 10, background: g.cardBdr, borderRadius: 4, flex: `0 0 ${w}%` }} />)}
                </div>
              ))}
            </div>
          )}

          {!loading && patientResults.length === 0 && !dashError && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem', color: g.muted }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: g.text, marginBottom: '0.25rem' }}>No patients found</div>
              <div style={{ fontSize: '0.875rem' }}>Add a new patient to get started.</div>
            </div>
          )}

          {viewTab === 'Table' && sortedResults.length > 0 && (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <div className="hp-table-grid" style={{ padding: '0.875rem 1.375rem', borderBottom: `1px solid ${g.divider}`, background: g.insetBg, backdropFilter: 'blur(8px)' }}>
                {[
                  { label: 'Name', field: 'name', mobile: true },
                  { label: 'Last Visit', field: 'date', mobile: true },
                  { label: 'Tehsil', field: 'tehsil', mobile: false },
                  { label: 'Priority', field: 'severity', mobile: true },
                  { label: 'Status', field: 'severity', mobile: false },
                  { label: '', field: null, mobile: true }
                ].map(col => (
                  <div 
                    key={col.label} 
                    className={`hp-header-cell ${!col.mobile ? 'hp-hide-mobile' : ''}`}
                    onClick={() => col.field && handleSort(col.field)}
                    style={{ cursor: col.field ? 'pointer' : 'default' }}
                  >
                    <span>{col.label}</span>
                    {col.field && <SortIndicator field={col.field} />}
                  </div>
                ))}
              </div>

              {sortedResults.map((p, idx) => {
                const last = p.triage_records?.[0]
                return (
                  <div key={p.id} className="hp-row hp-table-grid" onClick={() => handlePatientClick(p)} style={{
                    padding: '0.75rem 1.375rem', alignItems: 'center',
                    borderBottom: idx < sortedResults.length - 1 ? `1px solid ${g.divider}` : 'none',
                    transition: 'background .12s',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="hp-name">{p.name}</span>
                      <span className="hp-details">
                        {[p.age && `${p.age} yrs`, p.gender].filter(Boolean).join(' · ')}
                        {last?.brief ? ` · ${last.brief.slice(0, 28)}${last.brief.length > 28 ? '…' : ''}` : ''}
                      </span>
                    </div>
                    <div className="hp-cell-content" style={{ fontSize: '0.8rem', color: g.text, fontWeight: 500 }}>{last ? timeAgo(last.created_at) : '—'}</div>
                    <div className="hp-cell-content hp-hide-mobile" style={{ fontSize: '0.8rem', color: g.text, fontWeight: 500 }}>{p.tehsil || '—'}</div>
                    <div className="hp-cell-content"><PriorityBadge severity={p.latestSeverity} /></div>
                    <div className="hp-cell-content hp-hide-mobile"><SeverityPill severity={p.latestSeverity} /></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="hp-del" onClick={e => handleDelete(e, p.id)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${g.cardBdr}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.muted, transition: 'all .15s' }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {viewTab === 'Board' && groups.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
              {groups.map(group => (
                <div key={group.key} style={{ ...cardStyle, overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: g.insetBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: group.dot, boxShadow: `0 0 6px ${group.dot}` }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: g.text }}>{group.label}</span>
                    <span style={{ fontWeight: 500, color: g.muted, fontSize: '0.8rem' }}>({group.items.length})</span>
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.items.map(p => {
                      const last = p.triage_records?.[0]
                      return (
                        <div key={p.id} className="hp-row" onClick={() => handlePatientClick(p)} style={{ padding: '0.75rem', borderRadius: 10, border: `1px solid ${g.divider}`, background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', transition: 'all .15s' }}>
                          <div className="hp-name" style={{ marginBottom: 3 }}>{p.name}</div>
                          <div className="hp-details" style={{ marginBottom: 8 }}>{[p.age && `${p.age} yrs`, p.gender, p.tehsil].filter(Boolean).join(' · ')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <SeverityPill severity={p.latestSeverity} />
                            <span className="hp-details">{last ? timeAgo(last.created_at) : ''}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {patientResults.length > showCount && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCount(c => c + 50)} style={{ padding: '0.625rem 1.5rem', borderRadius: 9, border: `1px solid ${g.accentB}`, color: g.accentT, background: g.accentL, backdropFilter: g.blur, WebkitBackdropFilter: g.blur, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', transition: 'all .15s' }}>
                Load more ({patientResults.length - showCount} remaining)
              </button>
            </div>
          )}

          {/* ── Logout / Review button ── */}
          <div style={{ textAlign: 'center', paddingBottom: '2rem', opacity: 0.6 }}>
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                padding: '0.625rem 1.75rem', borderRadius: 99,
                border: '1.5px solid rgba(239,68,68,0.3)',
                background: 'transparent', color: '#ef4444',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Sign Out
            </button>
          </div>
        </div>

      {/* ── Review Modal on logout ── */}
      {showReviewModal && (
        <ReviewModal
          role="asha"
          onSkip={() => { setShowReviewModal(false); logout(); navigate('/') }}
          onSubmit={() => { setShowReviewModal(false); logout(); navigate('/') }}
        />
      )}
    </DashboardLayout>
  )
}

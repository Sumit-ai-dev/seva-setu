import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import logoSrc from '../../images/logo/logo.jpg'

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const HomeIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const MapIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)
const LogoutIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const MenuBars = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)
const CloseIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const ChevronRight = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
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

const UsersIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const BarChartIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: HomeIcon, path: '/dashboard/tho' },
  { id: 'analytics', label: 'Analytics', Icon: BarChartIcon, path: '/dashboard/tho/analytics' },
  { id: 'ashas', label: 'ASHA Network', Icon: UsersIcon, path: '/dashboard/tho/ashas' },
  { id: 'map',  label: 'District Map', Icon: MapIcon,  path: '/dashboard/tho/map' },
]

/**
 * THOLayout — full-page layout wrapper matching ASHA DashboardLayout.
 * Usage:
 *   <THOLayout onLogout={...} topbarContent={...}>
 *     ...page content...
 *   </THOLayout>
 */
export default function THOLayout({ children, onLogout, topbarContent, contentStyle = {} }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isExpanded = isMobile ? sidebarOpen : isHovered
  const sidebarWidth = isMobile ? (sidebarOpen ? 260 : 0) : (isHovered ? 260 : 80)

  const g = useMemo(() => ({
    panelBg: 'var(--g-card-bg)',
    panelBdr: 'var(--g-card-bdr)',
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label, #94a3b8)',
    accent: 'var(--g-accent)',
    hover: 'var(--g-inset-bg, rgba(0,0,0,0.04))',
    divider: 'var(--g-divider)',
    btn: 'var(--g-card-bg)',
    btnBdr: 'var(--g-card-bdr)',
  }), [isDark])

  const panel = { background: g.panelBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur }

  return (
    <div style={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
      color: g.text, background: 'var(--bg)',
    }}>
      <style>{`
        *{box-sizing:border-box;}
        .tho-nav-btn{width:100%;display:flex;align-items:center;gap:0.625rem;padding:0.5rem 0.625rem;border-radius:10px;margin-bottom:3px;border:1px solid transparent;background:transparent;cursor:pointer;text-align:left;transition:all .18s;color:inherit;}
        .tho-nav-btn:hover{background:${g.hover}!important;}
        .tho-nav-btn.active{background:${isDark ? 'rgba(59,130,246,0.15)' : '#ebf5ff'};border-color:${isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe'};color:#3b82f6;font-weight:700;}
        .tho-icon-btn{display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid ${g.btnBdr};background:${g.btn};color:${g.text};transition:all .18s;backdrop-filter:blur(12px);}
        .tho-icon-btn:hover{background:${g.hover}!important;}
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        style={{
          ...panel,
          width: sidebarWidth,
          minWidth: sidebarWidth,
          borderRight: `1px solid ${g.panelBdr}`,
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          transition: 'width .28s cubic-bezier(.4,0,.2,1), min-width .28s cubic-bezier(.4,0,.2,1)',
          position: isMobile ? 'absolute' : 'relative',
          zIndex: 20, height: '100%',
          boxShadow: isDark ? '2px 0 24px rgba(0,0,0,0.35)' : '2px 0 20px rgba(59,130,246,0.08)',
        }}
      >
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Brand header */}
          <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <img src={logoSrc} alt="Seva Setu" width={40} height={40} style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0, display: 'block' }} />
              <div style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: g.text, letterSpacing: '-0.022em', lineHeight: 1.15 }}>Seva Setu</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#3b82f6', letterSpacing: '0.09em', textTransform: 'uppercase' }}>THO Dashboard</div>
              </div>
            </div>
            {isMobile && (
              <button className="tho-icon-btn" onClick={() => setSidebarOpen(false)} style={{
                width: 28, height: 28, borderRadius: 7,
              }}><CloseIcon /></button>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 0.625rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: g.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem', opacity: isExpanded ? 1 : 0 }}>Menu</div>
            {NAV_ITEMS.map(({ id, label, Icon, path }) => {
              const on = path === '/dashboard/tho'
                ? location.pathname === '/dashboard/tho'
                : location.pathname.startsWith(path)
              return (
                <button key={id} className={`tho-nav-btn${on ? ' active' : ''}`} onClick={() => { navigate(path); if (isMobile) setSidebarOpen(false) }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'rgba(59,130,246,0.12)' : 'transparent', color: on ? '#3b82f6' : 'inherit', transition: 'all .18s' }}>
                    <Icon />
                  </div>
                  <span style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: on ? 700 : 500 }}>{label}</span>
                  {on && isExpanded && <ChevronRight />}
                </button>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${g.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0', marginBottom: '0.25rem', opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px rgba(59,130,246,0.35)' }}>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'T')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'THO Officer'}</div>
                <div style={{ fontSize: '0.64rem', color: g.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.employee_id}</div>
              </div>
            </div>
            <button className="tho-nav-btn" onClick={onLogout} style={{ color: '#ef4444' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogoutIcon />
              </div>
              <span style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 600 }}>Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 19, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      )}

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative', zIndex: 5 }}>

        {/* Topbar */}
        <header style={{
          ...panel,
          borderBottom: `1px solid ${g.panelBdr}`,
          height: 62, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 1.25rem', gap: '0.75rem',
          position: 'relative', zIndex: 10,
          boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.30)' : '0 2px 16px rgba(59,130,246,0.08)',
        }}>
          {/* Mobile hamburger */}
          {isMobile && !sidebarOpen && (
            <button className="tho-icon-btn" onClick={() => setSidebarOpen(true)} style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            }}><MenuBars /></button>
          )}

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '100%', gap: '0.75rem' }}>
            {topbarContent}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button className="tho-icon-btn" onClick={toggleTheme} style={{
              width: 36, height: 36, borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, ...contentStyle }}>
          {children}
        </main>
      </div>
    </div>
  )
}

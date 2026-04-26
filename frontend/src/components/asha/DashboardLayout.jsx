import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import logoSrc from '../../images/logo/logo.jpg'

/* ─── Icons ──────────────────────────────────────────────────── */
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
const QRIcon = ({ active }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <line x1="14" y1="14" x2="14" y2="17" />
    <line x1="17" y1="14" x2="17" y2="14.01" />
    <line x1="20" y1="14" x2="20" y2="17" />
    <line x1="14" y1="20" x2="14" y2="20.01" />
    <line x1="17" y1="17" x2="17" y2="20" />
    <line x1="20" y1="20" x2="20" y2="20.01" />
  </svg>
)
const SearchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const ChevronRight = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const ChevronDown = () => (
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

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', Icon: GridIcon, path: '/home' },
  { id: 'patient', label: 'New Patient', Icon: PatientIcon, path: '/patient' },
  { id: 'medical-qr', label: 'Medical QR', Icon: QRIcon, path: '/medical-qr' },
  { id: 'chat', label: 'AI Chat', Icon: ChatIcon, path: '/chat' },
]

export default function DashboardLayout({ children, topbarContent, sidebarExtra, contentStyle = {} }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { theme, isDark, toggleTheme, setTheme } = useTheme()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isExpanded = isMobile ? sidebarOpen : isHovered
  const sidebarWidth = isMobile ? (sidebarOpen ? 260 : 0) : (isHovered ? 260 : 80)

  const g = {
    panelBg: 'var(--g-panel-bg)',
    panelBdr: 'var(--g-panel-bdr)',
    blur: 'var(--g-blur)',
    text: 'var(--g-text)',
    muted: 'var(--g-muted)',
    label: 'var(--g-label)',
    accent: 'var(--g-accent)',
    accentL: 'var(--g-nav-active-bg)',
    hover: 'var(--g-hover)',
    divider: 'var(--g-divider)',
    btn: 'var(--g-btn)',
    btnBdr: 'var(--g-btn-bdr)',
    btnT: 'var(--g-text)',
    navActiveT: 'var(--g-nav-active-t)',
    navActiveShd: '0 4px 12px rgba(16,185,129,0.15)',
    navIconBg: 'var(--g-nav-icon-bg)',
  };

  const panel = { background: g.panelBg, backdropFilter: g.blur, WebkitBackdropFilter: g.blur }
  const pageBg = 'var(--g-page-bg)'

  return (
    <div style={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
      color: g.text,
      background: pageBg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--g-divider);border-radius:99px;}
        .dl-nav:hover{background:var(--g-hover)!important;}
        .dl-btn:hover{background:var(--g-btn-hover)!important;}
        .dl-cta:hover{opacity:0.87!important;transform:translateY(-1px)!important;box-shadow:0 6px 22px rgba(16,185,129,0.45)!important;}
        input::placeholder{color:${g.muted};opacity:0.8;}
        select option{background:${isDark ? '#0a1525' : '#edfaf5'};color:${g.text};}
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
          transition: 'width .28s cubic-bezier(.4,0,.2,1),min-width .28s cubic-bezier(.4,0,.2,1)',
          position: isMobile ? 'absolute' : 'relative', zIndex: 20,
          height: '100%',
          boxShadow: isDark ? '2px 0 24px rgba(0,0,0,0.35)' : '2px 0 20px rgba(16,185,129,0.08)',
        }}>
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', height: '100%' }}>

          <div style={{ padding: '1.125rem 1rem 0.875rem', borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <img
                src={logoSrc}
                alt="Seva Setu"
                style={{
                  width: 40, height: 40, borderRadius: 16, flexShrink: 0,
                  objectFit: 'cover', display: 'block',
                  filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.35))',
                }}
              />
              <div style={{ opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: g.text, letterSpacing: '-0.022em', lineHeight: 1.15 }}>Seva Setu</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, color: g.accent, letterSpacing: '0.09em', textTransform: 'uppercase' }}>ASHA Dashboard</div>
              </div>
            </div>
            {isMobile && (
              <button className="dl-btn" onClick={() => setSidebarOpen(false)} style={{
                width: 28, height: 28, borderRadius: 7,
                background: g.btn, border: `1px solid ${g.btnBdr}`,
                backdropFilter: 'blur(8px)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: g.btnT, transition: 'all .18s', flexShrink: 0,
              }}><ChevronDown /></button>
            )}
          </div>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '0.875rem 0.625rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: g.label, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem', opacity: isExpanded ? 1 : 0 }}>Menu</div>
            {NAV_ITEMS.map(({ id, label, Icon, path }) => {
              const on = location.pathname.startsWith(path)
              return (
                <button key={id} className="dl-nav" onClick={() => navigate(path)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.625rem', borderRadius: 10, marginBottom: 3,
                  background: on ? g.navActiveBg : 'transparent',
                  border: on ? `1px solid ${g.navActiveBdr}` : '1px solid transparent',
                  boxShadow: on ? g.navActiveShd : 'none',
                  color: on ? g.navActiveT : g.text,
                  fontWeight: on ? 700 : 500, fontSize: '0.875rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .18s',
                  backdropFilter: on ? 'blur(8px)' : 'none',
                }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = g.hover }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? g.navIconBg : 'transparent', color: on ? g.navActiveT : 'inherit', transition: 'all .18s' }}>
                    <Icon active={on} />
                  </div>
                  <span style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>{label}</span>
                  {on && isExpanded && <ChevronRight />}
                </button>
              )
            })}

            {/* Extra content (e.g. Districts) */}
            {isExpanded && sidebarExtra && (
              <div style={{ marginTop: '1.25rem' }}>
                {sidebarExtra}
              </div>
            )}
          </nav>

          {/* User */}
          <div style={{ padding: '0.75rem 0.875rem', borderTop: `1px solid ${g.divider}` }}>
            <button className="dl-nav" onClick={() => navigate('/profile')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.375rem', borderRadius: 9, border: 'none',
              background: 'transparent', cursor: 'pointer', color: g.text, transition: 'all .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = g.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#0d9488,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px rgba(16,185,129,0.40)' }}>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>{(user?.full_name || user?.employee_id || 'A')[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, opacity: isExpanded ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 600, fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'ASHA Worker'}</div>
                <div style={{ fontSize: '0.64rem', color: g.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.employee_id}</div>
              </div>
              {isExpanded && <ChevronRight />}
            </button>
          </div>
        </div>
      </aside>

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
          boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.30)' : '0 2px 16px rgba(16,185,129,0.08)',
        }}>
          {isMobile && !sidebarOpen && (
            <button className="dl-btn" onClick={() => setSidebarOpen(true)} style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: g.btn, border: `1px solid ${g.btnBdr}`,
              backdropFilter: 'blur(12px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: g.btnT, transition: 'all .18s',
            }}><MenuBars /></button>
          )}

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: '100%', gap: '0.75rem' }}>
            {topbarContent}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            <button className="dl-btn" onClick={toggleTheme} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: g.btn, border: `1px solid ${g.btnBdr}`,
              backdropFilter: 'blur(12px)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: g.btnT, transition: 'all .2s',
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
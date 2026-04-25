import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext.jsx'
import DMOSidebar from '../../components/dmo/DMOSidebar'
import { SunIcon, MoonIcon } from '../admin/AdminIcons'
import { ReviewModal } from '../../components/common/ReviewModal'

export default function DMOProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.name || '')
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    if (user) setFullName(user.name || '')
  }, [user])

  const g = useMemo(() => ({
    text: 'var(--g-text)', muted: 'var(--g-muted)', label: 'var(--g-label)', accent: 'var(--g-accent)',
    cardBg: 'var(--g-card-bg)', cardBdr: 'var(--g-card-bdr)', cardShd: 'var(--g-card-shd)',
    divider: 'var(--g-divider)', insetBg: 'var(--g-inset-bg)', blur: 'var(--g-blur)',
    btn: 'var(--g-btn)', btnBdr: 'var(--g-btn-bdr)',
  }), [isDark])

  const handleLogout = () => {
    if (user?.guest) {
      setShowReviewModal(true)
    } else {
      logout()
      navigate('/')
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return
    setSaveLoading(true)
    // Simulate save / Persist guest name
    if (user?.guest) {
      const updated = { ...user, name: fullName.trim() }
      localStorage.setItem('user', JSON.stringify(updated))
      // In a real app we'd call an API, here we just wait a bit
      await new Promise(r => setTimeout(r, 600))
      window.location.reload() // Reload to sync with AuthContext for now
    }
    setSaveLoading(false)
    setIsEditing(false)
  }

  const cardStyle = {
    background: g.cardBg,
    borderRadius: 24,
    padding: '2rem',
    border: `1px solid ${g.cardBdr}`,
    boxShadow: g.cardShd,
    backdropFilter: g.blur,
    WebkitBackdropFilter: g.blur,
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      <DMOSidebar isHovered={isHovered} setIsHovered={setIsHovered} onLogout={handleLogout} onAdminNav={() => navigate('/dashboard/admin')} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 72, background: g.cardBg, borderBottom: `1px solid ${g.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', flexShrink: 0, backdropFilter: g.blur }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: g.text }}>DMO Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={toggleTheme} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${g.divider}`, background: g.cardBg, color: g.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
              {(fullName || 'D')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Profile Info Card */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2.5rem', fontWeight: 800, boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)' }}>
                  {(fullName || 'D')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {!isEditing ? (
                    <>
                      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800, color: g.text, letterSpacing: '-0.03em' }}>
                        {fullName || 'District Medical Officer'}
                      </h1>
                      <div style={{ fontSize: '1rem', color: '#4f46e5', fontWeight: 700, marginBottom: '0.875rem' }}>District Medical Officer</div>
                      <button 
                        onClick={() => setIsEditing(true)}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: 99, background: g.btn, border: `1px solid ${g.btnBdr}`, color: g.text, fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
                      >Edit Name</button>
                    </>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', marginBottom: 6 }}>Full Name</label>
                      <input 
                        value={fullName} onChange={e => setFullName(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', border: `1.5px solid ${g.cardBdr}`, color: g.text, outline: 'none', marginBottom: '1rem', fontSize: '1rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => { setIsEditing(false); setFullName(user?.name || '') }} style={{ padding: '0.5rem 1.25rem', borderRadius: 99, background: 'transparent', border: `1px solid ${g.cardBdr}`, color: g.muted, fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleSaveProfile} disabled={saveLoading} style={{ padding: '0.5rem 1.25rem', borderRadius: 99, background: '#4f46e5', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', opacity: saveLoading ? 0.7 : 1 }}>
                          {saveLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: g.muted, marginTop: isEditing ? '1.5rem' : '0.5rem' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {user?.district || 'Pune District'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: g.text }}>Account Credentials</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Employee ID</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: g.text }}>{user?.employee_id || 'DEMO-DMO-001'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Access Level</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>District Administrator</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Phone</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: g.text }}>{user?.phone || '+91 98765 43210'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: g.label, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: g.text }}>{user?.email || 'ramesh.patil@health.maha.gov.in'}</div>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <div style={{ ...cardStyle, background: isDark ? 'rgba(239, 68, 68, 0.03)' : 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444', marginBottom: 4 }}>Account Session</div>
                  <div style={{ fontSize: '0.85rem', color: g.muted }}>Security managed by Nexus Health Authentication</div>
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{ 
                    padding: '0.875rem 2rem', borderRadius: 99, 
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: '1rem', 
                    cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(239, 68, 68, 0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.3)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Sign Out
                  {user?.guest && (
                    <span style={{ 
                      marginLeft: '4px', background: '#fff', color: '#ef4444', 
                      padding: '2px 8px', borderRadius: 99, fontSize: '0.65rem', 
                      fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' 
                    }}>DEMO</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal on logout */}
        {showReviewModal && (
          <ReviewModal
            role="dmo"
            onSkip={() => { setShowReviewModal(false); logout(); navigate('/') }}
            onSubmit={() => { setShowReviewModal(false); logout(); navigate('/') }}
          />
        )}
      </main>
    </div>
  )
}

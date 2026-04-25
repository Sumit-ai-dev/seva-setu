import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ReviewModal } from '../common/ReviewModal'
import { apiFetch } from '../../lib/api'

export default function ProfileOverlay({ onClose }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [banner, setBanner] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Profile Editable State
  const [isEditing, setIsEditing] = useState(false)
  const [forceOnboard, setForceOnboard] = useState(false)
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    // Start entry animation
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    if (forceOnboard) return // Prevent closing if onboarding
    setMounted(false)
    setTimeout(onClose, 280)
  }

  const { user: authUser, logout, setUserRole } = useAuth()

  useEffect(() => {
    async function loadProfile() {
      if (!authUser) {
        navigate('/login/asha')
        return
      }
      setUser(authUser)

      // Initialize Name & Location
      const savedName = authUser.full_name || ''
      const savedLoc = authUser.location || ''
      setFullName(savedName)
      setLocation(savedLoc)

      if (!savedName || !savedLoc) {
        setForceOnboard(true)
        setIsEditing(true)
      }

      // Load Avatar & Banner from authUser context
      if (authUser.avatar_b64) setAvatar(authUser.avatar_b64)
      if (authUser.banner_b64) setBanner(authUser.banner_b64)

      // Load Triage History via custom backend API
      try {
        const token = localStorage.getItem('access_token')
        const response = await apiFetch('https://swasthya-setu-full.onrender.com/api/v1/triage_records/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const records = await response.json()
          setHistory(records)
        }
      } catch (err) {
        console.error('Failed to load history', err)
      }
      setLoading(false)
    }
    loadProfile()
  }, [navigate, authUser])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 250
        const MAX_HEIGHT = 250
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

        setAvatar(dataUrl)
        if (user) {
          const token = localStorage.getItem('access_token')
          apiFetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ avatar_b64: dataUrl })
          })
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

        setBanner(dataUrl)
        if (user) {
          const token = localStorage.getItem('access_token')
          apiFetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ banner_b64: dataUrl })
          })
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile() {
    if (!fullName.trim() || !location.trim()) {
      alert("Name and Location are required.")
      return
    }
    setSaveLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      await apiFetch('https://swasthya-setu-full.onrender.com/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), location: location.trim() })
      })

      const updatedUser = { ...user, full_name: fullName.trim(), location: location.trim() }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setIsEditing(false)
      setForceOnboard(false)
    } catch (err) {
      alert("Failed to save profile: " + err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLogout = () => {
    if (authUser?.guest) {
      setShowReviewModal(true)
    } else {
      logout()
      navigate('/')
    }
  }

  async function finalLogout() {
    await logout()
    navigate('/')
  }

  async function handleDeleteAccount() {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete your account? All related patient history records will be permanently eradicated. This action cannot be undone."
    )
    if (!confirmDelete) return

    try {
      if (user && user.id) {
        localStorage.removeItem(`avatar_${user.id}`)
        await logout()
        navigate('/')
      }
    } catch (err) {
      alert("Failed to delete account: " + err.message)
    }
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', transition: 'opacity 0.28s ease',
        opacity: mounted ? 1 : 0
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0b0f19',
          width: '100%', maxWidth: '720px', maxHeight: '90dvh',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Inter', 'Noto Sans', sans-serif",
          display: 'flex', flexDirection: 'column',
          transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)'
        }}
      >
        <style>{`
          @media (max-width: 600px) {
            .po-form-grid { grid-template-columns: 1fr !important; }
            .po-actions-grid { grid-template-columns: 1fr !important; }
            .po-profile-header { padding: 0 1.25rem 1.5rem !important; }
            .po-history-section { padding: 1.25rem !important; }
          }
        `}</style>
        {loading ? (
          <div style={{ padding: '6rem', display: 'flex', justifyContent: 'center' }}>
            <span className="spinner spinner-light" style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <>            {/* --- Cover Banner --- */}
            <div style={{ position: 'relative', height: '150px', background: banner ? `url(${banner}) center/cover no-repeat` : 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)', flexShrink: 0 }}>
              {!banner && <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\\"20\\" height=\\"20\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Ccircle cx=\\"2\\" cy=\\"2\\" r=\\"1\\" fill=\\"rgba(255,255,255,0.1)\\"/%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />}

              {/* Banner Upload */}
              {!forceOnboard && (
                <button
                  onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click() }}
                  style={{ position: 'absolute', top: '0.875rem', left: '0.875rem', zIndex: 10, padding: '0.35rem 0.75rem', borderRadius: 99, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 600 }}
                  title="Change Cover Banner"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Cover
                </button>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={bannerInputRef} onChange={handleBannerChange} />

              {/* Close / Onboard notice */}
              {forceOnboard ? (
                <div style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', zIndex: 10, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '0.375rem 0.875rem', borderRadius: 99, color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                  Complete your profile
                </div>
              ) : (
                <button onClick={handleClose} style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', zIndex: 10, width: 34, height: 34, minWidth: 34, minHeight: 34, flexShrink: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontSize: '0.875rem', padding: 0 }}>✕</button>
              )}
            </div>

            {/* --- Profile Info --- */}
            <div className="po-profile-header" style={{ padding: '0 1.5rem 1.5rem', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>

              {/* Avatar — negative margin pulls it up over the cover edge, in normal flow so nothing clips it */}
              <div style={{ position: 'relative', display: 'inline-block', marginTop: -48, marginBottom: '0.875rem', zIndex: 10 }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#1e293b', border: '4px solid #0b0f19', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                  {avatar ? (
                    <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2.25rem' }}>👩‍⚕️</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: 2, right: 2, background: '#14b8a6', color: '#fff', border: '2px solid #0b0f19', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(20,184,166,0.4)' }}
                  title="Upload Avatar"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </button>
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
              </div>

              {/* Name + role + location */}
              {!isEditing ? (
                <>
                  <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.375rem', fontWeight: 800, color: #f8fafc, letterSpacing: '-0.02em' }}>
                    {user?.full_name || 'Set your name'}
                  </h2>
                  <div style={{ fontSize: '0.875rem', color: '#14b8a6', fontWeight: 600, marginBottom: '0.375rem' }}>Healthcare Provider</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.8125rem', color: #94a3b8, marginBottom: '0.25rem' }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {user?.location || <span style={{ color: '#475569', fontStyle: 'italic' }}>No location set</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>ID: {user?.employee_id}</div>

                  {/* Edit Profile button */}
                  {!forceOnboard && (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '0.5rem 1.25rem', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Edit Profile
                    </button>
                  )}
                </>
              ) : (
                <div style={{ color: '#f8fafc', marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.125rem', fontWeight: 800 }}>Complete Profile</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: 0 }}>Required to serve patients</p>
                </div>
              )}

              {/* Form specifically if editing */}
              {isEditing && (
                <div style={{ background: '#1e293b', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="po-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                      <input
                        type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="E.g., Anjali Sharma"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#334155'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Location / Village</label>
                      <input
                        type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="E.g., Pune District"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', outline: 'none', fontSize: '0.9375rem', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#14b8a6'} onBlur={e => e.target.style.borderColor = '#334155'}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    {!forceOnboard && (
                      <button onClick={() => { setIsEditing(false); setFullName(user?.full_name || ''); setLocation(user?.location || ''); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', padding: '0.5rem 1rem' }}>Cancel</button>
                    )}
                    <button
                      onClick={handleSaveProfile} disabled={saveLoading}
                      style={{ background: '#14b8a6', color: '#111827', border: 'none', padding: '0.625rem 1.5rem', borderRadius: 99, fontWeight: 700, fontSize: '0.9375rem', cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.7 : 1 }}
                    >
                      {saveLoading ? 'Saving...' : 'Save Details'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* --- Patient History --- */}
            <div className="po-history-section" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#e2e8f0' }}>Patient History <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, marginLeft: 8 }}>रुग्ण इतिहास</span></h3>
                <span style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700 }}>
                  {history.length} Visits
                </span>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '2rem', opacity: 0.5 }}>📂</span>
                  <div style={{ color: '#94a3b8', fontSize: '0.9375rem', marginTop: '0.75rem' }}>No patients triaged yet.<br />Your submitted records will appear here.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 340, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {history.map(record => {
                    const date = new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

                    let sevColor = '#34d399'; let sevBg = 'rgba(52, 211, 153, 0.1)'; let borderCol = 'rgba(52, 211, 153, 0.2)';
                    if (record.severity === 'red') { sevColor = '#f87171'; sevBg = 'rgba(248, 113, 113, 0.1)'; borderCol = 'rgba(248, 113, 113, 0.2)'; }
                    if (record.severity === 'yellow') { sevColor = '#fbbf24'; sevBg = 'rgba(251, 191, 36, 0.1)'; borderCol = 'rgba(251, 191, 36, 0.2)'; }

                    return (
                      <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: `1px solid rgba(255,255,255,0.05)`, transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem', marginBottom: 4 }}>{record.patient_name}</div>
                          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{record.age}y</span> • <span>{record.gender}</span> • <span>{record.district}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ background: sevBg, color: sevColor, padding: '0.25rem 0.75rem', border: `1px solid ${borderCol}`, borderRadius: 99, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {record.severity}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{date}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* --- Danger Zone / Logout --- */}
            <div style={{ padding: '0 2rem 2rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Actions</h3>

              <div className="po-actions-grid" style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleLogout}
                  style={{ 
                    flex: 1, padding: '1rem', minHeight: '60px', 
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
                    border: 'none', borderRadius: 99, 
                    color: '#fff', fontWeight: 800, fontSize: '1rem', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    gap: '0.75rem', transition: 'all 0.25s', whiteSpace: 'nowrap',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
                    position: 'relative', overflow: 'hidden'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.3)';
                  }}
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

                <button
                  onClick={handleDeleteAccount}
                  style={{ flex: 1, padding: '1rem', minHeight: '54px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 99, color: '#f87171', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.color = '#f87171'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  Delete Account
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showReviewModal && (
        <ReviewModal 
          role="asha"
          onSkip={finalLogout}
          onSubmit={finalLogout}
        />
      )}
    </div>
  )
}

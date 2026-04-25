import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoIcon from '../../components/common/LogoIcon.jsx'
import HeroSlider from '../../components/landing/HeroSlider.jsx'
import { useAuth } from '../../hooks/useAuth'

const marqueeItems = [
  { text: 'Health is not a privilege — it reaches every door', lang: 'en' },
  { text: 'घराघरांत आरोग्य, ಗ್ರಾಮोಗ್ರಾಮी आशा', lang: 'mr' },
  { text: 'Your ASHA worker is closer than the nearest hospital', lang: 'en' },
  { text: 'आपलं ಗ್ರಾಮ, आपली जबाबदारी — आरोग्य हा आपला हक्क', lang: 'mr' },
  { text: 'No village too far, no family left behind', lang: 'en' }
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const doGuestLogin = async (roleId) => {
    setGuestLoading(true)
    try {
      await auth.loginAsGuest(roleId)
      navigate(roleId === 'tho' ? '/dashboard/tho' : '/home')
    } catch (e) {
      console.error(e)
    } finally {
      setGuestLoading(false)
      setShowGuestPicker(false)
    }
  }

  const roles = [
    {
      id: 'asha',
      title: 'ASHA Worker',
      titleOdia: 'आशा कार्यकर्ती',
      icon: '🏥',
      path: '/login/asha',
      color: '#0F6E56'
    },
    {
      id: 'tho',
      title: 'Taluka Health Officer',
      titleOdia: 'ತಾಲೂಕು आरोग्य अधिकारी',
      icon: '🏛️',
      path: '/login/tho',
      color: '#0a5040'
    },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 0 4rem 0',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <LogoIcon />
        </div>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Nexus Health
        </h1>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          आरोग्य सेतु
        </div>
      </div>

      {/* Marquee Ticker */}
      <div style={{
        width: '100%',
        background: 'var(--color-primary)',
        padding: '0.75rem 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        marginBottom: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'inline-block',
          animation: 'marquee 30s linear infinite'
        }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              paddingRight: '3rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: '#ff6b6b' }}>✚</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <HeroSlider />

      <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0 1rem' }}>
         <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Select your role / आपली भूमिका निवडा
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1000px',
        padding: '0 1rem',
        margin: '0 auto'
      }}>
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => navigate(role.path)}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid transparent',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{role.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                {role.title}
              </h2>
              <div style={{ fontSize: '1.125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {role.titleOdia}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Guest Login Section */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center', padding: '0 1rem' }}>
        <div style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>— or —</div>
        <button
          onClick={() => setShowGuestPicker(true)}
          style={{
            padding: '0.875rem 2.5rem',
            borderRadius: '999px',
            border: '1.5px solid var(--color-primary)',
            background: 'transparent',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-primary)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-primary)'
          }}
        >
          👤 Continue as Guest
        </button>
        <p style={{ marginTop: '0.625rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Explore with demo data — no credentials needed
        </p>
      </div>

      {/* Guest Role Picker Overlay */}
      {showGuestPicker && (
        <div
          onClick={() => setShowGuestPicker(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
            animation: 'gp-fadein 0.22s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-white)',
              borderRadius: '1.5rem',
              padding: '2.5rem 2rem',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowGuestPicker(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                width: 32, height: 32, borderRadius: '50%',
                background: '#f3f4f6', border: 'none',
                color: '#6b7280', fontSize: '0.9rem',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👤</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
                Continue as Guest
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Choose your role to explore with demo data
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => doGuestLogin(role.id)}
                  disabled={guestLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.125rem 1.25rem',
                    borderRadius: '14px',
                    border: '1.5px solid var(--color-border, #e5e7eb)',
                    background: 'var(--color-surface, #f9fafb)',
                    cursor: guestLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    width: '100%',
                    opacity: guestLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!guestLoading) {
                      e.currentTarget.style.borderColor = role.color
                      e.currentTarget.style.background = '#f0fdf8'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}22`
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)'
                    e.currentTarget.style.background = 'var(--color-surface, #f9fafb)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '1rem', marginBottom: '0.1rem' }}>
                      {role.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {role.titleOdia}
                    </div>
                  </div>
                  <span style={{ color: role.color, fontSize: '1.1rem', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
              <p style={{ fontSize: '0.78rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                Guest mode uses realistic demo data — <strong>no login required</strong>. Perfect for exploring the platform.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes gp-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

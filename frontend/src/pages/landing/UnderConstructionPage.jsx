import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function UnderConstructionPage() {
  const navigate = useNavigate()
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #080c16 0%, #0f1f3d 50%, #0a1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Noto Sans', sans-serif",
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '3rem 3.5rem',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))',
          border: '1.5px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem',
          boxShadow: '0 0 30px rgba(16,185,129,0.2)',
          animation: 'pulse-glow 2.5s ease-in-out infinite',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <div style={{
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#10b981', marginBottom: '1rem'
        }}>
          🚧 Under Construction
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
          fontWeight: 800,
          color: '#f8fafc',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: '1rem',
        }}>
          We're building something great
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '1rem',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
          fontWeight: 400,
        }}>
          This page is currently under development. Our team is working hard to bring this feature to life. Check back soon!
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '2.5rem' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < dots ? '#10b981' : 'rgba(255,255,255,0.2)',
              transition: 'background 0.3s',
              boxShadow: i < dots ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
            }} />
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.875rem 2rem',
            borderRadius: 12,
            border: '1.5px solid rgba(16,185,129,0.4)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))',
            color: '#10b981',
            fontWeight: 700,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(16,185,129,0.15)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(16,185,129,0.15))'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.15)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          Go Back
        </button>
      </div>

      <p style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.8125rem', position: 'relative', zIndex: 1 }}>
        Seva Setu · Bridging healthcare in rural Karnataka
      </p>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.2); }
          50%       { box-shadow: 0 0 40px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.1); }
        }
      `}</style>
    </div>
  )
}

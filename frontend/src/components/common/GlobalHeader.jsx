import React, { useState, useEffect } from 'react'
import ProfileOverlay from '../asha/ProfileOverlay.jsx'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function GlobalHeader({ children, rightSide }) {
  const navigate = useNavigate()
  const [showProfileOverlay, setShowProfileOverlay] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.classList.add('theme-transition')
    localStorage.setItem('theme', theme)
  }, [theme])

  const { user } = useAuth()

  // Automatically show Profile if name is missing
  useEffect(() => {
    if (user) {
      const name = user.full_name
      const loc = user.location
      if (!name || !loc) {
        setShowProfileOverlay(true)
      }
    }
  }, [user])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const isVisible = useScrollDirection()

  return (
    <>
      <header style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)', 
        padding: '0.75rem 1rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        boxShadow: 'var(--shadow)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        overflow: 'hidden',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '0.75rem' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 'clamp(1rem, 4vw, 1.25rem)', color: 'var(--primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Nexus Health</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }} className="hide-mobile">आरोग्य सेतू</div>
          </button>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {rightSide}

          <style>{`
            @keyframes toggleGlow {
              0%   { box-shadow: 0 0 0 0 rgba(251,191,36,0.6); }
              50%  { box-shadow: 0 0 0 6px rgba(251,191,36,0); }
              100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
            }
            @keyframes toggleGlowDark {
              0%   { box-shadow: 0 0 0 0 rgba(99,135,255,0.6); }
              50%  { box-shadow: 0 0 0 6px rgba(99,135,255,0); }
              100% { box-shadow: 0 0 0 0 rgba(99,135,255,0); }
            }
            .theme-thumb {
              position: absolute;
              width: 26px; height: 26px;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                          background 0.3s ease,
                          box-shadow 0.3s ease;
            }
            .theme-thumb-light {
              left: 3px;
              background: linear-gradient(135deg, #fef3c7, #fbbf24);
              box-shadow: 0 2px 8px rgba(251,191,36,0.5);
              animation: toggleGlow 0.6s ease;
            }
            .theme-thumb-dark {
              left: calc(100% - 29px);
              background: linear-gradient(135deg, #1e3a8a, #6366f1);
              box-shadow: 0 2px 8px rgba(99,135,255,0.5);
              animation: toggleGlowDark 0.6s ease;
            }
            .theme-toggle-track {
              position: relative;
              width: 80px; height: 32px;
              border-radius: 99px;
              cursor: pointer;
              display: flex; align-items: center;
              padding: 3px;
              border: none;
              flex-shrink: 0;
              overflow: hidden;
              transition: background 0.35s ease, box-shadow 0.3s ease;
            }
            .theme-toggle-track:hover {
              box-shadow: 0 0 0 3px var(--border);
            }
            .theme-label {
              font-size: 0.65rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              transition: opacity 0.2s, color 0.3s;
              user-select: none;
              flex: 1;
              text-align: center;
            }
          `}</style>

          <button
            onClick={toggleTheme}
            className="theme-toggle-track"
            style={{
              background: theme === 'light'
                ? 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)'
                : 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)',
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {/* Left label */}
            <span className="theme-label" style={{
              color: theme === 'light' ? '#92400e' : '#fff',
              opacity: theme === 'light' ? 0 : 1,
              paddingLeft: theme === 'light' ? 0 : '0.25rem',
            }}>🌙</span>

            {/* Thumb */}
            <div className={`theme-thumb ${theme === 'light' ? 'theme-thumb-light' : 'theme-thumb-dark'}`}>
              {theme === 'light' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#92400e" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#e0e7ff" stroke="#e0e7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </div>

            {/* Right label */}
            <span className="theme-label" style={{
              color: theme === 'light' ? '#92400e' : 'transparent',
              opacity: theme === 'light' ? 1 : 0,
              paddingRight: theme === 'light' ? '0.25rem' : 0,
            }}>☀️</span>
          </button>
          
          <button
            onClick={() => setShowProfileOverlay(true)}
            style={{ 
              width: 44, height: 44, borderRadius: '50%', background: 'var(--hover-bg)', 
              border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', 
              transition: 'transform 0.2s', flexShrink: 0 
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Profile"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {showProfileOverlay && <ProfileOverlay onClose={() => setShowProfileOverlay(false)} />}
    </>
  )
}

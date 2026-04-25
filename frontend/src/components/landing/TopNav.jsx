import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { useScrollDirection } from '../../hooks/useScrollDirection'

const NAV = [
  { path: '/home', label: 'Dashboard', marathi: 'डॅशबोर्ड' },
  { path: '/patient', label: 'Patient Triage', marathi: 'रुग्ण ट्रायज' },
  { path: '/chat', label: 'AI Chat', marathi: 'AI चॅट' },
]

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isVisible = useScrollDirection()

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2.5rem',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      position: 'sticky',
      top: 65, // Below header
      zIndex: 9,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isVisible ? 'translateY(0)' : 'translateY(-150%)'
    }}>
      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-evenly', gap: '1rem', flex: 1 }}>
        {NAV.map(item => {
          const active = location.pathname.startsWith(item.path) ||
            (item.path === '/home' && location.pathname === '/')
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                padding: '0.875rem 0',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transform: 'scale(1) translateY(0)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15) translateY(-8px)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{item.marathi}</span>
            </button>
          )
        })}
      </div>

    </nav>
  )
}

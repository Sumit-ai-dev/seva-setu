import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiFetch } from '../../lib/api'

const STARS = [1, 2, 3, 4, 5]

const CATEGORIES = [
  { id: 'ease', label: 'Ease of Use', emoji: '🖥️' },
  { id: 'data',  label: 'Data Accuracy', emoji: '📊' },
  { id: 'speed', label: 'Speed', emoji: '⚡' },
  { id: 'design', label: 'Design', emoji: '🎨' },
]

function StarRating({ value, onChange, size = 22 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {STARS.map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            fontSize: size, lineHeight: 1,
            color: s <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.12s, transform 0.12s',
            transform: s <= (hover || value) ? 'scale(1.18)' : 'scale(1)',
          }}
        >★</button>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   ReviewModal  –  fires on logout
────────────────────────────────────────────────────────── */
export function ReviewModal({ role, onSkip, onSubmit }) {
  const [overall, setOverall] = useState(0)
  const [cats, setCats] = useState({})
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [designation, setDesignation] = useState('')
  const [location, setLocation] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u.name || u.full_name) setUserName(u.name || u.full_name)
    } catch(e){}
  }, [])

  const roleName = role === 'tho' ? 'THO Command Dashboard' : 'ASHA Worker Dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    const review = { 
      role, overall, categories: cats, comment, 
      userName, designation, location,
      timestamp: new Date().toISOString(), source: 'modal' 
    }
    
    // Attempt database save
    try {
      await apiFetch('/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      })
    } catch(err) {
      console.warn('Backend review save failed, falling back to local storage', err)
    }

    // Local backup
    const prev = JSON.parse(localStorage.getItem('swasthya_reviews') || '[]')
    localStorage.setItem('swasthya_reviews', JSON.stringify([...prev, review]))
    
    setSubmitted(true)
    setTimeout(onSubmit, 1800)
  }

  return (
    <>
      <style>{`
        @keyframes rm-in { from { opacity:0; transform:translateY(24px) scale(0.97); } to { opacity:1; transform:none; } }
        .rm-textarea { resize: vertical; font-family: inherit; }
        .rm-textarea:focus { outline: none; border-color: #0F6E56; box-shadow: 0 0 0 3px rgba(15,110,86,0.12); }
        .rm-backdrop {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(14px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          overflow-y: auto;
        }
        .rm-card {
          background: #fff; border-radius: 1.5rem;
          padding: 2.5rem 2rem; max-width: 460px; width: 100%;
          box-shadow: 0 40px 80px rgba(0,0,0,0.35);
          animation: rm-in 0.28s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        .rm-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
        .rm-cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
        @media (max-width: 480px) {
          .rm-backdrop { align-items: flex-end; padding: 0; }
          .rm-card {
            border-radius: 1.5rem 1.5rem 0 0;
            max-height: 92dvh;
            overflow-y: auto;
            padding: 1.5rem 1.25rem 2rem;
          }
          .rm-two-col { grid-template-columns: 1fr; }
          .rm-cat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <div className="rm-backdrop">
        <div className="rm-card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🙏</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
                Thank you!
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Your feedback helps us improve Seva Setu for every ASHA worker and officer.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '0.625rem' }}>⭐</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
                  How was your experience?
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
                  Rate the <strong>{roleName}</strong> before you leave
                </p>
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</label>
                <input 
                  value={userName} onChange={e => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.75rem 1rem', borderRadius: 12,
                    border: '1.5px solid #e5e7eb',
                    fontSize: '0.875rem', color: '#111827',
                    background: '#f9fafb',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div className="rm-two-col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</label>
                  <input
                    value={designation} onChange={e => setDesignation(e.target.value)}
                    placeholder="e.g. Cardiologist"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', color: '#111827', background: '#f9fafb', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</label>
                  <input
                    value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', color: '#111827', background: '#f9fafb', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Overall */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Rating</span>
                <StarRating value={overall} onChange={setOverall} size={30} />
              </div>

              {/* Category ratings */}
              <div className="rm-cat-grid">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} style={{
                    background: '#f9fafb', borderRadius: 12,
                    padding: '0.75rem 0.875rem',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span>{cat.emoji}</span> {cat.label}
                    </div>
                    <StarRating value={cats[cat.id] || 0} onChange={v => setCats(p => ({ ...p, [cat.id]: v }))} size={16} />
                  </div>
                ))}
              </div>

              {/* Comment */}
              <textarea
                className="rm-textarea"
                placeholder="Any suggestions or comments? (optional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.75rem 1rem', borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  fontSize: '0.875rem', color: '#111827',
                  background: '#f9fafb',
                  marginBottom: '1.25rem',
                  transition: 'border-color 0.18s, box-shadow 0.18s',
                  fontFamily: 'inherit',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onSkip}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 12,
                    border: '1.5px solid #e5e7eb', background: '#f9fafb',
                    color: '#6b7280', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={overall === 0}
                  style={{
                    flex: 2, padding: '0.75rem', borderRadius: 12,
                    border: 'none', background: overall === 0 ? '#d1d5db' : '#0F6E56',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                    cursor: overall === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { if (overall > 0) e.currentTarget.style.background = '#0a5240' }}
                  onMouseLeave={e => { if (overall > 0) e.currentTarget.style.background = '#0F6E56' }}
                >
                  Submit Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────
   ReviewSection  –  always visible at bottom of dashboard
────────────────────────────────────────────────────────── */
export function ReviewSection({ role, isDark }) {
  const { user } = useAuth()
  const [overall, setOverall] = useState(0)
  const [cats, setCats] = useState({})
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [designation, setDesignation] = useState('')
  const [location, setLocation] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Only show for guest users
  if (!user?.guest) return null

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u.name || u.full_name) setUserName(u.name || u.full_name)
    } catch(e){}
  }, [])

  const bg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const bdr = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const textColor = isDark ? '#e2e8f0' : '#111827'
  const muteColor = isDark ? '#94a3b8' : '#6b7280'
  const inputBg  = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'
  const inputBdr = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'

  async function handleSubmit(e) {
    e.preventDefault()
    if (overall === 0) return
    const review = { 
      role, overall, categories: cats, comment, 
      userName, designation, location, 
      timestamp: new Date().toISOString(), source: 'inline' 
    }
    
    try {
      await apiFetch('/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      })
    } catch(err) {
      console.warn('Backend review save failed', err)
    }

    const prev = JSON.parse(localStorage.getItem('swasthya_reviews') || '[]')
    localStorage.setItem('swasthya_reviews', JSON.stringify([...prev, review]))
    setSubmitted(true)
  }

  return (
    <div className="shining-card" style={{
      margin: '0 0 2rem',
      padding: '1.75rem 2rem',
      borderRadius: 24,
      background: bg,
      border: `1px solid ${bdr}`,
      backdropFilter: 'blur(16px)',
      boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.05)' : '0 10px 30px rgba(15,110,86,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          50%, 100% { transform: translateX(150%) skewX(-25deg); }
        }
        .shining-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}, transparent);
          transform: translateX(-150%) skewX(-25deg);
          animation: sweep 4s infinite ease-in-out;
          pointer-events: none;
        }
        .shining-card:hover {
          border-color: rgba(16,185,129,0.4);
          box-shadow: ${isDark ? '0 25px 60px rgba(0,0,0,0.4), 0 0 30px rgba(16,185,129,0.15)' : '0 15px 40px rgba(15,110,86,0.12)'};
        }
        .rs-grid {
          display: grid;
          grid-template-columns: minmax(240px, 1.2fr) 2fr 2fr;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        .rs-cat-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 700px) {
          .rs-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .rs-cat-inner {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🙏</div>
          <p style={{ fontWeight: 700, color: textColor, fontSize: '1rem', margin: '0 0 0.25rem' }}>Thank you for your feedback!</p>
          <p style={{ color: muteColor, fontSize: '0.85rem', margin: 0 }}>Your review has been recorded and will help us improve.</p>
        </div>
      ) : (
        <>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                Rate Your Experience ⭐
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: muteColor }}>
                Help us improve Seva Setu — your feedback matters
              </p>
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: '#0F6E56',
              background: 'rgba(15,110,86,0.1)', padding: '3px 10px',
              borderRadius: 99, border: '1px solid rgba(15,110,86,0.2)',
            }}>
              स्वास्थ्य सेतु
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Feedback fields area */}
            <div className="rs-grid">
              
              {/* Column 1: Identity & Overall */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Name (ಹೆಸರು)</label>
                  <input 
                    value={userName} onChange={e => setUserName(e.target.value)}
                    placeholder="E.g. Priya Sharma"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '0.75rem 1rem', borderRadius: 12,
                      border: `1.5px solid ${inputBdr}`,
                      background: inputBg, color: textColor,
                      fontSize: '0.875rem', outline: 'none',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#0F6E56'}
                    onBlur={e => e.target.style.borderColor = inputBdr}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Designation</label>
                    <input 
                      value={designation} onChange={e => setDesignation(e.target.value)}
                      placeholder="E.g. Senior ASHA"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: 12, border: `1.5px solid ${inputBdr}`, background: inputBg, color: textColor, fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#0F6E56'} onBlur={e => e.target.style.borderColor = inputBdr}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location</label>
                    <input 
                      value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="E.g. Cuttack"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem', borderRadius: 12, border: `1.5px solid ${inputBdr}`, background: inputBg, color: textColor, fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#0F6E56'} onBlur={e => e.target.style.borderColor = inputBdr}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overall Impression (एकूण रेटिंग)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StarRating value={overall} onChange={setOverall} size={30} />
                    {overall > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800 }}>
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][overall]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Detailed Categories */}
              <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', padding: '1rem', borderRadius: 16, border: `1px solid ${inputBdr}` }}>
                <div className="rs-cat-inner">
                  {CATEGORIES.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{cat.emoji}</span> {cat.label}
                      </div>
                      <StarRating value={cats[cat.id] || 0} onChange={v => setCats(p => ({ ...p, [cat.id]: v }))} size={15} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggestions or Issues (सूचना)</label>
                <textarea
                  placeholder="Share your thoughts, suggestions, or any issues you faced…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', height: '100%', minHeight: 90,
                    padding: '0.75rem 1rem', borderRadius: 12,
                    border: `1.5px solid ${inputBdr}`,
                    background: inputBg, color: textColor,
                    fontSize: '0.875rem', resize: 'vertical',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F6E56'}
                  onBlur={e => e.target.style.borderColor = inputBdr}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={overall === 0}
              style={{
                padding: '0.7rem 2rem', borderRadius: 12,
                border: 'none',
                background: overall === 0 ? (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb') : '#0F6E56',
                color: overall === 0 ? muteColor : '#fff',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: overall === 0 ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (overall > 0) e.currentTarget.style.background = '#0a5240' }}
              onMouseLeave={e => { if (overall > 0) e.currentTarget.style.background = '#0F6E56' }}
            >
              Submit Feedback
            </button>
          </form>
        </>
      )}
    </div>
  )
}

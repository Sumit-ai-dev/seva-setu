import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function THOLoginPage() {
  const navigate = useNavigate()
  const { login, loginAsGuest } = useAuth()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(employeeId, password, 'tho')
      navigate('/dashboard/tho')
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestSignIn() {
    setLoading(true)
    setError('')
    try {
      await loginAsGuest('tho')
      navigate('/dashboard/tho')
    } catch (err) {
      setError('Guest sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .tho-login-page {
          min-height: 100dvh;
          background: linear-gradient(135deg, #0a5040 0%, #0F6E56 60%, #1a8a6e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: 'Inter', 'Noto Sans', sans-serif;
        }

        .tho-login-card {
          background: #fff;
          border-radius: 1.5rem;
          width: 100%;
          max-width: 440px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
        }

        .tho-login-header {
          background: linear-gradient(135deg, #0a5040, #0F6E56);
          padding: 2rem 1.5rem 1.75rem;
          text-align: center;
          color: #fff;
        }

        .tho-login-body {
          padding: 1.75rem 1.5rem 2rem;
        }

        .tho-field-wrap {
          position: relative;
          margin-bottom: 1rem;
        }

        .tho-field-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .tho-input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 2.75rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 1rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #f9fafb;
          box-sizing: border-box;
          min-height: 52px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .tho-input:focus {
          border-color: #0F6E56;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(15,110,86,0.12);
        }

        .tho-input::placeholder { color: #b0bec5; }

        .tho-eye-btn {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 0.25rem;
        }

        .tho-eye-btn:hover { color: #374151; }

        .tho-btn-primary {
          width: 100%;
          min-height: 52px;
          border-radius: 12px;
          background: #0F6E56;
          color: #fff;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
        }

        .tho-btn-primary:hover:not(:disabled) {
          background: #0a5040;
          box-shadow: 0 6px 20px rgba(15,110,86,0.35);
          transform: translateY(-1px);
        }

        .tho-btn-primary:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .tho-btn-guest {
          width: 100%;
          min-height: 52px;
          border-radius: 12px;
          background: #f8fafc;
          color: #0F6E56;
          border: 1.5px solid rgba(15,110,86,0.25);
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
        }

        .tho-btn-guest:hover:not(:disabled) {
          background: #eefaf6;
          box-shadow: 0 6px 20px rgba(15,110,86,0.12);
          transform: translateY(-1px);
        }

        .tho-btn-guest:disabled {
          color: #94a3b8;
          border-color: #e2e8f0;
          cursor: not-allowed;
        }

        .tho-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .tho-links {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          text-align: center;
        }

        .tho-link {
          font-size: 0.875rem;
          color: #0F6E56;
          font-weight: 600;
          text-decoration: none;
        }

        .tho-link-muted {
          font-size: 0.875rem;
          color: #9ca3af;
          text-decoration: none;
        }

        @media (max-width: 480px) {
          .tho-login-page {
            align-items: flex-end;
            padding: 0;
          }
          .tho-login-card {
            border-radius: 1.5rem 1.5rem 0 0;
            max-width: 100%;
            max-height: 95dvh;
            overflow-y: auto;
          }
          .tho-login-header {
            padding: 1.5rem 1.25rem 1.25rem;
          }
          .tho-login-body {
            padding: 1.25rem 1.25rem 2rem;
          }
        }
      `}</style>

      <div className="tho-login-page">
        <div className="tho-login-card">
          <div className="tho-login-header">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
              Taluka Health Officer Login
            </h1>
            <div style={{ fontWeight: 600, opacity: 0.85, fontSize: '0.9rem' }}>
              तालुका आरोग्य अधिकारी लॉगिन
            </div>
          </div>

          <div className="tho-login-body">
            {error && <div className="tho-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="tho-field-wrap">
                <span className="tho-field-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  className="tho-input"
                  type="text"
                  placeholder="Officer / Employee ID"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="tho-field-wrap">
                <span className="tho-field-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  className="tho-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="tho-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              <button type="submit" className="tho-btn-primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In / लॉगिन करा'}
              </button>

              <button
                type="button"
                className="tho-btn-guest"
                onClick={handleGuestSignIn}
                disabled={loading}
              >
                👤 Continue as Guest (THO Demo)
              </button>
            </form>

            <div className="tho-links">
              <Link to="/login/asha" className="tho-link">
                Are you an ASHA Worker? Login here →
              </Link>
              <Link to="/" className="tho-link-muted">
                ← Back to role selection
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

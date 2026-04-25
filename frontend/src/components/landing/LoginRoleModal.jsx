import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import loginImg2 from '../../images/login/asha_worker.avif';
import loginImg3 from '../../images/login/DMO_Worker.png';

const ROLES = [
  {
    id: 'asha',
    title: 'ASHA Worker',
    titleOdia: 'आशा कार्यकर्ती',
    icon: '🏥',
    image: loginImg2,
    description: 'Track village visits, log health data & support community care.',
    path: '/home',
    color: '#0F6E56',
    accent: '#6EE7B7',
  },
  {
    id: 'tho',
    title: 'Taluka Health Officer',
    titleOdia: 'तालुका आरोग्य अधिकारी',
    icon: '🏛️',
    image: loginImg3,
    description: 'Oversee district health metrics and coordinate response logistics.',
    path: '/dashboard/tho',
    color: '#0a5040',
    accent: '#34D399',
  },
];

/* ── SVG Illustrations rendered inline ── */
function HealthIllustration({ selectedRole }) {
  const img = selectedRole ? selectedRole.image : loginImg2;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Full-cover role image */}
      <img
        src={img}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          opacity: 0.9,
          transition: 'opacity 0.4s ease',
        }}
      />


      {/* Bottom vignette so brand text stays readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Floating icon badges */}
      <FloatingBadge top="12%" left="8%" icon="🩺" delay="0s" />
      <FloatingBadge top="22%" left="74%" icon="💊" delay="0.4s" />
      <FloatingBadge top="55%" left="78%" icon="❤️" delay="0.8s" />
      <FloatingBadge top="70%" left="6%" icon="📋" delay="1.2s" />
      <FloatingBadge top="38%" left="5%" icon="✚" delay="0.6s" />

      {/* Bottom brand text */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 2,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
          Nexus Health · स्वास्थ्य सेतु
        </div>
      </div>
    </div>
  );
}

function FloatingBadge({ top, left, icon, delay }) {
  return (
    <div style={{
      position: 'absolute',
      top,
      left,
      width: 44,
      height: 44,
      borderRadius: '12px',
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      animation: `lrm-float 4s ease-in-out ${delay} infinite`,
    }}>
      {icon}
    </div>
  );
}

const GUEST_CREDENTIALS = {
  asha: { id: 'ASHA-DEMO-001', password: 'guest1234' },
  tho:  { id: 'THO-DEMO-001',  password: 'guest1234' },
};

export default function LoginRoleModal({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [authEmployeeId, setAuthEmployeeId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  const [isWakingUp, setIsWakingUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    setIsWakingUp(false);

    // After 6 seconds, if still loading, suggest server is waking up
    const wakeUpTimer = setTimeout(() => {
      setIsWakingUp(true);
    }, 6000);

    try {
      await auth.login(authEmployeeId, authPassword, selected.id);
      clearTimeout(wakeUpTimer);
      navigate(selected.path);
    } catch (err) {
      clearTimeout(wakeUpTimer);
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
      setIsWakingUp(false);
    }
  };

  const handleGuestAccess = async () => {
    // If no role selected, show the role picker first
    if (!selected) {
      setShowGuestPicker(true);
      return;
    }
    await doGuestLogin(selected.id, selected.path);
  };

  const doGuestLogin = async (roleId, rolePath) => {
    setAuthError('');
    setAuthLoading(true);
    setShowGuestPicker(false);
    try {
      await auth.loginAsGuest(roleId);
      const path = rolePath || (roleId === 'tho' ? '/dashboard/tho' : '/home');
      navigate(path);
    } catch (err) {
      setAuthError(err.message || 'Guest sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes lrm-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        .lrm-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          overflow-y: auto;
          transition: opacity 0.28s ease;
        }

        .lrm-card {
          width: 100%;
          max-width: 840px;
          min-height: 520px;
          border-radius: 1.75rem;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease;
          font-family: 'Inter', 'Noto Sans', sans-serif;
          display: flex;
        }

        .lrm-left-panel {
          flex: 0 0 42%;
          position: relative;
          min-height: 520px;
        }

        .lrm-right-panel {
          flex: 1;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.75rem 2.5rem;
          position: relative;
          overflow-y: auto;
        }

        .lrm-role-chips {
          display: flex;
          gap: 0.625rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }

        .lrm-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 0.625rem 1rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: #f9fafb;
          cursor: pointer;
          transition: all 0.18s ease;
          min-width: 88px;
          font-family: 'Inter', sans-serif;
        }

        .lrm-chip:hover {
          border-color: #0F6E56;
          background: #f0fdf8;
        }

        .lrm-chip.active {
          border-color: #0F6E56;
          background: #0F6E56;
        }

        .lrm-chip .chip-icon {
          font-size: 1.375rem;
        }

        .lrm-chip .chip-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b7280;
          text-align: center;
          letter-spacing: 0.01em;
        }

        .lrm-chip.active .chip-label {
          color: #ffffff;
        }

        .lrm-field-wrap {
          position: relative;
          margin-bottom: 0.875rem;
        }

        .lrm-field-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .lrm-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          outline: none;
          font-size: 0.9375rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #f9fafb;
          box-sizing: border-box;
          min-height: 50px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .lrm-input::placeholder {
          color: #b0bec5;
        }

        .lrm-input:focus {
          border-color: #0F6E56;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(15,110,86,0.12);
        }

        .lrm-eye-btn {
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
          min-height: unset;
        }

        .lrm-eye-btn:hover { color: #374151; }

        .lrm-submit-btn {
          width: 100%;
          min-height: 50px;
          border-radius: 12px;
          background: #0F6E56;
          color: #fff;
          border: none;
          font-size: 0.9375rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
        }

        .lrm-submit-btn:hover:not(:disabled) {
          background: #0a5240;
          box-shadow: 0 6px 20px rgba(15,110,86,0.35);
          transform: translateY(-1px);
        }

        .lrm-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .lrm-submit-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .lrm-guest-btn {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          background: #f8fafc;
          color: #0F6E56;
          border: 1.5px solid rgba(15,110,86,0.22);
          font-size: 0.9375rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
        }

        .lrm-guest-btn:hover:not(:disabled) {
          background: #eefaf6;
          box-shadow: 0 6px 20px rgba(15,110,86,0.12);
          transform: translateY(-1px);
        }

        .lrm-guest-btn:disabled {
          color: #94a3b8;
          border-color: #e2e8f0;
          background: #f8fafc;
          cursor: not-allowed;
        }

        .lrm-close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          min-height: unset;
          z-index: 5;
        }

        .lrm-close-btn:hover {
          background: #e5e7eb;
          color: #111827;
        }

        @media (max-width: 600px) {
          .lrm-backdrop {
            align-items: flex-end;
            padding: 0;
          }
          .lrm-card {
            flex-direction: column;
            min-height: auto;
            border-radius: 1.5rem 1.5rem 0 0;
            max-width: 100%;
            max-height: 92dvh;
            overflow-y: auto;
          }
          .lrm-left-panel { display: none; }
          .lrm-right-panel {
            padding: 1.5rem 1.25rem 2rem;
          }
          .lrm-chip {
            min-width: 0;
            flex: 1;
            padding: 0.75rem 0.5rem;
          }
          .lrm-role-chips {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
          }
          .lrm-input {
            font-size: 1rem;
            min-height: 52px;
          }
          .lrm-submit-btn, .lrm-guest-btn {
            min-height: 52px;
            font-size: 1rem;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="lrm-backdrop"
        onClick={handleClose}
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {/* Card */}
        <div
          className="lrm-card"
          onClick={e => e.stopPropagation()}
          style={{
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.96)',
            opacity: mounted ? 1 : 0,
          }}
        >
          {/* ══ LEFT: Illustration panel ══ */}
          <div className="lrm-left-panel">
            <HealthIllustration selectedRole={selected} />
          </div>

          {/* ══ RIGHT: Form panel ══ */}
          <div className="lrm-right-panel">
            {/* Close button */}
            <button className="lrm-close-btn" onClick={handleClose} aria-label="Close">✕</button>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#111827',
                letterSpacing: '-0.04em',
                margin: '0 0 0.3rem',
                fontFamily: 'Inter, sans-serif',
              }}>
                Welcome Back!
              </h1>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                परत स्वागत आहे
              </p>
            </div>

            {/* Role selector chips */}
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '0.625rem', fontFamily: 'Inter, sans-serif' }}>
                Select User Type *
              </label>
              <div className="lrm-role-chips">
                {ROLES.map(role => (
                  <button
                    key={role.id}
                    className={`lrm-chip${selected?.id === role.id ? ' active' : ''}`}
                    onClick={() => { setSelected(role); setAuthError(''); }}
                    type="button"
                    title={role.titleOdia}
                  >
                    <span className="chip-icon">{role.icon}</span>
                    <span className="chip-label">{role.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '1.25rem' }} />

            {/* Login form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              {authError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {authError}
                </div>
              )}

              {/* Employee ID field */}
              <div className="lrm-field-wrap">
                <span className="lrm-field-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  className="lrm-input"
                  type="text"
                  placeholder="Enter Your Employee / Officer ID"
                  value={authEmployeeId}
                  onChange={e => setAuthEmployeeId(e.target.value)}
                  required
                  disabled={!selected}
                />
              </div>

              {/* Password field */}
              <div className="lrm-field-wrap">
                <span className="lrm-field-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  className="lrm-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Your Password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  required
                  disabled={!selected}
                />
                <button
                  type="button"
                  className="lrm-eye-btn"
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

              {/* Hint if no role selected */}
              {!selected && (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
                  ↑ Please select your role above to continue
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="lrm-submit-btn"
                disabled={authLoading || !selected}
              >
                {authLoading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'lrm-spin 0.7s linear infinite' }} />
                    {isWakingUp ? 'Wait, server is waking up...' : 'Signing in…'}
                  </>
                ) : (
                  <>
                    Continue
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                className="lrm-guest-btn"
                onClick={handleGuestAccess}
                disabled={authLoading}
              >
                👤 Continue as Guest
              </button>
            </form>

            {/* Footer note */}
            <p style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#9ca3af',
              fontFamily: 'Inter, sans-serif',
            }}>
              Authorised personnel only ·{' '}
              <span style={{ color: '#0F6E56', fontWeight: 600 }}>स्वास्थ्य सेतु</span>
            </p>
          </div>
        </div>
      </div>

      {/* ══ Guest Role Picker Overlay ══ */}
      {showGuestPicker && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(0px, 4vw, 1rem)',
            animation: 'lrm-fadein 0.22s ease',
          }}
          onClick={() => setShowGuestPicker(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '1.5rem',
              padding: 'clamp(1.25rem, 5vw, 2.5rem) clamp(1rem, 5vw, 2rem)',
              maxWidth: 420,
              width: '100%',
              maxHeight: '90dvh',
              overflowY: 'auto',
              boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
              fontFamily: 'Inter, sans-serif',
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
                minHeight: 'unset',
              }}
            >✕</button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👤</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', letterSpacing: '-0.03em' }}>
                Continue as Guest
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Choose your role to explore with demo data
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => doGuestLogin(role.id, role.path)}
                  disabled={authLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.125rem 1.25rem',
                    borderRadius: '14px',
                    border: '1.5px solid #e5e7eb',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left',
                    fontFamily: 'Inter, sans-serif',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `1.5px solid ${role.color}`;
                    e.currentTarget.style.background = '#f0fdf8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = '1.5px solid #e5e7eb';
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '0.1rem' }}>
                      {role.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {role.description}
                    </div>
                  </div>
                  <span style={{ color: role.color, fontSize: '1.1rem', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>

            {/* Demo data notice */}
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

      {/* Spinner + fadein keyframes */}
      <style>{`
        @keyframes lrm-spin { to { transform: rotate(360deg); } }
        @keyframes lrm-fadein { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </>
  );
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginRoleModal from '../../components/landing/LoginRoleModal'
import { apiFetch } from '../../lib/api'
import { GUEST_REVIEWS } from '../../lib/guestDemoData'

import logoSrc from '../../images/logo/logo.jpg'
import img1 from '../../images/landing/hero1.jpg'
import img2 from '../../images/landing/hero2.jpg'

import sumitPic from '../../images/landing/sumit.jpg'

const ArrowRight = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" /></svg>
const PlayCircle = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinejoin="round" d="m10 8 6 4-6 4z" /></svg>
const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export default function LandingPage() {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const heroImages = [img1, img2]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length)
    }, 22800)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log("[LandingPage] Fetching reviews from API...")
        const response = await apiFetch('/reviews/')
        if (response.ok) {
          const data = await response.json()
          console.log(`[LandingPage] Successfully fetched ${data.length} reviews.`)
          if (data && data.length > 0) {
            setReviews(data)
          } else {
            console.log("[LandingPage] API returned empty reviews. Using fallback.")
            setReviews(GUEST_REVIEWS)
          }
        } else {
          console.warn(`[LandingPage] API failed with status ${response.status}. Using fallback.`)
          setReviews(GUEST_REVIEWS)
        }
      } catch (error) {
        console.error("[LandingPage] Failed to fetch reviews:", error)
        setReviews(GUEST_REVIEWS)
      } finally {
        setReviewsLoading(false)
      }
    }
    fetchReviews()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    document.querySelectorAll('.observe-anim:not(.is-visible)').forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [reviews, mounted])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    setMounted(true)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className={`page-fade-in ${mounted ? 'is-mounted' : ''}`} style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Noto Sans', sans-serif" }}>

      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: isScrolled ? '#080c16' : 'transparent',
          boxShadow: isScrolled ? '0 1px 0 rgba(255,255,255,0.08)' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
        className="landing-nav"
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 5%', maxWidth: 1600, margin: '0 auto', width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.65rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            <img src={logoSrc} alt="Nexus Health" width={44} height={44} style={{ borderRadius: 11, objectFit: 'cover', display: 'block' }} />
            Nexus Health
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.9375rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }} className="hide-mobile">
            <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>About Us</a>
            <a href="#goal" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>Services</a>
            <a href="#reviews" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>Reviews</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowLoginModal(true)}
              className="landing-login-btn"
              style={{ padding: '0.625rem 1.5rem', borderRadius: 99, border: '1.5px solid rgba(45,143,94,0.8)', background: 'transparent', color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,143,94,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }} className="hero-section">
        {[img1, img2].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              opacity: currentImageIndex % 2 === i ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 0
            }}
          />
        ))}

        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.2) 100%)'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '8rem 5% 5rem' }} className="hero-left-content">
          <h1
            className="observe-anim animate-fade-up delay-150 hero-heading"
            style={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '2.5rem', maxWidth: 700, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            We are here to help<br />you stay healthy.
          </h1>

          <button
            onClick={() => setShowLoginModal(true)}
            className="observe-anim animate-fade-up delay-300 hero-cta"
            style={{ padding: '1.25rem 2.5rem', borderRadius: 99, background: 'var(--primary)', color: '#fff', fontSize: '1.125rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.2s', boxShadow: '0 12px 32px rgba(13,148,136,0.35)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Make an appointment
          </button>
        </div>
      </div>

      <div id="goal" style={{ padding: '8rem 4%', background: '#0b0914', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <span style={{ color: 'var(--primary)' }}>✦</span> What we offer
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Built for rural India</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>
            {/* Card 1 */}
            <div className="observe-anim animate-fade-up-card delay-c0" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <polyline points="0,60 40,60 55,30 75,90 90,60 130,60 140,45 155,60 200,60" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="75" cy="90" r="2.5" fill="#fff" filter="drop-shadow(0 0 6px #fff)" />
                  <circle cx="55" cy="30" r="2" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Delivering seamless<br />experiences</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Make it easy and comfortable just for you.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="observe-anim animate-fade-up-card delay-c200" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <path d="M 20,20 Q 60,80 100,50 T 180,80" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="100" cy="50" r="3" fill="#fff" filter="drop-shadow(0 0 6px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Orchestrating<br />unified frameworks</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Unifying people and technology across Odisha.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="observe-anim animate-fade-up-card delay-c400" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <circle cx="100" cy="50" r="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
                  <path d="M 94,35 h 12 v 10 h 10 v 10 h -10 v 10 h -12 v -10 h -10 v -10 h 10 z" fill="#fff" filter="drop-shadow(0 0 8px #fff)" opacity="0.9" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Compounding<br />partnership gains</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Do good for people. We serve with heart to impact what matters most.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="about" style={{ padding: '8rem 4%', background: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.03em' }}>Meet the founder</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {[
              { src: sumitPic, name: 'Sumit Das', role: 'Open Source Developer | AI + Cybersecurity Builder', bio: 'Specializing in AI engineering and system architecture, Sumit built this platform to bring advanced healthcare solutions to remote areas.', quote: `"Bridging the healthcare gap in rural India with intelligent digital infrastructure."`, grad: 'linear-gradient(135deg, #112822 0%, #0a1713 100%)' }
            ].map(({ src, name, role, bio, quote, grad }, index) => (
              <div
                key={name}
                className="observe-anim animate-fade-up"
                style={{
                  background: '#fff',
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  transitionDelay: `${index * 150}ms`
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                </div>
                <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>{name}</h3>
                  <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 400, marginBottom: '1rem' }}>{role}</p>
                  <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6, fontWeight: 400 }}>{bio}</p>
                </div>
                <div style={{ padding: '2rem 2.5rem', background: grad, color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', color: '#f1f5f9', fontWeight: 400, margin: 0 }}>{quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="reviews" style={{ padding: '8rem 4%', background: '#0b0914', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '40%', height: '60%', background: 'radial-gradient(circle, rgba(45,143,94,0.1) 0%, transparent 70%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '30%', height: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', zIndex: 1 }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2rem' }}>
              <span style={{ color: 'var(--primary)' }}>★</span> Wall of Love
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Voices from the Field</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem' }}>
            {reviewsLoading ? (
               <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                 <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                 <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Fetching newest reviews...</p>
                 <style>{`
                   @keyframes spin { to { transform: rotate(360deg); } }
                 `}</style>
               </div>
            ) : reviews.length > 0 ? (
              reviews.map((review, i) => (
                <div
                  key={review.id || i}
                  className="observe-anim animate-fade-up"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 24,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[...Array(5)].map((_, idx) => (
                      <StarIcon key={idx} filled={idx < (review.overall || 5)} />
                    ))}
                  </div>

                  <p style={{ color: '#ffffff', fontSize: '1.0625rem', lineHeight: 1.6, flex: 1, fontStyle: 'italic' }}>
                    "{review.comment}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 700, color: '#fff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      {(review.userName || 'U')[0]}
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{review.userName || 'Anonymous'}</h4>
                      <p style={{ color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontSize: '0.875rem' }}>
                        {review.designation || (review.role === 'asha' ? 'ASHA Worker' : 'Medical Officer')}
                        {review.location ? ` • ${review.location}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 24 }}>
                No reviews yet. Be the first to share your experience!
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{ background: '#080c16', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '60px 4% 40px', color: '#94a3b8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', marginBottom: '4rem' }}>
          <div style={{ flex: '2 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              Nexus Health
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '2rem', maxWidth: 300, color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 400 }}>Bridging the healthcare gap in rural India with intelligent digital infrastructure.</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 Nexus Health.</div>
          <div>Designed for Rural Health.</div>
        </div>
      </footer>

      {showLoginModal && <LoginRoleModal onClose={() => setShowLoginModal(false)} />}

      <style>{`
        .page-fade-in { opacity: 0; transition: opacity 400ms ease; }
        .page-fade-in.is-mounted { opacity: 1; }
        .animate-fade-up { opacity: 0; transform: translateY(48px); will-change: opacity, transform; }
        .animate-fade-up.is-visible { opacity: 1; transform: translateY(0); transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1); }
        .hero-heading { font-size: clamp(2.5rem, 8vw, 4.5rem); }
        @media (max-width: 900px) { .hide-mobile { display: none !important; } }
      `}</style>
    </div>
  )
}

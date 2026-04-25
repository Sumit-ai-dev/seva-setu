import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import ashaWorkerImg from '../../images/login/asha_worker.avif';
import thoWorkerImg from '../../images/login/DMO_Worker.png';

const slides = [
  {
    id: 'asha',
    role: 'ASHA Worker',
    roleOdia: 'आशा कार्यकर्ती',
    tagline: 'Community Health Champion',
    description: 'Track home visits, log patient data, and coordinate care for your village clusters — all from one place.',
    cta: 'Sign in as ASHA Worker',
    path: '/login/asha',
    image: ashaWorkerImg,
    gradient: 'linear-gradient(135deg, #0d4f8c 0%, #1a7fc4 50%, #29a0e0 100%)',
    overlay: 'linear-gradient(to right, rgba(8,40,90,0.96) 0%, rgba(8,40,90,0.78) 50%, rgba(8,40,90,0.18) 100%)',
    accent: '#7dd3fc',
    badge: '🏥',
  },
  {
    id: 'tho',
    role: 'Taluka Health Officer',
    roleOdia: 'तालुका आरोग्य अधिकारी',
    tagline: 'District-Wide Health Command',
    description: 'Monitor district health metrics, approve escalations, and coordinate multi-village response logistics.',
    cta: 'Sign in as Taluka Health Officer',
    path: '/login/tho',
    image: thoWorkerImg,
    gradient: 'linear-gradient(135deg, #075a5a 0%, #0e8f8f 50%, #17b5b5 100%)',
    overlay: 'linear-gradient(to right, rgba(4,50,50,0.96) 0%, rgba(4,50,50,0.78) 50%, rgba(4,50,50,0.18) 100%)',
    accent: '#99f6e4',
    badge: '🏛️',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [direction, setDirection] = useState('next');
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const goTo = useCallback((idx, dir = 'next') => {
    if (animating || idx === current) return;
    setDirection(dir);
    setPrev(current);
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => {
      setPrev(null);
      setAnimating(false);
    }, 600);
  }, [animating, current]);

  const next = useCallback(() => goTo((current + 1) % slides.length, 'next'), [current, goTo]);
  const prev_ = useCallback(() => goTo((current - 1 + slides.length) % slides.length, 'prev'), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next, paused]);

  const slide = slides[current];

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '0 1.5rem', marginBottom: '3rem' }}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          width: '100%',
          maxWidth: '900px',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          position: 'relative',
          background: '#0d1117',
        }}
      >
        {/* ── Slides ── */}
        <div style={{ position: 'relative', height: '420px' }}>
          {slides.map((s, i) => {
            const isActive = i === current;
            const isPrev = i === prev;
            return (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transform: isActive
                    ? 'translateX(0) scale(1)'
                    : isPrev
                      ? `translateX(${direction === 'next' ? '-4%' : '4%'}) scale(0.98)`
                      : `translateX(${direction === 'next' ? '4%' : '-4%'}) scale(0.98)`,
                  transition: 'opacity 0.6s ease, transform 0.6s ease',
                  zIndex: isActive ? 2 : 1,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                {/* Background gradient */}
                <div style={{ position: 'absolute', inset: 0, background: s.gradient }} />

                {/* Photo — right side, fading out left */}
                <img
                  src={s.image}
                  alt={s.role}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '55%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    opacity: 0.55,
                  }}
                />

                {/* Gradient overlay for text readability */}
                <div style={{ position: 'absolute', inset: 0, background: s.overlay }} />

                {/* ── Content ── */}
                <div style={{
                  position: 'relative',
                  zIndex: 3,
                  padding: '2.75rem 3rem',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  maxWidth: '58%',
                }}>
                  {/* Badge + tagline */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${s.accent}44`,
                    borderRadius: '99px',
                    padding: '0.375rem 1rem',
                    color: s.accent,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    width: 'fit-content',
                    marginBottom: '1.25rem',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{s.badge}</span>
                    {s.tagline}
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                    fontWeight: 900,
                    color: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    marginBottom: '0.375rem',
                  }}>
                    {s.role}
                  </h2>

                  {/* Marathi subtitle */}
                  <div style={{
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                    fontSize: '1rem',
                    color: s.accent,
                    fontWeight: 600,
                    marginBottom: '1.125rem',
                    opacity: 0.9,
                  }}>
                    {s.roleOdia}
                  </div>

                  {/* Description */}
                  <p style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.65,
                    marginBottom: '2rem',
                    maxWidth: '340px',
                  }}>
                    {s.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate(s.path)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: s.accent,
                      color: '#0a1929',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      border: 'none',
                      borderRadius: '99px',
                      padding: '0.8rem 1.75rem',
                      cursor: 'pointer',
                      width: 'fit-content',
                      letterSpacing: '-0.01em',
                      boxShadow: `0 4px 20px ${s.accent}55`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 8px 28px ${s.accent}77`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}55`;
                    }}
                  >
                    {s.cta}
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom bar: dots + counter ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.75rem',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                aria-label={`Go to ${s.role}`}
                style={{
                  width: i === current ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '99px',
                  border: 'none',
                  background: i === current ? slides[current].accent : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: i === current ? `0 0 8px ${slides[current].accent}88` : 'none',
                }}
              />
            ))}
          </div>

          {/* Slide counter + arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', fontWeight: 600 }}>
              {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
            <button
              onClick={prev_}
              aria-label="Previous slide"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >‹</button>
            <button
              onClick={next}
              aria-label="Next slide"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >›</button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div
            key={`${current}-${paused}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: slide.accent,
              borderRadius: '0 2px 2px 0',
              animation: paused ? 'none' : 'slideProgress 5s linear forwards',
            }}
          />
        </div>

        <style>{`
          @keyframes slideProgress {
            from { width: 0%; }
            to { width: 100%; }
          }
          @media (max-width: 640px) {
            .hero-slider-content { max-width: 80% !important; padding: 1.75rem !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

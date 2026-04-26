import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../images/logo/logo.jpg'
import heroImg from '../../images/landing/impact_hero.png'
import s1Img from '../../images/landing/success1.png'
import s2Img from '../../images/landing/success2.png'
import communityImg from '../../images/landing/community.png'

/* ─── CountUp helper ─── */
function CountUp({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const step = end / (duration / 16)
        let cur = 0
        const id = setInterval(() => {
          cur += step
          if (cur >= end) { setCount(end); clearInterval(id) }
          else setCount(Math.floor(cur))
        }, 16)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Stats Data ─── */
const STATS = [
  { icon: '👥', num: 44, suffix: 'M+', label: 'Beneficiaries Registered' },
  { icon: '🔍', num: 41, suffix: 'M+', label: 'Beneficiaries Screened' },
  { icon: '👩‍⚕️', num: 15000, suffix: '+', label: 'Health Workers Empowered' },
  { icon: '🏥', num: 500, suffix: '+', label: 'Emergency Cases Flagged' },
  { icon: '📊', num: 100, suffix: 'K+', label: 'Digital Health Records Created' },
  { icon: '🗺️', num: 31, suffix: '', label: 'Districts Covered in Karnataka' },
  { icon: '🤖', num: 2, suffix: '', label: 'AI Models for Consensus Triage' },
  { icon: '🗣️', num: 3, suffix: '', label: 'Languages Supported' },
  { icon: '⚡', num: 50, suffix: 'M', label: 'Hours Saved from Paper Registers' },
  { icon: '📱', num: 10, suffix: '+', label: 'Registers Replaced Digitally' },
]

/* ─── Journey Steps ─── */
const STEPS = [
  { num: 1, icon: '📱', title: 'Platform Development', desc: 'Build a resilient, offline-first digital health platform with voice input, multilingual support, and dual-AI triage capabilities.' },
  { num: 2, icon: '🏘️', title: 'Community Deployment', desc: 'Deploy the platform to ASHA workers in rural Karnataka, providing training and on-ground support for seamless adoption.' },
  { num: 3, icon: '📋', title: 'Data Collection & Screening', desc: 'ASHA workers register beneficiaries, log symptoms via voice, and the AI engine performs real-time severity classification.' },
  { num: 4, icon: '🔬', title: 'Evidence Generation & Validation', desc: 'Cross-validate AI triage results using dual-model consensus (Gemini + HuggingFace) to ensure accuracy and reduce misdiagnosis.' },
  { num: 5, icon: '📊', title: 'Data-Driven Decision Making', desc: 'Health officers access real-time dashboards, disease heatmaps, and priority-sorted patient feeds for rapid response.' },
  { num: 6, icon: '🛡️', title: 'Health System Strengthening', desc: 'Integrate insights back into the public health system — enabling policy changes, outbreak detection, and resource allocation.' },
  { num: 7, icon: '🔄', title: 'Scale & Replication', desc: 'Replicate data-driven interventions across new districts and states, adapting the platform for diverse healthcare contexts.' },
]

export default function ImpactPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    window.scrollTo(0, 0)
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ip-visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    document.querySelectorAll('.ip-anim:not(.ip-visible)').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [mounted])

  return (
    <div className={`ip-root ${mounted ? 'ip-mounted' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
        .ip-root { opacity:0; transition:opacity .5s; font-family:'Inter',sans-serif; background:#fff; }
        .ip-root.ip-mounted { opacity:1; }
        .ip-anim { opacity:0; transform:translateY(35px); }
        .ip-anim.ip-visible { opacity:1; transform:translateY(0); transition:all .8s cubic-bezier(.16,1,.3,1); }
        .ip-d1 { transition-delay:.1s; } .ip-d2 { transition-delay:.2s; } .ip-d3 { transition-delay:.3s; }
        .ip-d4 { transition-delay:.4s; } .ip-d5 { transition-delay:.5s; }

        /* Hero */
        .ip-hero { position:relative; min-height:75vh; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .ip-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:brightness(.45); }
        .ip-hero-content { position:relative; z-index:2; text-align:center; color:#fff; padding:0 5%; }
        .ip-hero h1 { font-family:'Playfair Display',serif; font-size:clamp(2.5rem,7vw,4.5rem); font-weight:800; letter-spacing:.06em; text-transform:uppercase; margin:0 0 1.5rem; }
        .ip-hero p { font-size:clamp(1rem,2.5vw,1.25rem); max-width:700px; margin:0 auto; line-height:1.7; color:rgba(255,255,255,.85); }

        /* Stats Section — "We Do This By" */
        .ip-stats-section { padding:5rem 5%; background:#fff; }
        .ip-stats-header { text-align:center; margin-bottom:4rem; }
        .ip-stats-header h2 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:800; color:#1a1a1a; text-transform:uppercase; letter-spacing:.05em; margin:0 0 1rem; }
        .ip-stats-header p { color:#666; font-size:1.05rem; max-width:700px; margin:0 auto; line-height:1.6; }
        .ip-stats-grid { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:repeat(5,1fr); gap:2rem; }
        .ip-stat-card { text-align:center; padding:2rem 1rem; border-radius:16px; border:1px solid #f0f0f0; background:#fafaf8; transition:all .3s; }
        .ip-stat-card:hover { transform:translateY(-6px); box-shadow:0 16px 32px rgba(0,0,0,.06); border-color:#d1fae5; }
        .ip-stat-icon { width:56px; height:56px; margin:0 auto 1rem; display:flex; align-items:center; justify-content:center; background:#e6f7f1; border-radius:50%; font-size:1.5rem; }
        .ip-stat-num { font-family:'Playfair Display',serif; font-size:1.75rem; font-weight:800; color:#0d9488; }
        .ip-stat-label { font-size:.8rem; color:#888; margin-top:.5rem; font-weight:500; }

        /* Journey Section — "Here is How We Do It" */
        .ip-journey { padding:6rem 5%; background:#fafaf8; }
        .ip-journey-header { text-align:center; margin-bottom:5rem; }
        .ip-journey-header h2 { font-family:'Playfair Display',serif; font-size:2rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#111; margin:0 0 1rem; }
        .ip-journey-header p { color:#666; font-size:1.05rem; max-width:650px; margin:0 auto; line-height:1.6; }
        .ip-journey-track { max-width:900px; margin:0 auto; position:relative; }
        .ip-journey-track::before { content:''; position:absolute; left:50%; top:0; bottom:0; width:3px; background:linear-gradient(to bottom,#0d9488,#10b981); transform:translateX(-50%); border-radius:3px; }
        .ip-step { display:flex; align-items:flex-start; gap:3rem; margin-bottom:4rem; position:relative; }
        .ip-step:nth-child(even) { flex-direction:row-reverse; text-align:right; }
        .ip-step-circle { flex-shrink:0; width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#0d9488,#10b981); display:flex; align-items:center; justify-content:center; font-size:1.8rem; color:#fff; position:relative; z-index:2; box-shadow:0 8px 24px rgba(13,148,136,.3); border:4px solid #fff; }
        .ip-step-body { flex:1; max-width:340px; }
        .ip-step-num { font-size:.75rem; font-weight:700; color:#0d9488; text-transform:uppercase; letter-spacing:.1em; margin-bottom:.25rem; }
        .ip-step-body h3 { font-size:1.15rem; font-weight:700; color:#111; margin:0 0 .5rem; }
        .ip-step-body p { font-size:.9rem; color:#666; line-height:1.6; margin:0; }

        /* Success Stories */
        .ip-success { padding:6rem 5%; background:#fff; }
        .ip-success h2 { text-align:center; font-family:'Playfair Display',serif; font-size:2rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#111; margin:0 0 4rem; }
        .ip-success-grid { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
        .ip-success-card { border-radius:20px; overflow:hidden; position:relative; aspect-ratio:4/3; cursor:pointer; }
        .ip-success-card img { width:100%; height:100%; object-fit:cover; transition:transform .5s; }
        .ip-success-card:hover img { transform:scale(1.08); }
        .ip-success-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%); display:flex; align-items:flex-end; padding:1.5rem; }
        .ip-success-overlay span { color:#fff; font-weight:600; font-size:1rem; }

        /* CTA Banner */
        .ip-cta { padding:5rem 5%; background:linear-gradient(135deg,#0d9488,#065f46); text-align:center; }
        .ip-cta h2 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.5rem); font-weight:800; color:#fff; margin:0 0 1rem; }
        .ip-cta p { color:rgba(255,255,255,.8); font-size:1.05rem; max-width:500px; margin:0 auto 2rem; line-height:1.6; }
        .ip-cta-btn { padding:1rem 2.5rem; border-radius:12px; background:#fff; color:#0d9488; font-weight:700; font-size:1rem; border:none; cursor:pointer; transition:all .25s; box-shadow:0 8px 28px rgba(0,0,0,.15); }
        .ip-cta-btn:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(0,0,0,.2); }

        @media(max-width:900px) {
          .ip-stats-grid { grid-template-columns:repeat(2,1fr); }
          .ip-success-grid { grid-template-columns:1fr; max-width:400px; }
          .ip-journey-track::before { left:36px; }
          .ip-step, .ip-step:nth-child(even) { flex-direction:row; text-align:left; }
          .ip-step-body { max-width:100%; }
        }
        @media(max-width:600px) {
          .ip-stats-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: isScrolled ? 'rgba(255,255,255,.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        boxShadow: isScrolled ? '0 1px 10px rgba(0,0,0,.05)' : 'none',
        transition:'all .3s',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 5%', maxWidth:1400, margin:'0 auto' }}>
          <div onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'.75rem', fontWeight:800, fontSize:'1.5rem', color: isScrolled ? '#111' : '#fff', letterSpacing:'-.02em', cursor:'pointer' }}>
            <img src={logoSrc} alt="Seva Setu" width={40} height={40} style={{ borderRadius:10, objectFit:'cover' }} />
            Seva Setu
          </div>
          <div style={{ display:'flex', gap:'2rem', fontSize:'.9rem', fontWeight:500, color: isScrolled ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.8)' }}>
            <a onClick={() => navigate('/')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Home</a>
            <a onClick={() => navigate('/our-work')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Our Work</a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="ip-hero">
        <img src={heroImg} alt="" className="ip-hero-img" />
        <div className="ip-hero-content">
          <h1 className="ip-anim">Our Impact</h1>
          <p className="ip-anim ip-d1">
            We measure impact by the lives we touch — empowering ASHA workers, strengthening health systems, and building a data-driven continuum of care across rural India.
          </p>
        </div>
      </section>

      {/* ─── STATS: WE DO THIS BY ─── */}
      <section className="ip-stats-section">
        <div className="ip-stats-header ip-anim">
          <h2>We Do This By</h2>
          <p>Measuring the accuracy of reported data and establishing a mixed-methods process for longitudinal evaluation and independent validation.</p>
        </div>
        <div className="ip-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className={`ip-stat-card ip-anim ip-d${(i % 5) + 1}`}>
              <div className="ip-stat-icon">{s.icon}</div>
              <div className="ip-stat-num"><CountUp end={s.num} suffix={s.suffix} /></div>
              <div className="ip-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── JOURNEY: HERE IS HOW WE DO IT ─── */}
      <section className="ip-journey">
        <div className="ip-journey-header ip-anim">
          <h2>Here Is How We Do It</h2>
          <p>Our impact journey is understood in seven stages, from the development of a functional digital health platform to the replication of data-driven interventions.</p>
        </div>
        <div className="ip-journey-track">
          {STEPS.map((s, i) => (
            <div key={i} className={`ip-step ip-anim ip-d${(i % 3) + 1}`}>
              <div className="ip-step-circle">{s.icon}</div>
              <div className="ip-step-body">
                <div className="ip-step-num">Step {s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SUCCESS STORIES ─── */}
      <section className="ip-success">
        <h2 className="ip-anim">Success Stories</h2>
        <div className="ip-success-grid">
          {[
            { img: s1Img, label: 'Early Detection Saves a Child' },
            { img: s2Img, label: 'Digital Health for Elderly Care' },
            { img: communityImg, label: 'Community Health Camps' },
          ].map((s, i) => (
            <div key={i} className={`ip-success-card ip-anim ip-d${i + 1}`}>
              <img src={s.img} alt={s.label} />
              <div className="ip-success-overlay">
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="ip-cta">
        <h2 className="ip-anim">Join Our Mission</h2>
        <p className="ip-anim ip-d1">Help us bridge the healthcare gap in rural India. Every data point saves a life.</p>
        <button onClick={() => navigate('/')} className="ip-cta-btn ip-anim ip-d2">Get Started →</button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background:'#080c16', padding:'4rem 5%', color:'#94a3b8', textAlign:'center' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ fontWeight:800, fontSize:'1.5rem', color:'#fff', marginBottom:'1rem' }}>Seva Setu</div>
          <p style={{ maxWidth:400, margin:'0 auto 2rem', fontSize:'.9rem' }}>Bridging the healthcare gap in rural India with AI-powered triage intelligence.</p>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:'2rem', fontSize:'.8rem' }}>
            © 2026 Seva Setu. Built at Scaler Hackathon.
          </div>
        </div>
      </footer>
    </div>
  )
}

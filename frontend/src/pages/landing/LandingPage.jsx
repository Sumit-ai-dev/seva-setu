import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginRoleModal from '../../components/landing/LoginRoleModal'
import { apiFetch } from '../../lib/api'
import { GUEST_REVIEWS } from '../../lib/guestDemoData'
import logoSrc from '../../images/logo/logo.jpg'
import heroImg from '../../images/landing/hero_asha.png'
import aboutImg from '../../images/landing/about_tech.png'
import communityImg from '../../images/landing/community.png'

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "currentColor"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
)

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

export default function LandingPage() {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/reviews/')
        if (res.ok) { const d = await res.json(); setReviews(d?.length ? d : GUEST_REVIEWS) }
        else setReviews(GUEST_REVIEWS)
      } catch { setReviews(GUEST_REVIEWS) }
      finally { setReviewsLoading(false) }
    })()
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lp-visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    document.querySelectorAll('.lp-anim:not(.lp-visible)').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [reviews, mounted])

  const openLogin = () => setShowLoginModal(true)

  return (
    <div className={`lp-root ${mounted ? 'lp-mounted' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        .lp-root { opacity:0; transition:opacity .5s; font-family:'Inter',sans-serif; }
        .lp-root.lp-mounted { opacity:1; }
        .lp-anim { opacity:0; transform:translateY(40px); }
        .lp-anim.lp-visible { opacity:1; transform:translateY(0); transition:opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
        .lp-anim.lp-d1 { transition-delay:.1s; }
        .lp-anim.lp-d2 { transition-delay:.2s; }
        .lp-anim.lp-d3 { transition-delay:.3s; }
        .lp-anim.lp-d4 { transition-delay:.4s; }
        .lp-anim.lp-d5 { transition-delay:.5s; }
        .lp-hero { position:relative; min-height:100vh; display:flex; align-items:center; overflow:hidden; }
        .lp-hero-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .lp-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.4) 50%, rgba(0,0,0,.15) 100%); }
        .lp-hero-content { position:relative; z-index:2; max-width:1300px; margin:0 auto; width:100%; padding:9rem 5% 5rem; }
        .lp-hero h1 { font-family:'Playfair Display',serif; font-size:clamp(2.8rem,7vw,5rem); font-weight:800; color:#fff; line-height:1.08; letter-spacing:-.03em; margin:0 0 1.5rem; max-width:750px; text-shadow:0 4px 30px rgba(0,0,0,.4); }
        .lp-hero h1 .accent { color:#f59e0b; }
        .lp-hero .sub { font-size:clamp(1rem,2.5vw,1.25rem); color:rgba(255,255,255,.85); margin-bottom:2.5rem; max-width:550px; line-height:1.6; font-weight:400; }
        .lp-cta-row { display:flex; gap:1rem; flex-wrap:wrap; }
        .lp-btn-primary { padding:1rem 2.25rem; border-radius:12px; background:linear-gradient(135deg,#0d9488,#10b981); color:#fff; font-weight:700; font-size:1rem; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px; transition:all .25s; box-shadow:0 8px 28px rgba(16,185,129,.35); }
        .lp-btn-primary:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(16,185,129,.45); }
        .lp-btn-outline { padding:1rem 2.25rem; border-radius:12px; background:rgba(255,255,255,.08); backdrop-filter:blur(12px); border:1.5px solid rgba(255,255,255,.25); color:#fff; font-weight:600; font-size:1rem; cursor:pointer; display:inline-flex; align-items:center; gap:10px; transition:all .25s; }
        .lp-btn-outline:hover { background:rgba(255,255,255,.15); transform:translateY(-2px); }

        /* Stats Banner */
        .lp-stats { background:linear-gradient(135deg,#0f766e 0%,#065f46 100%); padding:4rem 5%; }
        .lp-stats-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:2rem; text-align:center; }
        .lp-stat-num { font-family:'Playfair Display',serif; font-size:clamp(2rem,5vw,3rem); font-weight:800; color:#fff; }
        .lp-stat-label { font-size:.875rem; color:rgba(255,255,255,.7); margin-top:.5rem; font-weight:500; }

        /* About Section */
        .lp-about { padding:7rem 5%; background:#fafaf8; }
        .lp-about-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
        .lp-about-img { border-radius:24px; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,.12); }
        .lp-about-img img { width:100%; height:100%; object-fit:cover; display:block; }
        .lp-about h2 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.75rem); font-weight:800; color:#1a1a1a; margin:0 0 1.5rem; letter-spacing:-.02em; }
        .lp-about p { color:#555; font-size:1.0625rem; line-height:1.7; margin-bottom:2rem; }

        /* Problem */
        .lp-problem { padding:7rem 5%; background:#111; color:#fff; position:relative; overflow:hidden; }
        .lp-problem-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
        .lp-problem h2 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.75rem); font-weight:800; margin:0 0 1.5rem; letter-spacing:-.02em; }
        .lp-problem p { color:rgba(255,255,255,.7); font-size:1.0625rem; line-height:1.7; margin-bottom:2rem; }
        .lp-problem-img { border-radius:24px; overflow:hidden; position:relative; }
        .lp-problem-img img { width:100%; display:block; border-radius:24px; }

        /* Features */
        .lp-features { padding:7rem 5%; background:#fafaf8; }
        .lp-features-header { text-align:center; max-width:700px; margin:0 auto 4rem; }
        .lp-features-header .chip { display:inline-block; background:#e6f7f1; color:#0d9488; padding:6px 18px; border-radius:99px; font-size:.8rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-bottom:1.5rem; }
        .lp-features-header h2 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.75rem); font-weight:800; color:#1a1a1a; letter-spacing:-.02em; }
        .lp-feat-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
        .lp-feat-card { background:#fff; border-radius:24px; padding:2.5rem; border:1px solid #eee; transition:all .3s; position:relative; overflow:hidden; }
        .lp-feat-card:hover { transform:translateY(-8px); box-shadow:0 20px 40px rgba(0,0,0,.08); border-color:#d1fae5; }
        .lp-feat-icon { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:1.5rem; font-size:1.5rem; }
        .lp-feat-card h3 { font-size:1.25rem; font-weight:800; color:#1a1a1a; margin:0 0 .75rem; }
        .lp-feat-card p { color:#666; font-size:.9375rem; line-height:1.6; margin:0; }

        /* Tech Strip */
        .lp-tech { padding:3rem 5%; background:#f3f4f6; text-align:center; }
        .lp-tech-title { font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#999; margin-bottom:1.5rem; }
        .lp-tech-logos { display:flex; justify-content:center; gap:3rem; flex-wrap:wrap; align-items:center; }
        .lp-tech-logos span { font-size:1rem; font-weight:800; color:#bbb; letter-spacing:-.01em; }

        /* Reviews */
        .lp-reviews { padding:7rem 5%; background:#111; }
        .lp-reviews-header { text-align:center; margin-bottom:4rem; }
        .lp-reviews-header h2 { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,4vw,2.75rem); font-weight:800; color:#fff; }
        .lp-reviews-grid { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr)); gap:2rem; }
        .lp-review-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:2rem; transition:all .3s; }
        .lp-review-card:hover { background:rgba(255,255,255,.07); transform:translateY(-4px); }

        /* Footer */
        .lp-footer { background:#080c16; border-top:1px solid rgba(255,255,255,.08); padding:4rem 5% 2.5rem; color:#94a3b8; }
        .lp-footer-inner { max-width:1200px; margin:0 auto; }

        @media(max-width:900px) {
          .lp-about-grid, .lp-problem-grid { grid-template-columns:1fr; }
          .lp-stats-grid { grid-template-columns:repeat(2,1fr); }
          .lp-feat-grid { grid-template-columns:1fr; }
          .hide-m { display:none!important; }
          .lp-hero h1 { font-size:2.5rem; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: isScrolled ? 'rgba(8,12,22,.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        boxShadow: isScrolled ? '0 1px 0 rgba(255,255,255,.08)' : 'none',
        transition:'all .3s',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 5%', maxWidth:1400, margin:'0 auto', width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem', fontWeight:800, fontSize:'1.5rem', color:'#fff', letterSpacing:'-.02em' }}>
            <img src={logoSrc} alt="Seva Setu" width={40} height={40} style={{ borderRadius:10, objectFit:'cover' }} />
            Seva Setu
          </div>
          <div style={{ display:'flex', gap:'2.5rem', fontSize:'.9rem', fontWeight:500, color:'rgba(255,255,255,.8)' }} className="hide-m">
            <a href="#about" style={{ color:'inherit', textDecoration:'none' }}>About</a>
            <a href="#problem" style={{ color:'inherit', textDecoration:'none' }}>Problem</a>
            <a href="#features" style={{ color:'inherit', textDecoration:'none' }}>Features</a>
            <a onClick={() => navigate('/our-work')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Our Work</a>
            <a onClick={() => navigate('/impact')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Impact</a>
          </div>
          <button onClick={openLogin} className="lp-btn-primary" style={{ padding:'.65rem 1.5rem', fontSize:'.9rem' }}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="lp-hero">
        <img src={heroImg} alt="" className="lp-hero-img" />
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <h1 className="lp-anim lp-d1">
            Delivering <span className="accent">Seva</span><br />to the Last Mile
          </h1>
          <p className="sub lp-anim lp-d2">
            AI-powered health triage for ASHA workers and Health Officers — bridging rural India's healthcare gap with intelligent digital infrastructure.
          </p>

        </div>
      </section>

      {/* ─── IMPACT STATS ─── */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          {[
            { num: 500, suffix:'+', label:'Emergency Cases Flagged' },
            { num: 31, suffix:'', label:'Karnataka Districts Covered' },
            { num: 3, suffix:'', label:'Languages Supported' },
            { num: 2, suffix:'', label:'AI Models for Consensus' },
          ].map((s,i) => (
            <div key={i} className={`lp-anim lp-d${i+1}`}>
              <div className="lp-stat-num"><CountUp end={s.num} suffix={s.suffix} /></div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="lp-about">
        <div className="lp-about-grid">
          <div className="lp-about-img lp-anim">
            <img src={aboutImg} alt="Seva Setu in action" />
          </div>
          <div className="lp-anim lp-d2">
            <h2>About Seva Setu</h2>
            <p>
              <strong>Seva Setu</strong> is an AI-driven digital health platform designed to empower India's 1 million+ ASHA workers with intelligent triage tools. Our dual-AI system uses <strong>Google Gemini</strong> and <strong>HuggingFace BART-MNLI</strong> in parallel to deliver reliable severity assessments — even in areas with limited connectivity.
            </p>
            <p>
              We support <strong>multilingual voice input</strong> in Kannada, Hindi, and English, making it accessible to low-literacy health workers. Our real-time disease heatmap gives THO officers instant visibility into district-level health patterns.
            </p>
            <button onClick={openLogin} className="lp-btn-primary">Explore Platform →</button>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section id="problem" className="lp-problem">
        <div style={{ position:'absolute', top:'10%', right:'-10%', width:'50%', height:'80%', background:'radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 70%)' }} />
        <div className="lp-problem-grid">
          <div className="lp-anim">
            <h2>The Problem We Solve</h2>
            <p>
              <strong style={{color:'#fff'}}>ASHA workers like Bharti spend 50+ hours every month</strong> recording services on 10 registers and 5 mobile apps. Across India, they collectively spend 50M hours monthly feeding data into 50 portals.
            </p>
            <p>
              Misdiagnosis at the village level leads to delayed referrals. A child with pneumonia might be triaged as "common cold" — losing critical golden hours. <strong style={{color:'#f87171'}}>Every minute of delay can cost a life.</strong>
            </p>
            <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginTop:'1rem' }}>
              <div style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.25)', borderRadius:16, padding:'1.25rem 1.5rem', flex:1, minWidth:140 }}>
                <div style={{ fontSize:'1.75rem', fontWeight:800, color:'#f87171' }}>50M</div>
                <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.6)', marginTop:4 }}>hours wasted monthly on paper registers</div>
              </div>
              <div style={{ background:'rgba(251,191,36,.12)', border:'1px solid rgba(251,191,36,.25)', borderRadius:16, padding:'1.25rem 1.5rem', flex:1, minWidth:140 }}>
                <div style={{ fontSize:'1.75rem', fontWeight:800, color:'#fbbf24' }}>10+</div>
                <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.6)', marginTop:4 }}>registers per ASHA worker</div>
              </div>
            </div>
          </div>
          <div className="lp-problem-img lp-anim lp-d2">
            <img src={communityImg} alt="Rural health camp" />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="lp-features">
        <div className="lp-features-header">
          <div className="chip lp-anim">✦ Our Approach</div>
          <h2 className="lp-anim lp-d1">How Seva Setu Works</h2>
        </div>
        <div className="lp-feat-grid">
          {[
            { icon:'🤖', bg:'#e0f2fe', title:'Dual-AI Triage', desc:'Gemini and HuggingFace run in parallel for consensus-based severity assessment. If both agree it\'s an emergency, you can trust the result.' },
            { icon:'🗣️', bg:'#fef3c7', title:'Voice-to-Text', desc:'ASHA workers speak symptoms in Kannada, Hindi, or English. Our AI transcribes, translates, and triages — no typing needed.' },
            { icon:'🗺️', bg:'#d1fae5', title:'Disease Heatmap', desc:'Real-time district-level visualization with severity-coded circles. Auto-detects outbreak clusters when cases spike in a tehsil.' },
            { icon:'🩺', bg:'#ede9fe', title:'Sickle Cell Screening', desc:'Automatic risk flagging for high-prevalence districts like Yadgir, Raichur, and Bellary in northern Karnataka.' },
            { icon:'🤟', bg:'#fce7f3', title:'Sign Language Mode', desc:'Indian Sign Language (ISL) interface for deaf and hard-of-hearing patients — true healthcare accessibility.' },
            { icon:'⚡', bg:'#fee2e2', title:'Real-Time Sync', desc:'ASHA worker adds a patient → THO officer sees it instantly on their dashboard, sorted by emergency priority.' },
          ].map((f,i) => (
            <div key={i} className={`lp-feat-card lp-anim lp-d${(i%3)+1}`}>
              <div className="lp-feat-icon" style={{ background:f.bg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TECH STRIP ─── */}
      <section className="lp-tech">
        <div className="lp-tech-title">Built With</div>
        <div className="lp-tech-logos">
          {['Google Gemini', 'HuggingFace', 'React', 'FastAPI', 'Google Maps', 'Web Speech API'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>




      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'2rem', marginBottom:'2rem' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', fontWeight:800, fontSize:'1.5rem', color:'#fff', marginBottom:'.75rem' }}>
                <img src={logoSrc} alt="" width={36} height={36} style={{ borderRadius:9 }} />
                Seva Setu
              </div>
              <p style={{ maxWidth:350, fontSize:'.875rem', lineHeight:1.6, color:'rgba(255,255,255,.5)' }}>
                Bridging the healthcare gap in rural India with AI-powered triage intelligence.
              </p>
            </div>
            <button onClick={openLogin} className="lp-btn-primary">Get Started →</button>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:'1.5rem', display:'flex', justifyContent:'space-between', fontSize:'.8rem', color:'rgba(255,255,255,.35)', flexWrap:'wrap', gap:'1rem' }}>
            <div>© 2026 Seva Setu — Built at Scaler Hackathon</div>
            <div>Designed for Rural Health. Powered by Dual-AI.</div>
          </div>
        </div>
      </footer>

      {showLoginModal && <LoginRoleModal onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}

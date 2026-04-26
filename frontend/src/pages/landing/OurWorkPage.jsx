import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '../../images/logo/logo.jpg'
import heroPoster from '../../images/landing/hero_asha.png'
import matImg from '../../images/landing/maternal.png'
import malImg from '../../images/landing/malnutrition.png'
import immImg from '../../images/landing/immunization.png'
import tbImg from '../../images/landing/tb.png'

const PROGRAMS = [
  {
    id: 'triage',
    title: 'Dual-AI Triage System',
    img: matImg,
    desc: 'Our flagship feature uses Gemini 1.5 Flash and HuggingFace NLP models to process ASHA worker voice inputs and text symptoms in parallel. By achieving a consensus between two distinct AI architectures, we ensure a highly reliable severity score that prioritizes emergency patients instantly, drastically reducing misdiagnoses at the village level.'
  },
  {
    id: 'voice',
    title: 'Multilingual Voice-to-Text',
    img: malImg,
    desc: 'Rural healthcare workers often struggle with typing complex medical data into tablets. Our Voice-to-Text module allows ASHA workers to dictate symptoms in regional languages like Hindi and Kannada, automatically transcribing and parsing the data into actionable medical records—saving up to 50 million hours monthly across the health system.'
  },
  {
    id: 'heatmap',
    title: 'Live Disease Heatmap',
    img: immImg,
    desc: 'Seva Setu provides real-time geographic insights for Taluka Health Officers. As ASHA workers log cases from the field, our live mapping system visualizes disease outbreaks across districts, allowing public health officials to allocate resources efficiently and contain localized epidemics before they spread.'
  },
  {
    id: 'isl',
    title: 'Sign Language Accessibility',
    img: tbImg,
    desc: 'True healthcare accessibility must include everyone. Our platform integrates Google MediaPipe to provide real-time Indian Sign Language (ISL) interpretation, ensuring that deaf and hard-of-hearing patients can communicate their symptoms directly and accurately to healthcare providers without barriers.'
  }
]

export default function OurWorkPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(PROGRAMS[0])
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ow-visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.15 })
    document.querySelectorAll('.ow-anim:not(.ow-visible)').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [mounted, activeTab])

  return (
    <div className={`ow-root ${mounted ? 'ow-mounted' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
        .ow-root { opacity:0; transition:opacity .5s; font-family:'Inter',sans-serif; background:#fff; color:#1a1a1a; }
        .ow-root.ow-mounted { opacity:1; }
        
        .ow-anim { opacity:0; transform:translateY(30px); }
        .ow-anim.ow-visible { opacity:1; transform:translateY(0); transition:all .8s cubic-bezier(.16,1,.3,1); }
        .ow-d1 { transition-delay:.1s; }
        .ow-d2 { transition-delay:.2s; }
        .ow-d3 { transition-delay:.3s; }

        /* Hero */
        .ow-hero { position:relative; min-height:85vh; display:flex; align-items:center; overflow:hidden; }
        .ow-hero-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; transform:scale(1.05); animation:slowZoom 20s infinite alternate ease-in-out; }
        @keyframes slowZoom { 0%{ transform:scale(1.05); } 100%{ transform:scale(1.12); } }
        .ow-hero-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.6); z-index:1; }
        .ow-hero-content { position:relative; z-index:2; max-width:1200px; margin:0 auto; width:100%; padding:0 5%; text-align:center; color:#fff; }
        .ow-hero h1 { font-family:'Playfair Display',serif; font-size:clamp(3rem,8vw,5.5rem); font-weight:800; letter-spacing:0.02em; margin:0 0 1.5rem; text-transform:uppercase; }
        .ow-hero p { font-size:clamp(1.1rem,2.5vw,1.35rem); max-width:800px; margin:0 auto; line-height:1.6; color:rgba(255,255,255,.9); font-weight:500; }

        /* Approach / Pillars */
        .ow-approach { padding:7rem 5%; background:#fafaf8; text-align:center; }
        .ow-approach h2 { font-family:'Playfair Display',serif; font-size:2.5rem; font-weight:800; margin-bottom:4rem; color:#111; letter-spacing:0.05em; text-transform:uppercase; }
        .ow-pillars { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
        .ow-pillar { background:#fff; padding:3rem 2rem; border-radius:20px; border:1px solid #eee; transition:all .3s; }
        .ow-pillar:hover { transform:translateY(-8px); box-shadow:0 20px 40px rgba(0,0,0,.06); }
        .ow-pillar-icon { width:64px; height:64px; margin:0 auto 1.5rem; display:flex; align-items:center; justify-content:center; border-radius:16px; background:#e6f7f1; color:#0d9488; font-size:2rem; }
        .ow-pillar h3 { font-size:1.25rem; font-weight:700; margin-bottom:1rem; color:#111; }
        .ow-pillar p { color:#666; font-size:.95rem; line-height:1.6; }

        /* Programs Tabs */
        .ow-programs { padding:7rem 5%; background:#fff; }
        .ow-programs h2 { text-align:center; font-family:'Playfair Display',serif; font-size:2.5rem; font-weight:800; margin-bottom:3rem; color:#111; letter-spacing:0.05em; text-transform:uppercase; }
        .ow-tabs { display:flex; justify-content:center; border-bottom:2px solid #eee; margin-bottom:4rem; overflow-x:auto; }
        .ow-tab { padding:1.25rem 2rem; font-weight:600; font-size:1rem; color:#666; cursor:pointer; border-bottom:3px solid transparent; transition:all .3s; white-space:nowrap; }
        .ow-tab:hover { color:#0d9488; }
        .ow-tab.active { color:#0d9488; border-bottom-color:#0d9488; }
        
        .ow-tab-content { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1.2fr 1fr; gap:4rem; align-items:center; }
        .ow-tab-img { border-radius:24px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,.15); position:relative; aspect-ratio:4/3; }
        .ow-tab-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.5s ease; }
        .ow-tab-img:hover img { transform:scale(1.05); }
        .ow-tab-text h3 { font-family:'Playfair Display',serif; font-size:2.2rem; font-weight:800; color:#111; margin-bottom:1.5rem; }
        .ow-tab-text p { font-size:1.05rem; color:#555; line-height:1.7; margin-bottom:2rem; }
        .ow-btn { padding:1rem 2rem; background:#0d9488; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; transition:all .2s; }
        .ow-btn:hover { background:#0f766e; }

        @media(max-width:900px) {
          .ow-pillars { grid-template-columns:1fr; }
          .ow-tab-content { grid-template-columns:1fr; }
          .ow-tabs { justify-content:flex-start; padding-bottom:1rem; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background: isScrolled ? 'rgba(255,255,255,.95)' : 'transparent', backdropFilter: isScrolled ? 'blur(16px)' : 'none', boxShadow: isScrolled ? '0 1px 10px rgba(0,0,0,.05)' : 'none', transition:'all .3s' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 5%', maxWidth:1400, margin:'0 auto' }}>
          <div onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'.75rem', fontWeight:800, fontSize:'1.5rem', color: isScrolled ? '#111' : '#fff', letterSpacing:'-.02em', cursor:'pointer' }}>
            <img src={logoSrc} alt="Seva Setu" width={40} height={40} style={{ borderRadius:10, objectFit:'cover' }} />
            Seva Setu
          </div>
          <div style={{ display:'flex', gap:'2rem', fontSize:'.9rem', fontWeight:500, color: isScrolled ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.8)' }}>
            <a onClick={() => navigate('/')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Home</a>
            <a onClick={() => navigate('/impact')} style={{ color:'inherit', textDecoration:'none', cursor:'pointer' }}>Impact</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="ow-hero">
        <video className="ow-hero-video" autoPlay loop muted playsInline poster={heroPoster}>
          <source src="https://cdn.pixabay.com/video/2016/08/22/4762-180860534_tiny.mp4" type="video/mp4" />
        </video>
        <div className="ow-hero-overlay" />
        <div className="ow-hero-content">
          <h1 className="ow-anim">What We Do</h1>
          <p className="ow-anim ow-d1">
            We are committed to empowering community health workers and public health decision makers with innovative, data-driven solutions.
          </p>
        </div>
      </section>

      {/* Approach */}
      <section className="ow-approach">
        <h2 className="ow-anim">Our Approach</h2>
        <div className="ow-pillars">
          {[
            { icon:'💻', title:'Digital Platforms', desc:'We develop unified digital health solutions, co-designed with over 250,000 hours of working alongside frontline health workers.' },
            { icon:'🛡️', title:'Health System Strengthening', desc:'We support public health decision-makers with data-driven insights and policies to close health equity gaps.' },
            { icon:'🔬', title:'Research & Development', desc:'We collaborate with experts to deploy AI/ML technologies for precision-public health delivery and impact evaluation.' }
          ].map((p,i) => (
            <div key={i} className={`ow-pillar ow-anim ow-d${i+1}`}>
              <div className="ow-pillar-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="ow-programs">
        <h2 className="ow-anim">Our Technologies</h2>
        <div className="ow-tabs ow-anim">
          {PROGRAMS.map(p => (
            <div key={p.id} onClick={() => setActiveTab(p)} className={`ow-tab ${activeTab.id === p.id ? 'active' : ''}`}>
              {p.title}
            </div>
          ))}
        </div>

        <div className="ow-tab-content" key={activeTab.id}>
          <div className="ow-tab-img ow-anim">
            <img src={activeTab.img} alt={activeTab.title} />
          </div>
          <div className="ow-tab-text ow-anim ow-d1">
            <p>{activeTab.desc}</p>
            <button className="ow-btn">Learn More</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#080c16', padding:'4rem 5%', color:'#94a3b8', textAlign:'center' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ fontWeight:800, fontSize:'1.5rem', color:'#fff', marginBottom:'1rem' }}>Seva Setu</div>
          <p style={{ maxWidth:400, margin:'0 auto 2rem', fontSize:'.9rem' }}>Bridging the healthcare gap in rural India with AI-powered triage intelligence.</p>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:'2rem', fontSize:'.8rem' }}>
            © 2026 Seva Setu. Inspired by Khushi Baby.
          </div>
        </div>
      </footer>
    </div>
  )
}

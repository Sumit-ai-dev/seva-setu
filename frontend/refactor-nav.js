import fs from 'fs';

const topNavCode = `import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { path: '/home', label: 'Dashboard', marathi: 'डॅशबोर्ड' },
  { path: '/patient', label: 'Patient Triage', marathi: 'रुग्ण ट्रायज' },
  { path: '/chat', label: 'AI Chat', marathi: 'AI चॅट' },
  { path: '/isl', label: 'ISL Sign Language', marathi: 'सांकेतिक भाषा' },
]

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav style={{ 
      background: '#fff', 
      borderBottom: '1px solid #e5e7eb', 
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
      zIndex: 9
    }}>
      <style>{\`nav::-webkit-scrollbar { display: none; }\`}</style>
      
      <div style={{ display: 'flex', gap: '2.5rem', flex: 1 }}>
        {NAV.map(item => {
          const active = location.pathname.startsWith(item.path) || 
            (item.path === '/home' && location.pathname === '/')
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '3px solid #0F6E56' : '3px solid transparent',
                color: active ? '#0F6E56' : '#6b7280',
                fontWeight: active ? 700 : 500,
                padding: '0.875rem 0',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span>{item.label}</span>
              <span style={{ fontSize: '0.6875rem', opacity: 0.8, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{item.marathi}</span>
            </button>
          )
        })}
      </div>
      
      <button
        onClick={handleLogout}
        style={{
          background: 'transparent', border: 'none', color: '#DC2626',
          fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </nav>
  )
}
`;

try {
  // 1. Create TopNav.jsx
  fs.writeFileSync('src/components/TopNav.jsx', topNavCode);
  
  // 2. Delete Sidebar.jsx
  if (fs.existsSync('src/components/Sidebar.jsx')) {
    fs.unlinkSync('src/components/Sidebar.jsx');
  }

  // 3. Update HomePage.jsx
  let hp = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');
  hp = hp.replace("import Sidebar from '../components/Sidebar.jsx'", "import TopNav from '../components/TopNav.jsx'");
  hp = hp.replace('<Sidebar />', '');
  hp = hp.replace("padding: '0.875rem 1.25rem 0.875rem 4rem'", "padding: '0.875rem 1.25rem'");
  
  // Replace the heading
  const oldHeading = \`<div>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111' }}>डॅशबोर्ड</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Dashboard</div>
          </div>\`;
  const newHeading = \`<button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F6E56', letterSpacing: '-0.02em' }}>Swasthya Setu</div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', fontFamily: "'Noto Sans Devanagari', sans-serif", marginTop: 2 }}>आरोग्य सेतू</div>
          </button>\`;
  hp = hp.replace(oldHeading, newHeading);
  
  // Insert TopNav
  hp = hp.replace('</header>', '</header>\\n      <TopNav />');
  fs.writeFileSync('src/pages/HomePage.jsx', hp);

  // 4. Update PatientFormPage.jsx
  let pf = fs.readFileSync('src/pages/PatientFormPage.jsx', 'utf8');
  pf = pf.replace("import Sidebar from '../components/Sidebar.jsx'", "import TopNav from '../components/TopNav.jsx'");
  pf = pf.replace('<Sidebar />', '');
  pf = pf.replace('</header>', '</header>\\n      <TopNav />');
  fs.writeFileSync('src/pages/PatientFormPage.jsx', pf);

  // 5. Update ISLPage.jsx
  let isl = fs.readFileSync('src/pages/ISLPage.jsx', 'utf8');
  isl = isl.replace("import Sidebar from '../components/Sidebar.jsx'", "import TopNav from '../components/TopNav.jsx'");
  isl = isl.replace('<Sidebar />', '');
  isl = isl.replace("padding: '0.875rem 1.25rem 0.875rem 4rem'", "padding: '0.875rem 1.25rem'");
  isl = isl.replace('</header>', '</header>\\n      <TopNav />');
  fs.writeFileSync('src/pages/ISLPage.jsx', isl);

  // 6. Update ChatPage.jsx
  let chat = fs.readFileSync('src/pages/ChatPage.jsx', 'utf8');
  chat = chat.replace("import Sidebar from '../components/Sidebar.jsx'", "import TopNav from '../components/TopNav.jsx'");
  chat = chat.replace('<Sidebar />', '');
  chat = chat.replace("padding: '0.875rem 1.5rem 0.875rem 4rem'", "padding: '0.875rem 1.5rem'");
  chat = chat.replace('</header>', '</header>\\n      <TopNav />');
  fs.writeFileSync('src/pages/ChatPage.jsx', chat);

  console.log("Navigation refactor complete.");
} catch(e) {
  console.error(e);
}

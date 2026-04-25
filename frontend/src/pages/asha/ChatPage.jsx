import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { geminiChat, getChatSystemPrompt } from '../../lib/openai'
import { usePatient } from '../../context/PatientContext.jsx'
import ChatBubble from '../../components/asha/ChatBubble.jsx'
import DashboardLayout from '../../components/asha/DashboardLayout.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { apiFetch } from '../../lib/api'

const SEVERITY_BADGE = {
  green:  { label: 'Stable / ಸ್ಥಿರ', cls: 'badge-green' },
  yellow: { label: 'Moderate / ಸಾಧಾರಣ', cls: 'badge-yellow' },
  red:    { label: 'Emergency / ತುರ್ತು', cls: 'badge-red' },
}

const QUICK_REPLIES = [
  { odia: 'ಯಾವ ಔಷಧಿ ಕೊಡಬೇಕು?', english: 'What medicine should I give?' },
  { odia: 'ಈ ಕೇಸ್ ಎಷ್ಟು ಗಂಭೀರ?', english: 'How serious is this case?' },
  { odia: 'ವೈದ್ಯರಿಗೆ ಕಳಿಸಬೇಕೇ?', english: 'Should I refer to a doctor?' },
]

function buildGreeting(patient, triage) {
  const sickleNote = triage.sickle_cell_risk
    ? '\n\n🔴 ಎಚ್ಚರಿಕೆ: ಈ ರೋಗಿಯನ್ನು ತಕ್ಷಣ ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗೆ ಕಳಿಸಿ.'
    : ''

  const historyNote = (patient.history && patient.history.length > 1)
    ? `\n\nಈ ರೋಗಿಯ **${patient.history.length}** ಹಿಂದಿನ ಭೇಟಿಗಳ ಇತಿಹಾಸ ಇದೆ.`
    : ''

  return `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಾಯಕ.
ರೋಗಿ **${patient.name}** ಬಗ್ಗೆ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಏನು?

**ಟ್ರಯೇಜ್ ಫಲಿತಾಂಶ: ${triage.severity.toUpperCase()}**
${triage.brief}

ರೋಗಲಕ್ಷಣಗಳು: ${triage.symptoms.join(', ')}${sickleNote}${historyNote}`
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { patientData, setPatientData, triageResult, setTriageResult } = usePatient()
  const { isDark } = useTheme()

  const clr = {
    bg:          'var(--g-chat-bg)',
    surface:     'var(--g-chat-surface)',
    blur:        'blur(24px) saturate(150%)',
    border:      'var(--g-chat-border)',
    borderSolid: 'var(--g-chat-border)',
    topText:     'var(--g-text)',
    topMuted:    'var(--g-muted)',
    text:        'var(--g-text)',
    muted:       'var(--g-muted)',
    glassGlow:   'var(--g-card-shd)',
    primaryBg:   'var(--g-chat-primary)',
    primaryShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
  }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Selector state
  const [availablePatients, setAvailablePatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all patients if none selected
  useEffect(() => {
    if (!patientData?.name || !triageResult) {
      fetchAvailablePatients()
    }
  }, [patientData, triageResult])

  async function fetchAvailablePatients() {
    setLoadingPatients(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await apiFetch('/triage_records/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch triage records')
      const recs = await res.json()
      
      const grouped = new Map()
      recs.forEach(r => {
        const key = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.district}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: r.patient_id || key,
            name: r.patient_name,
            age: r.age,
            gender: r.gender,
            district: r.district,
            records: []
          })
        }
        grouped.get(key).records.push(r)
      })
      const patients = Array.from(grouped.values()).map(p => ({
        ...p,
        latestSeverity: p.records[0]?.severity || 'green'
      }))
      
      setAvailablePatients(patients)
    } catch (err) {
      console.error('Fetch patients error:', err)
    } finally {
      setLoadingPatients(false)
    }
  }

  function handleSelectPatient(p) {
    const latest = p.records[0]
    setPatientData({
      name: p.name,
      age: p.age,
      gender: p.gender,
      district: p.district,
      symptomText: latest.symptom_text || '',
      history: p.records // Pass full history
    })
    setTriageResult({
      severity: latest.severity,
      brief: latest.brief,
      symptoms: latest.symptoms || [],
      sickle_cell_risk: latest.sickle_cell_risk
    })
  }

  // Pre-load greeting when patient is selected
  useEffect(() => {
    if (patientData?.name && triageResult) {
      setMessages([
        {
          role: 'assistant',
          content: buildGreeting(patientData, triageResult),
        },
      ])
    }
  }, [patientData, triageResult])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    setInput('')
    setError('')
    const userMessage = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)
    try {
      const systemPrompt = getChatSystemPrompt(patientData, triageResult)
      const assistantContent = await geminiChat(systemPrompt, updatedMessages.map(m => ({ role: m.role, content: m.content })))
      if (!assistantContent) throw new Error('Empty response from model.')
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError('')

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const systemPrompt = getChatSystemPrompt(patientData, triageResult)
      const assistantContent = await geminiChat(systemPrompt, updatedMessages.map(m => ({ role: m.role, content: m.content })))
      if (!assistantContent) throw new Error('Empty response from model.')

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

   if (!patientData?.name || !triageResult) {
    const filtered = availablePatients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <DashboardLayout contentStyle={{ padding: '1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>AI Chat</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>Select a patient to start an AI-assisted consultation</p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 420, marginBottom: '1.5rem' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Search patient name or district…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: 36, paddingLeft: '2.25rem', paddingRight: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.875rem', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {loadingPatients ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Loading patients…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.875rem' }}>
              {filtered.map(p => {
                const sevColor = p.latestSeverity === 'red' ? '#ef4444' : p.latestSeverity === 'yellow' ? '#f59e0b' : '#10b981'
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${sevColor}`, borderRadius: 10, padding: '1rem 1.25rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 10 }}>{p.age} yrs · {p.gender} · {p.district}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 99, background: `${sevColor}18`, color: sevColor, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{p.latestSeverity}</span>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{p.records.length} visit{p.records.length !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>No patients found.</div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  const badge = SEVERITY_BADGE[triageResult.severity?.toLowerCase()] || SEVERITY_BADGE.green

  const severityColor = { green: 'var(--color-green)', yellow: 'var(--color-yellow)', red: 'var(--color-red)' }[triageResult.severity] || 'var(--color-green)'

  const patientBadge = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.75rem', borderLeft: `2px solid ${clr.border}`, marginLeft: '0.25rem', minWidth: 0 }}>
      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: clr.text }}>{patientData.name}</span>
      <span style={{ padding: '2px 10px', borderRadius: 99, background: `${severityColor}18`, color: severityColor, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{triageResult.severity}</span>
    </div>
  )

  return (
    <DashboardLayout topbarContent={patientBadge} contentStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>

        <aside className="chat-sidebar" style={{
          width: 280,
          flexShrink: 0,
          background: clr.surface,
          backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur,
          borderRight: `1px solid ${clr.border}`,
          boxShadow: clr.glassGlow,
          padding: '1.5rem 1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative', zIndex: 5,
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Patient Info</div>
            {[
              { label: 'Name', value: patientData.name },
              { label: 'Age', value: `${patientData.age} years` },
              { label: 'Gender', value: patientData.gender },
              { label: 'District', value: patientData.district },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '0.625rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Triage Result</div>
            <div style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius)',
              border: `2px solid ${severityColor}`,
              background: `${severityColor}12`,
              marginBottom: '0.875rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: severityColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {triageResult.severity}
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.375rem', color: 'var(--color-text)' }}>{triageResult.brief}</div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.375rem' }}>Symptoms</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {triageResult.symptoms?.map((s) => (
                <span key={s} style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.625rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text)',
                }}>{s}</span>
              ))}
            </div>
          </div>

          {triageResult.sickle_cell_risk && (
            <>
              <div style={{ height: 1, background: 'var(--color-border)' }} />
              <div style={{
                background: 'var(--color-red-bg)',
                border: '1.5px solid var(--color-red-border)',
                borderRadius: 'var(--radius)',
                padding: '0.875rem',
                color: 'var(--color-red)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}>
                🔴 High Sickle Cell Risk<br />
                <span style={{ fontWeight: 400, marginTop: '0.25rem', display: 'block' }}>Refer to district hospital immediately.</span>
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <div style={{ height: 1, background: `${clr.border}`, marginBottom: '1rem' }} />
            <button
              onClick={() => { setPatientData({}); setTriageResult(null); setMessages([]) }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                border: `1.5px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.3)'}`,
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.8)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : 'rgba(254,226,226,0.95)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(239,68,68,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.8)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(239,68,68,0.15)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Switch Patient
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          <button
            className="chat-info-btn"
            onClick={() => setShowMobileInfo(true)}
            style={{
              margin: '0.75rem 1rem 0',
              alignItems: 'center', gap: '0.5rem',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 99,
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Patient Info
            <span style={{ background: severityColor, color: '#fff', borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>{triageResult.severity}</span>
          </button>
          
          <div
            className="chat-messages-area"
            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}
            role="log"
            aria-live="polite"
          >
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} clr={clr} isDark={isDark} />
            ))}

            {loading && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: clr.surface,
                backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur,
                border: `1px solid ${clr.border}`,
                borderRadius: 'var(--radius-sm) var(--radius) var(--radius) var(--radius-sm)',
                maxWidth: 200,
                boxShadow: clr.glassGlow,
                animation: 'fadeIn 0.2s ease',
              }}>
                <TypingDots />
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Thinking…</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '0.5rem', maxWidth: 500 }} role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-replies" style={{ padding: '0.5rem 2rem 0.5rem', background: clr.surface, backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: `1px solid ${clr.border}` }}>
            {QUICK_REPLIES.map((chip) => (
              <button
                key={chip.odia}
                type="button"
                onClick={() => sendMessage(chip.english)}
                disabled={loading}
                style={{ padding: '0.625rem 1.25rem', borderRadius: '999px', border: '1px solid var(--color-primary)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                {chip.odia}
              </button>
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center', fontFamily: "'Noto Sans Kannada', sans-serif" }} className="hide-mobile">ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ</span>
          </div>

          <form
            onSubmit={handleSend}
            className="chat-input-area"
            style={{
              padding: '0.75rem 2rem 1rem',
              background: clr.surface,
              backdropFilter: clr.blur, WebkitBackdropFilter: clr.blur,
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-end',
              position: 'relative', zIndex: 5,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… / प्रश्न विचारा…"
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                padding: '0.875rem 1.125rem',
                border: `1px solid ${clr.border}`,
                borderRadius: 'var(--radius)',
                fontSize: '0.9375rem',
                lineHeight: 1.5,
                resize: 'none',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
                color: clr.text,
                maxHeight: 140,
                overflowY: 'auto',
                fontFamily: 'inherit',
                transition: 'border-color var(--transition)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
              }}
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: 'var(--radius)',
                background: loading || !input.trim() ? 'var(--color-border)' : 'var(--color-primary)',
                color: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'background var(--transition)',
              }}
              aria-label="Send message"
            >
              {loading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <>
                  Send
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {showMobileInfo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowMobileInfo(false)}>
           <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '85%', maxWidth: 320, background: clr.bg, boxShadow: '-4px 0 20px rgba(0,0,0,0.2)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => { setShowMobileInfo(false); setPatientData({}); setTriageResult(null); }}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 10, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700 }}
              >Switch Patient</button>
           </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--color-text-muted)',
            display: 'inline-block',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

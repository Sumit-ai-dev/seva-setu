import React from 'react'

// Simple avatar SVG icons
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  )
}

function BotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a5 5 0 0 1 5 5v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a5 5 0 0 1 5-5h2V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
    </svg>
  )
}

export default function ChatBubble({ role, content, clr, isDark }) {
  const isUser = role === 'user'

  return (
    <div
      className="chat-bubble-row"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.5rem',
        marginBottom: '0.875rem',
        animation: 'fadeIn 0.25s ease forwards',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser ? (clr?.primaryBg || 'var(--color-primary)') : 'transparent',
          color: isUser ? '#fff' : (clr?.text || 'var(--color-text-muted)'),
          border: isUser ? 'none' : `2px solid ${clr?.borderSolid || clr?.border || 'var(--color-border)'}`,
          boxShadow: isUser ? (clr?.primaryShadow || 'none') : 'none'
        }}
        aria-hidden="true"
      >
        {isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '75%',
          padding: '0.75rem 1rem',
          borderRadius: isUser
            ? 'var(--radius) var(--radius-sm) var(--radius-sm) var(--radius)'
            : 'var(--radius-sm) var(--radius) var(--radius) var(--radius-sm)',
          background: isUser ? (clr?.primaryBg || 'var(--color-primary)') : (clr?.surface || 'var(--color-white)'),
          backdropFilter: isUser ? 'none' : (clr?.blur || 'none'),
          WebkitBackdropFilter: isUser ? 'none' : (clr?.blur || 'none'),
          color: isUser ? '#fff' : (clr?.text || 'var(--color-text)'),
          border: isUser ? 'none' : `1px solid ${clr?.border || 'var(--color-border)'}`,
          boxShadow: isUser ? (clr?.primaryShadow || 'var(--shadow)') : (clr?.glassGlow || 'var(--shadow)'),
          fontSize: '0.9375rem',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {/* Role label */}
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            opacity: 0.65,
            marginBottom: '0.3rem',
          }}
        >
          {isUser ? 'ASHA Worker' : 'AI Assistant'}
        </div>
        {content}
      </div>
    </div>
  )
}

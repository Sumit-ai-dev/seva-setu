import React from 'react'

const SEVERITY_CONFIG = {
  green: {
    icon: '✓',
    iconBg: '#27ae60',
    cardBg: '#eafaf1',
    border: '#a9dfbf',
    labelColor: '#1e8449',
    english: 'Safe',
    marathi: 'सुरक्षित',
    badgeClass: 'badge-green',
    headingColor: '#1e8449',
  },
  yellow: {
    icon: '⚠',
    iconBg: '#f39c12',
    cardBg: '#fef9e7',
    border: '#f8d7a0',
    labelColor: '#b7770d',
    english: 'Moderate',
    marathi: 'मध्यम',
    badgeClass: 'badge-yellow',
    headingColor: '#b7770d',
  },
  red: {
    icon: '!',
    iconBg: '#e74c3c',
    cardBg: '#fdf2f2',
    border: '#f5b7b1',
    labelColor: '#c0392b',
    english: 'Emergency',
    marathi: 'तातडीने',
    badgeClass: 'badge-red',
    headingColor: '#c0392b',
  },
}

export default function TriageCard({ severity, symptoms, sickle_cell_risk, brief }) {
  const config = SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.green

  return (
    <div
      className="triage-card animate-slide-up"
      style={{
        background: config.cardBg,
        border: `2px solid ${config.border}`,
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Severity Header */}
      <div className="triage-card__header" style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Icon Circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: config.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--surface)',
              fontSize: severity === 'green' ? '1.5rem' : '1.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {config.icon}
          </div>

          {/* Label */}
          <div>
            <div
              style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: config.headingColor,
                lineHeight: 1.2,
              }}
            >
              {config.english}
            </div>
            <div
              style={{
                fontFamily: "'Noto Sans Devanagari', sans-serif",
                fontSize: '1rem',
                color: config.labelColor,
                opacity: 0.85,
                lineHeight: 1.3,
                marginTop: 2,
              }}
            >
              {config.marathi}
            </div>
          </div>
        </div>
      </div>

      {/* Sickle Cell Risk Banner */}
      {sickle_cell_risk && (
        <div
          className="sickle-cell-banner"
          style={{
            background: '#e74c3c',
            color: 'var(--surface)',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: '1.125rem' }} aria-hidden="true">🔴</span>
          <div>
            <div>Sickle Cell Risk</div>
            <div style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: '0.875rem', opacity: 0.9 }}>
              सिकल सेलचा संशय
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        {/* Clinical Brief */}
        {brief && (
          <div
            style={{
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.9375rem',
              color: 'var(--color-text)',
              lineHeight: 1.5,
              borderLeft: `3px solid ${config.iconBg}`,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: config.labelColor, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clinical Summary
            </div>
            {brief}
          </div>
        )}

        {/* Symptoms List */}
        {symptoms && symptoms.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: config.labelColor,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.5rem',
              }}
            >
              Identified Symptoms / ओळखलेली लक्षणे
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {symptoms.map((s, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: `1px solid ${config.border}`,
                    borderRadius: 'var(--radius-full)',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.875rem',
                    color: config.labelColor,
                    fontWeight: 500,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

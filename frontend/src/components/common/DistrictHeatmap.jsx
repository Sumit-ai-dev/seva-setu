import React, { useState } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { DISTRICT_CENTERS } from '../../pages/tho/THOShared'

function getSeverityColor(point) {
  if (point.critical > 0) return '#ef4444' // Red
  if (point.moderate > 0) return '#f59e0b' // Yellow
  return '#22c55e' // Green
}

function isRecentOutbreak(outbreak) {
  if (!outbreak.created_at) return true
  const created = new Date(outbreak.created_at)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return created > oneHourAgo
}

export default function DistrictHeatmap({ district, points, center, zoom = 10, bounds, outbreaks = [], height = '100%' }) {
  const [activeMarker, setActiveMarker] = useState(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div style={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#64748b', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '8px' }}>Google Maps API Key Missing</h3>
        <p style={{ fontSize: '0.875rem' }}>Please add VITE_GOOGLE_MAPS_API_KEY to your frontend/.env file</p>
      </div>
    )
  }

  // Determine starting zoom — zoom out if outbreaks span multiple districts
  const isNational = district.toLowerCase() === 'india'
  const hasDistantOutbreaks = outbreaks.some(o => {
    const oLat = o.latitude || DISTRICT_CENTERS[o.district]?.[0]
    const oLng = o.longitude || DISTRICT_CENTERS[o.district]?.[1]
    if (!oLat || !oLng) return false
    const dist = Math.abs(oLat - center[0]) + Math.abs(oLng - center[1])
    return dist > 1 // ~100km away from center
  })
  const defaultZoom = isNational ? 4 : (hasDistantOutbreaks ? 7 : zoom)
  // If outbreaks span the state, center on Karnataka instead of local district
  const mapCenter = hasDistantOutbreaks
    ? { lat: 14.5, lng: 76.5 } // Center of Karnataka
    : { lat: center[0], lng: center[1] }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <style>{`
        @keyframes outbreakPulse {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
          70% { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={defaultZoom}
          minZoom={isNational ? 4 : 6}
          maxZoom={14}
          mapId="SWASTH_SCALER_MAP" // Required for AdvancedMarker
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          {/* Patient Triage Points — Circle markers */}
          {points.map((pt, i) => {
            const baseSize = Math.max(20, Math.min(48, 14 + pt.total * 4))
            const color = getSeverityColor(pt)
            return (
              <AdvancedMarker
                key={`patient-${i}`}
                position={{ lat: pt.lat, lng: pt.lng }}
                onClick={() => setActiveMarker(`patient-${i}`)}
              >
                <div
                  style={{
                    width: baseSize,
                    height: baseSize,
                    borderRadius: '50%',
                    background: color,
                    border: '3px solid #ffffff',
                    boxShadow: `0 0 8px ${color}88, 0 2px 6px rgba(0,0,0,0.3)`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: baseSize > 30 ? '0.75rem' : '0.6rem',
                    transition: 'transform 0.15s ease',
                  }}
                  title={`${pt.village} — ${pt.total} cases`}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {pt.total}
                </div>
                
                {activeMarker === `patient-${i}` && (
                  <InfoWindow
                    position={{ lat: pt.lat, lng: pt.lng }}
                    onCloseClick={() => setActiveMarker(null)}
                    headerContent={<strong>{pt.village}</strong>}
                  >
                    <div style={{ minWidth: '180px', fontSize: '0.875rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>PATIENT TRIAGE CLUSTER</div>
                      <hr style={{ margin: '6px 0', borderColor: '#f1f5f9' }} />
                      <div>Total Cases: <strong>{pt.total}</strong></div>
                      <div style={{ color: '#ef4444' }}>Critical: {pt.critical}</div>
                      <div style={{ color: '#f59e0b' }}>Moderate: {pt.moderate}</div>
                      <div style={{ color: '#22c55e' }}>Mild: {pt.mild}</div>
                      <hr style={{ margin: '6px 0', borderColor: '#f1f5f9' }} />
                      <div style={{ color: '#64748b' }}>Last reported: {pt.lastReported}</div>
                      {pt.ashaWorker && <div style={{ color: '#64748b' }}>ASHA: {pt.ashaWorker}</div>}
                    </div>
                  </InfoWindow>
                )}
              </AdvancedMarker>
            )
          })}

          {/* Disease Outbreak Points — 🚩 flag markers */}
          {outbreaks.map((o, i) => {
            // Resolve GPS: use outbreak coords, or fall back to district center
            let oLat = o.latitude
            let oLng = o.longitude
            if (!oLat || !oLng) {
              const center = DISTRICT_CENTERS[o.district]
              if (center) { oLat = center[0]; oLng = center[1] }
              else return null // No coordinates at all, skip
            }
            const recent = isRecentOutbreak(o)
            return (
            <AdvancedMarker
              key={`outbreak-${o.id || i}`}
              position={{ lat: oLat, lng: oLng }}
              onClick={() => setActiveMarker(`outbreak-${o.id}`)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#dc2626',
                  border: '3px solid #ffffff',
                  boxShadow: '0 0 12px rgba(220,38,38,0.5), 0 2px 6px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.2rem',
                  transition: 'transform 0.15s ease',
                  animation: recent ? 'outbreakPulse 2s ease-in-out infinite' : 'none',
                }}
                title={`🚩 Outbreak: ${o.disease || o.disease_illness_name}`}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                🚩
              </div>

              {activeMarker === `outbreak-${o.id}` && (
                <InfoWindow
                  position={{ lat: o.latitude, lng: o.longitude }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div style={{ minWidth: '200px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ padding: '2px 6px', background: '#fef2f2', color: '#dc2626', borderRadius: 4, fontSize: '0.65rem', fontWeight: 800 }}>🚩 OUTBREAK FLAG</span>
                      {o.week && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Week {o.week}, {o.year}</span>}
                    </div>
                    <strong style={{ fontSize: '1.1rem', color: '#1e293b', textTransform: 'capitalize' }}>{o.disease || o.disease_illness_name}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{o.district}, {o.state}</div>

                    <hr style={{ margin: '8px 0', borderColor: '#f1f5f9' }} />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>CASES</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>{o.cases || 0}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>DEATHS</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ef4444' }}>{o.deaths || 0}</div>
                      </div>
                    </div>
                    {o.created_at && (
                      <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#94a3b8' }}>
                        Flagged: {new Date(o.created_at).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </AdvancedMarker>
            )
          })}
        </Map>
      </APIProvider>
    </div>
  )
}


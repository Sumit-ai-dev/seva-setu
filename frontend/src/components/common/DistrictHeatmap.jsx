import React, { useState } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps'

function getSeverityColor(point) {
  if (point.critical > 0) return '#ef4444' // Red
  if (point.moderate > 0) return '#f59e0b' // Yellow
  return '#22c55e' // Green
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

  // Determine starting zoom based on district (India = 4, else 9)
  const isNational = district.toLowerCase() === 'india'
  const defaultZoom = isNational ? 4 : zoom

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: center[0], lng: center[1] }}
          defaultZoom={defaultZoom}
          minZoom={isNational ? 4 : 8}
          maxZoom={14}
          mapId="SWASTH_SCALER_MAP" // Required for AdvancedMarker
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          {/* Patient Triage Points */}
          {points.map((pt, i) => {
            const size = Math.max(1.2, Math.min(2.5, pt.total * 0.2))
            return (
              <AdvancedMarker
                key={`patient-${i}`}
                position={{ lat: pt.lat, lng: pt.lng }}
                onClick={() => setActiveMarker(`patient-${i}`)}
              >
                <Pin
                  background={getSeverityColor(pt)}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={size}
                />
                
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

          {/* Disease Outbreak Points */}
          {outbreaks.filter(o => o.latitude && o.longitude).map((o, i) => (
            <AdvancedMarker
              key={`outbreak-${o.id}`}
              position={{ lat: o.latitude, lng: o.longitude }}
              onClick={() => setActiveMarker(`outbreak-${o.id}`)}
            >
              <Pin
                background="#8b5cf6" // Purple
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={1.5}
              />

              {activeMarker === `outbreak-${o.id}` && (
                <InfoWindow
                  position={{ lat: o.latitude, lng: o.longitude }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div style={{ minWidth: '200px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ padding: '2px 6px', background: '#f5f3ff', color: '#7c3aed', borderRadius: 4, fontSize: '0.65rem', fontWeight: 800 }}>DISEASE OUTBREAK</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Week {o.week}, {o.year}</span>
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
                  </div>
                </InfoWindow>
              )}
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}

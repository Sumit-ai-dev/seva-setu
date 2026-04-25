import React, { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function getSeverityColor(point) {
  if (point.critical > 0) return '#ef4444'
  if (point.moderate > 0) return '#f59e0b'
  return '#22c55e'
}

function MapController({ center, zoom, bounds, district }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      // Use setView with the district center + zoom — no fitBounds (that's what caused world view)
      map.setView(center, zoom, { animate: true })
      map.setMaxBounds(bounds)
      // Custom minZoom: if India (national), allow zoom out to 4; otherwise (district) keep it 9
      const isNational = district.toLowerCase() === 'india'
      map.setMinZoom(isNational ? 4 : 9)
    } else {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, zoom, bounds, map])
  return null
}

export default function DistrictHeatmap({ district, points, center, zoom = 10, bounds, outbreaks = [], height = '100%' }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={district.toLowerCase() === 'india' ? 4 : (bounds ? 9 : 5)}
      maxZoom={14}
      maxBounds={bounds || undefined}
      maxBoundsViscosity={bounds ? 1.0 : 0}
      style={{ height, width: '100%', zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        noWrap={true}
      />
      <MapController center={center} zoom={zoom} bounds={bounds} district={district} />

      {/* Patient Triage Points */}
      {points.map((pt, i) => (
        <CircleMarker
          key={`patient-${i}`}
          center={[pt.lat, pt.lng]}
          radius={Math.max(10, Math.min(40, pt.total * 5))}
          pathOptions={{
            fillColor: getSeverityColor(pt),
            fillOpacity: 0.75,
            color: getSeverityColor(pt),
            weight: 2,
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px', fontSize: '0.875rem' }}>
              <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{pt.village}</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>PATIENT TRIAGE CLUSTER</div>
              <hr style={{ margin: '6px 0', borderColor: '#f1f5f9' }} />
              <div>Total Cases: <strong>{pt.total}</strong></div>
              <div style={{ color: '#ef4444' }}>Critical: {pt.critical}</div>
              <div style={{ color: '#f59e0b' }}>Moderate: {pt.moderate}</div>
              <div style={{ color: '#22c55e' }}>Mild: {pt.mild}</div>
              <hr style={{ margin: '6px 0', borderColor: '#f1f5f9' }} />
              <div style={{ color: '#64748b' }}>Last reported: {pt.lastReported}</div>
              {pt.ashaWorker && <div style={{ color: '#64748b' }}>ASHA: {pt.ashaWorker}</div>}
              {pt.lat && pt.lng && (
                <div style={{ color: '#2563eb', marginTop: '6px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                  📍 {Number(pt.lat).toFixed(5)}, {Number(pt.lng).toFixed(5)}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Disease Outbreak Points */}
      {outbreaks.filter(o => o.latitude && o.longitude).map((o, i) => (
        <CircleMarker
          key={`outbreak-${o.id}`}
          center={[o.latitude, o.longitude]}
          radius={12}
          pathOptions={{
            fillColor: '#8b5cf6', // Purple for outbreaks
            fillOpacity: 0.9,
            color: '#fff',
            weight: 2,
            dashArray: '4, 4'
          }}
        >
          <Popup>
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

              {o.status && (
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '4px 8px', borderRadius: 6 }}>
                  <strong>Status:</strong> {o.status}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

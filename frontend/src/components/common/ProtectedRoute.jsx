import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children, role }) {
  const { session, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
        <p>Loading… / लोड होत आहे…</p>
      </div>
    )
  }

  // THO uses bypass auth (also accept old dmo_bypass key for existing sessions)
  if (role === 'tho' && (
    localStorage.getItem('tho_bypass') === 'true' ||
    localStorage.getItem('dmo_bypass') === 'true'
  )) {
    return children
  }

  if (role === 'asha' && localStorage.getItem('asha_bypass') === 'true') {
    return children
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  // Accept 'dmo' role from JWT as equivalent to 'tho'
  const effectiveRole = userRole === 'dmo' ? 'tho' : userRole
  if (role && effectiveRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

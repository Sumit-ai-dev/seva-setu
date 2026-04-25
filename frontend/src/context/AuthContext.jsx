import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiFetch, API_BASE_URL } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null) // holds the JWT
  const [userRole, setUserRole] = useState(null) // 'asha' | 'tho'
  const [user, setUser] = useState(null) // holds user info
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for existing JWT session
    const token = localStorage.getItem('access_token')
    const savedRole = localStorage.getItem('userRole')
    const savedUser = localStorage.getItem('user')
    const ashaBypass = localStorage.getItem('asha_bypass') === 'true'
    const thoBypass = localStorage.getItem('tho_bypass') === 'true'
    const dmoBypass = localStorage.getItem('dmo_bypass') === 'true' // legacy key

    if (token || ashaBypass || thoBypass || dmoBypass) {
      setSession({ access_token: token })
      setUserRole(savedRole)
      try {
        if (savedUser) setUser(JSON.parse(savedUser))
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  const login = async (employee_id, password, role) => {
    const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ employee_id, password, role })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed')
    }

    // Save tokens and info
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('userRole', data.user.role)
    localStorage.setItem('user', JSON.stringify(data.user))

    setSession({ access_token: data.access_token })
    setUserRole(data.user.role)
    setUser(data.user)

    return data
  }

  const loginAsGuest = (role) => {
    const guestUser = role === 'tho'
      ? {
          id: 'guest-tho-001',
          employee_id: 'THO-DEMO-001',
          name: 'Dr. Ramesh Patil',
          role: 'tho',
          designation: 'Taluka Health Officer',
          district: 'Bengaluru',
          state: 'Karnataka',
          email: 'ramesh.patil@health.maha.gov.in',
          phone: '+91 98765 43210',
          guest: true,
        }
      : {
          id: 'guest-asha-001',
          employee_id: 'ASHA-DEMO-001',
          name: '',
          role: 'asha',
          designation: 'ASHA Worker',
          village: 'Wadgaon Sheri',
          block: 'Haveli',
          district: 'Bengaluru',
          state: 'Karnataka',
          email: '',
          phone: '+91 87654 32109',
          patientsCount: 42,
          guest: true,
        }

    localStorage.removeItem('access_token')
    localStorage.setItem('userRole', role)
    localStorage.setItem('user', JSON.stringify(guestUser))
    localStorage.setItem('asha_bypass', role === 'asha' ? 'true' : 'false')
    localStorage.setItem('tho_bypass', role === 'tho' ? 'true' : 'false')

    setSession({ access_token: null })
    setUserRole(role)
    setUser(guestUser)

    return guestUser
  }

  const logout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    localStorage.removeItem('asha_bypass')
    localStorage.removeItem('tho_bypass')

    setSession(null)
    setUserRole(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, userRole, user, loading, login, loginAsGuest, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

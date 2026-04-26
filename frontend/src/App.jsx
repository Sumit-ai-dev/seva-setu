import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

import ASHADashboardPage from './pages/asha/ASHADashboardPage.jsx'
import PatientFormPage from './pages/asha/PatientFormPage.jsx'
import ChatPage from './pages/asha/ChatPage.jsx'
import ISLPage from './pages/asha/ISLPage.jsx'
import ProfilePage from './pages/asha/ProfilePage.jsx'
import ChildbirthPage from './pages/asha/ChildbirthPage.jsx'
import MedicalQRPage from './pages/asha/MedicalQRPage.jsx'
import PatientRecordPage from './pages/PatientRecordPage.jsx'
import QrScannerPage from './pages/QrScannerPage.jsx'

import THODashboardPage from './pages/tho/THODashboardPage.jsx'
import THOMapPage from './pages/tho/THOMapPage.jsx'
import THOLoginPage from './pages/tho/THOLoginPage.jsx'
import THOAshaWorkersPage from './pages/tho/THOAshaWorkersPage.jsx'
import THOAnalyticsPage from './pages/tho/THOAnalyticsPage.jsx'

import LandingPage from './pages/landing/LandingPage.jsx'
import RoleSelectionPage from './pages/landing/RoleSelectionPage.jsx'
import UnderConstructionPage from './pages/landing/UnderConstructionPage.jsx'
import OurWorkPage from './pages/landing/OurWorkPage.jsx'
import ImpactPage from './pages/landing/ImpactPage.jsx'


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PatientProvider>
            <Routes>
              {/* Landing & Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/our-work" element={<OurWorkPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/roles" element={<RoleSelectionPage />} />
              <Route path="/under-construction" element={<UnderConstructionPage />} />
              <Route path="/login/tho" element={<THOLoginPage />} />

              {/* Public — doctor scans QR to view patient history (no auth) */}
              <Route path="/patient-record/:id" element={<PatientRecordPage />} />
              <Route path="/patient-record" element={<PatientRecordPage />} />
              <Route path="/scan" element={<QrScannerPage />} />

              {/* ASHA Portal */}
              <Route path="/home" element={<ProtectedRoute role="asha"><ASHADashboardPage /></ProtectedRoute>} />
              <Route path="/patient" element={<ProtectedRoute role="asha"><PatientFormPage /></ProtectedRoute>} />
              <Route path="/medical-qr" element={<ProtectedRoute role="asha"><MedicalQRPage /></ProtectedRoute>} />
              <Route path="/isl" element={<ProtectedRoute role="asha"><ISLPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute role="asha"><ChatPage /></ProtectedRoute>} />
              <Route path="/childbirth" element={<ProtectedRoute role="asha"><ChildbirthPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute role="asha"><ProfilePage /></ProtectedRoute>} />

              {/* THO Portal */}
              <Route path="/dashboard/tho" element={<ProtectedRoute role="tho"><THODashboardPage /></ProtectedRoute>} />
              <Route path="/dashboard/tho/analytics" element={<ProtectedRoute role="tho"><THOAnalyticsPage /></ProtectedRoute>} />
              <Route path="/dashboard/tho/ashas" element={<ProtectedRoute role="tho"><THOAshaWorkersPage /></ProtectedRoute>} />
              <Route path="/dashboard/tho/map" element={<ProtectedRoute role="tho"><THOMapPage /></ProtectedRoute>} />
            </Routes>
          </PatientProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

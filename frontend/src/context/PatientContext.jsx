import React, { createContext, useContext, useState } from 'react'

const PatientContext = createContext(null)

export function PatientProvider({ children }) {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    district: '',
    symptomText: '',
  })

  const [triageResult, setTriageResult] = useState(null)

  return (
    <PatientContext.Provider
      value={{ patientData, setPatientData, triageResult, setTriageResult }}
    >
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const ctx = useContext(PatientContext)
  if (!ctx) {
    throw new Error('usePatient must be used inside PatientProvider')
  }
  return ctx
}

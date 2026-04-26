import { useState, useCallback } from 'react'
import { getTriageSystemPrompt, geminiTriage } from '../lib/openai'
import { getHFTriage, getWHOTriage } from '../lib/triageHF'

export function useTriage() {
  const [result, setResult] = useState(null)
  const [hfResult, setHfResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runTriage = useCallback(async (symptomText, district) => {
    if (!symptomText || !district) {
      setError('Symptom text and district are required.')
      return null
    }

    // Basic validation: just ensure it's not completely empty or too short
    if (symptomText.trim().length < 3) {
      setError('Please describe the symptom clearly.')
      return null
    }
    if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(symptomText)) {
      setError('Symptoms description does not look valid. Please type real symptoms.')
      return null
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setHfResult(null)

    // Fire Gemini (primary) and HF (secondary suggestion) in parallel
    const [geminiSettled, hfSettled] = await Promise.allSettled([
      geminiTriage(getTriageSystemPrompt(district), symptomText),
      getHFTriage(symptomText),
    ])

    // ── Process Gemini (primary) ──────────────────────────────────────────────
    let parsed = null
    if (geminiSettled.status === 'fulfilled') {
      try {
        const raw = geminiSettled.value
        if (!raw) throw new Error('Empty response from AI model.')
        const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        parsed = JSON.parse(cleaned)
        if (
          !parsed.severity ||
          !Array.isArray(parsed.symptoms) ||
          typeof parsed.sickle_cell_risk !== 'boolean' ||
          !parsed.brief
        ) {
          throw new Error('Unexpected response format from AI model.')
        }
        setResult(parsed)
      } catch (err) {
        setError(err?.message || 'Failed to analyze symptoms. Please try again.')
        setLoading(false)
        return null
      }
    } else {
      setError(geminiSettled.reason?.message || 'Failed to analyze symptoms. Please try again.')
      setLoading(false)
      return null
    }

    // ── Process HF (secondary suggestion) ────────────────────────────────────
    const hfRaw = hfSettled.status === 'fulfilled' ? hfSettled.value : null
    const suggestion = hfRaw || getWHOTriage(symptomText)
    setHfResult(suggestion)

    setLoading(false)
    return parsed
  }, [])

  return { result, hfResult, loading, error, runTriage }
}

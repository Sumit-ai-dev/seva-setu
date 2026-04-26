/**
 * COVID-19 Outbreak Detector
 * Scans symptom text for COVID-related keywords and returns detection result.
 */

const COVID_KEYWORDS = ['covid', 'coronavirus', 'covid-19', 'covid19', 'sars-cov']

/**
 * Detects if the symptom text mentions COVID-19.
 * @param {string} symptomText - Raw symptom description from the ASHA worker
 * @returns {{ detected: boolean, disease: string|null }}
 */
export function detectContagiousDisease(symptomText) {
  if (!symptomText || typeof symptomText !== 'string') {
    return { detected: false, disease: null }
  }

  const lower = symptomText.toLowerCase()

  for (const keyword of COVID_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { detected: true, disease: 'COVID-19' }
    }
  }

  return { detected: false, disease: null }
}

export { COVID_KEYWORDS }

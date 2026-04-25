/**
 * triageHF.js — Hugging Face medical NLI triage layer
 *
 * Uses facebook/bart-large-mnli via HF Inference API to classify
 * symptom text into Emergency / Moderate / Stable.
 * Falls back to WHO keyword rules if HF is unavailable or too slow.
 *
 * This is a secondary suggestion layer — Gemini AI remains primary.
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN

// ── HF Inference API call ─────────────────────────────────────────────────────
export async function getHFTriage(symptoms) {
  if (!HF_TOKEN) return null

  try {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `ASHA worker in rural Karnataka reports: ${symptoms}. Common rural India conditions include pneumonia, malaria, dengue, severe diarrhoea, malnutrition, newborn danger signs.`,
          parameters: {
            candidate_labels: [
              'emergency - immediate referral needed: convulsions, severe breathing difficulty, unconscious, severe dehydration, high fever with rash, newborn not feeding',
              'moderate - urgent care within hours: fast breathing, moderate fever, some dehydration, persistent cough, weakness',
              'stable - home care and follow-up: mild fever, mild diarrhoea, cough without danger signs, good feeding',
            ],
            multi_label: false,
          },
        }),
      }
    )

    if (!res.ok) throw new Error(`HF API error: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    const topIdx = data.scores.indexOf(Math.max(...data.scores))
    const raw = data.labels[topIdx]
    const confidence = (data.scores[topIdx] * 100).toFixed(1)

    let label = 'stable'
    if (raw.toLowerCase().includes('emergency')) label = 'red'
    else if (raw.toLowerCase().includes('moderate')) label = 'yellow'
    else label = 'green'

    return { label, confidence, source: 'HF' }
  } catch (err) {
    console.warn('[HF] triage failed, WHO fallback will be used:', err.message)
    return null
  }
}

// ── WHO IMNCI keyword fallback ────────────────────────────────────────────────
export function getWHOTriage(symptoms) {
  const s = symptoms.toLowerCase()
  const emergency = [
    'convulsion', 'unconscious', 'not breathing', 'chest indrawing',
    'severe dehydration', 'not feeding', 'newborn', 'blood in stool',
    'high fever rash', 'unable to stand', 'fits', 'breathing difficulty',
    'chest pain', 'semi-conscious',
  ]
  const moderate = [
    'fast breathing', 'moderate fever', 'vomiting', 'diarrhoea',
    'weakness', 'not eating', 'cough', 'pain', 'swelling', 'headache',
    'fever', 'dizziness', 'fatigue', 'dehydrated',
  ]

  if (emergency.some((k) => s.includes(k)))
    return { label: 'red', confidence: 'rule-based', source: 'WHO' }
  if (moderate.some((k) => s.includes(k)))
    return { label: 'yellow', confidence: 'rule-based', source: 'WHO' }
  return { label: 'green', confidence: 'rule-based', source: 'WHO' }
}

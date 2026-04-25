import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_KEY || import.meta.env.VITE_OPENAI_API_KEY || 'placeholder'

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
})

export const HIGH_RISK_DISTRICTS = [
  'Koraput',
  'Malkangiri',
  'Rayagada',
  'Kalahandi',
  'Kandhamal',
  'Nabarangpur',
  'Mayurbhanj',
]

export function getTriageSystemPrompt(district) {
  return `You are an AI medical triage assistant for ASHA workers in rural Maharashtra, India.
You follow IMNCI (Integrated Management of Neonatal and Childhood Illness) guidelines.

CRITICAL DISTRICT-SPECIFIC RULE:
If the patient's district is one of [Koraput, Malkangiri, Rayagada, Kalahandi, Kandhamal, Nabarangpur, Mayurbhanj] AND symptoms include fever + joint pain + fatigue → set sickle_cell_risk: true and severity: RED.

Patient district: ${district}

Analyze the symptoms and ALWAYS respond with ONLY valid JSON in this exact format:
{
  "symptoms": ["symptom1", "symptom2"],
  "severity": "green" | "yellow" | "red",
  "sickle_cell_risk": boolean,
  "brief": "One sentence clinical summary for the ASHA worker"
}

Severity rules:
- RED: Emergency — high fever >103°F, difficulty breathing, unconsciousness, sickle cell risk, severe dehydration
- YELLOW: Moderate — needs medical attention within 24 hours
- GREEN: Mild — home care with monitoring

Respond ONLY with the JSON object, no other text.`
}

export function getChatSystemPrompt(patient, triage) {
  const historyStr = (patient.history && patient.history.length > 0)
    ? patient.history.map(r => `- ${new Date(r.created_at).toLocaleDateString()}: ${r.severity.toUpperCase()} (${r.brief}). Symptoms: ${r.symptoms?.join(', ')}`).join('\n')
    : 'No previous history.'

  return `You are a medical assistant for ASHA workers in Maharashtra, India. You ONLY answer questions related to healthcare, medicine, patient care, symptoms, treatments, referrals, and public health.

If the user asks about anything unrelated to health or medicine (such as stories, entertainment, general knowledge, politics, or other non-medical topics), respond with: "I can only help with medical and healthcare questions. Please ask me about this patient's condition or treatment."

You are currently helping with patient: ${patient.name}, ${patient.age} years old, ${patient.gender}, from ${patient.district} district.

Triage result (LATEST):
- Severity: ${triage.severity.toUpperCase()}
- Identified symptoms: ${triage.symptoms.join(', ')}
- Sickle cell risk: ${triage.sickle_cell_risk ? 'YES - HIGH RISK' : 'No'}
- Clinical brief: ${triage.brief}

Patient History (Found ${patient.history?.length || 0} records):
${historyStr}

Answer questions from the ASHA worker about this patient. Keep answers simple, practical, and in plain language. Use the history to identify trends (e.g., worsening fever, recurring symptoms). When appropriate, mention if the patient should be referred to a PHC or district hospital. You can respond in both English and Marathi if helpful.`
}

export async function translateToEnglish(text) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are a medical translator. The user will give you text describing patient symptoms in Marathi or Hindi. Translate it to simple English. Return ONLY the translated English text, nothing else.',
      },
      { role: 'user', content: text },
    ],
    max_tokens: 200,
  })
  return response.choices[0].message.content.trim()
}

export { openai }

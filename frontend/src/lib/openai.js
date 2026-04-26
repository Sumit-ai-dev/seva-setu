
// Dual-provider AI library: Gemini (primary) → OpenAI (fallback)
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

// ── Clients ──────────────────────────────────────────────────────────────────
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_KEY || ''

const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null
const openai = openaiKey
  ? new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true })
  : null

function log(provider, action) {
  console.log(`[AI] Using ${provider} for ${action}`)
}

// ── Karnataka-specific constants ─────────────────────────────────────────────
export const HIGH_RISK_DISTRICTS = [
  'Raichur', 'Yadgir', 'Kalaburagi', 'Bidar',
  'Koppal', 'Ballari', 'Vijayapura',
]

// ── Prompts ──────────────────────────────────────────────────────────────────
export function getTriageSystemPrompt(district) {
  return `You are an AI medical triage assistant for ASHA workers in rural Karnataka, India.
You follow IMNCI (Integrated Management of Neonatal and Childhood Illness) guidelines.

CRITICAL DISTRICT-SPECIFIC RULE:
If the patient's district is one of [Raichur, Yadgir, Kalaburagi, Bidar, Koppal, Ballari, Vijayapura] AND symptoms include fever + joint pain + fatigue → set sickle_cell_risk: true and severity: red.

Patient district: ${district}

Analyze the symptoms and ALWAYS respond with ONLY valid JSON in this exact format:
{
  "symptoms": ["symptom1", "symptom2"],
  "severity": "green" | "yellow" | "red",
  "sickle_cell_risk": boolean,
  "brief": "One sentence clinical summary for the ASHA worker"
}

Severity rules (be conservative — only escalate when clearly needed):
- red (Emergency): fever >103°F/39.4°C WITH danger signs (convulsions, unconsciousness, inability to drink, stiff neck), difficulty breathing, chest pain, severe dehydration (sunken eyes, not passing urine), sickle cell risk with fever+joint pain, postpartum haemorrhage, stroke signs
- yellow (Moderate): fever without danger signs, moderate pain, vomiting without dehydration, needs PHC visit within 24-48h
- green (Mild): headache, mild cough, mild fever <100°F, runny nose, minor rash, routine ANC/PNC visits — manage at home

Examples:
- "headache" → yellow (could be many causes, needs assessment)
- "high fever" alone → yellow unless danger signs present
- "fever with convulsions" → red
- "cough for 2 days" → green
- "chest pain difficulty breathing" → red

Respond ONLY with the JSON object, no other text.`
}

export function getChatSystemPrompt(patient, triage) {
  const historyStr = (patient.history && patient.history.length > 0)
    ? patient.history.map(r => `- ${new Date(r.created_at).toLocaleDateString()}: ${r.severity.toUpperCase()} (${r.brief}). Symptoms: ${r.symptoms?.join(', ')}`).join('\n')
    : 'No previous history.'

  return `You are a medical assistant for ASHA workers in Karnataka, India. You ONLY answer questions related to healthcare, medicine, patient care, symptoms, treatments, referrals, and public health.

If the user asks about anything unrelated to health or medicine (such as stories, entertainment, general knowledge, politics, or other non-medical topics), respond with: "I can only help with medical and healthcare questions. Please ask me about this patient's condition or treatment."

You are currently helping with patient: ${patient.name}, ${patient.age} years old, ${patient.gender}, from ${patient.district} district.

Triage result (LATEST):
- Severity: ${triage.severity.toUpperCase()}
- Identified symptoms: ${triage.symptoms.join(', ')}
- Sickle cell risk: ${triage.sickle_cell_risk ? 'YES - HIGH RISK' : 'No'}
- Clinical brief: ${triage.brief}

Patient History (Found ${patient.history?.length || 0} records):
${historyStr}

Answer questions from the ASHA worker about this patient. Keep answers simple, practical, and in plain language. Use the history to identify trends (e.g., worsening fever, recurring symptoms). When appropriate, mention if the patient should be referred to a PHC or district hospital. You can respond in both English and Kannada if helpful.`
}

// ── translateToEnglish: Gemini → OpenAI fallback ─────────────────────────────
export async function translateToEnglish(text) {
  const prompt = `You are a medical translator. Translate the following patient symptom description from Kannada or Hindi to simple English. Return ONLY the translated English text, nothing else.\n\nText: ${text}`

  // Try Gemini first
  if (genAI) {
    try {
      log('Gemini', 'translation')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.1 }
      })
      return result.response.text().trim()
    } catch (err) {
      console.warn('[AI] Gemini translation failed, falling back to OpenAI:', err.message)
    }
  }

  // Fallback to OpenAI
  if (openai) {
    log('OpenAI', 'translation')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a medical translator. The user will give you text describing patient symptoms in Kannada or Hindi. Translate it to simple English. Return ONLY the translated English text, nothing else.' },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
    })
    return response.choices[0].message.content.trim()
  }

  throw new Error('No AI provider available. Please set VITE_GEMINI_API_KEY or VITE_OPENAI_API_KEY.')
}

// ── geminiChat: Gemini → OpenAI fallback ─────────────────────────────────────
export async function geminiChat(systemPrompt, messages) {
  // Try Gemini first
  if (genAI) {
    try {
      log('Gemini', 'chat')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const history = []
      for (let i = 0; i < messages.length - 1; i++) {
        history.push({
          role: messages[i].role === 'assistant' ? 'model' : 'user',
          parts: [{ text: messages[i].content }]
        })
      }

      const chat = model.startChat({
        history,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 600, temperature: 0.4 }
      })

      const lastMessage = messages[messages.length - 1]
      const result = await chat.sendMessage(lastMessage.content)
      return result.response.text().trim()
    } catch (err) {
      console.warn('[AI] Gemini chat failed, falling back to OpenAI:', err.message)
    }
  }

  // Fallback to OpenAI
  if (openai) {
    log('OpenAI', 'chat')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.4,
      max_tokens: 600,
    })
    return response.choices[0]?.message?.content?.trim()
  }

  throw new Error('No AI provider available.')
}

// ── geminiTriage: Gemini → OpenAI fallback ───────────────────────────────────
export async function geminiTriage(systemPrompt, symptomText) {
  // Try Gemini first
  if (genAI) {
    try {
      log('Gemini', 'triage')
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nPatient symptoms: ${symptomText}` }]
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.2 }
      })
      return result.response.text().trim()
    } catch (err) {
      console.warn('[AI] Gemini triage failed, falling back to OpenAI:', err.message)
    }
  }

  // Fallback to OpenAI
  if (openai) {
    log('OpenAI', 'triage')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Patient symptoms: ${symptomText}` },
      ],
      temperature: 0.2,
      max_tokens: 300,
    })
    return response.choices[0]?.message?.content?.trim()
  }

  throw new Error('No AI provider available.')
}

// Legacy export
export { openai }

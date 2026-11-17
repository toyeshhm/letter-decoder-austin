import { SERVICES } from './_services.js'

const LANGUAGES = ['English', 'Spanish', 'Vietnamese', 'Arabic', 'Simplified Chinese', 'Dari', 'Pashto', 'Burmese', 'Swahili', 'French', 'Korean', 'Hindi']
const MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_B64 = 4_000_000
// Free-tier Gemini models 503 under load, so fall through to the next one.
const MODELS = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash-lite']

const S = { type: 'STRING' }
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_letter: { type: 'BOOLEAN' },
    category: { type: 'STRING', enum: Object.keys(SERVICES) },
    urgency: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    title: S, from: S, summary: S,
    deadline_date: { type: 'STRING', nullable: true },
    deadline_text: S, if_ignored: S,
    next_steps: { type: 'ARRAY', items: S },
    labels: {
      type: 'OBJECT',
      properties: { summary: S, deadline: S, if_ignored: S, next_steps: S, who_can_help: S, call: S, website: S, not_advice: S },
      required: ['summary', 'deadline', 'if_ignored', 'next_steps', 'who_can_help', 'call', 'website', 'not_advice'],
    },
  },
  required: ['is_letter', 'category', 'urgency', 'title', 'from', 'summary', 'deadline_text', 'if_ignored', 'next_steps', 'labels'],
}

function prompt(language, today) {
  return `You help people in Austin, Texas understand official letters they cannot easily read. Today is ${today}.
Read the photo. Write EVERY text field in ${language}, in plain words a 12-year-old understands, short sentences, no legal jargon. Be calm and accurate. Never invent facts that are not in the letter.
- is_letter: false if the photo is not a letter or official document.
- category: the kind of problem, used to pick a free local service.
- title: what this letter is, in under 8 words. from: who sent it.
- summary: 2 to 4 sentences: what it says and what they want from the reader.
- deadline_date: the most important deadline as YYYY-MM-DD, or null if none. deadline_text: that deadline in words with how many days are left from today, or say there is no clear deadline.
- if_ignored: what can realistically happen if the reader does nothing, based on the letter.
- next_steps: up to 3 concrete actions, most urgent first.
- urgency: high if action is needed within 7 days or they could lose housing, power, money or legal rights.
- labels: translate these UI words into ${language}: "What it says", "Deadline", "If you ignore it", "What to do next", "Free help in Austin", "Call", "Website", "This is not legal advice. Check with the free service below."`
}

// Shared by the local server and the Base44 server route. Returns { status, json }.
export async function decodeLetter(input, apiKey) {
  const { image, mime, language } = input ?? {}
  if (!LANGUAGES.includes(language)) return { status: 400, json: { error: 'Unknown language' } }
  if (!MIME.has(mime) || typeof image !== 'string' || !image.length || image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return { status: 400, json: { error: 'Send a JPEG, PNG or WebP photo under 3 MB' } }
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
  let r
  for (const model of MODELS) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(language, today) }, { inline_data: { mime_type: mime, data: image } }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2, thinkingConfig: model.startsWith('gemini-2.5') ? { thinkingBudget: 0 } : { thinkingLevel: 'low' } },
      }),
    })
    if (r.ok) break
    console.error('gemini', model, r.status, (await r.text()).slice(0, 300))
  }
  if (!r.ok) return { status: 502, json: { error: 'The reader is busy. Try again in a moment.' } }
  const data = await r.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  let out
  try { out = JSON.parse(text) } catch {
    console.error('bad model json', String(text).slice(0, 300))
    return { status: 502, json: { error: 'Could not read that photo. Try a sharper one.' } }
  }
  return { status: 200, json: { ...out, rtl: ['Arabic', 'Dari', 'Pashto'].includes(language), service: SERVICES[out.category] ?? SERVICES.other } }
}

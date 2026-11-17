import { decodeLetter } from './_core.js'

// Node-style handler for the local preview server (scripts/serve.mjs).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const { status, json } = await decodeLetter(req.body, process.env.GEMINI_API_KEY)
  res.status(status).json(json)
}

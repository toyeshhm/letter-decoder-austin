// Local preview: serves the static page and runs api/decode.js. Usage: node scripts/serve.mjs [port]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import handler from '../api/decode.js'

const root = path.resolve(import.meta.dirname, '..')
if (!process.env.GEMINI_API_KEY && fs.existsSync(path.join(root, '.env.local'))) process.loadEnvFile(path.join(root, '.env.local'))
const types = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.js': 'text/javascript', '.css': 'text/css' }

http.createServer(async (req, res) => {
  if (req.url === '/api/decode') {
    let raw = ''
    for await (const chunk of req) raw += chunk
    req.body = JSON.parse(raw || '{}')
    res.status = c => { res.statusCode = c; return res }
    res.json = b => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(b)) }
    return handler(req, res)
  }
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname === '/' ? '/index.html' : new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found') }
  res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}).listen(Number(process.argv[2] ?? 4321), () => console.log('Letter Decoder on http://localhost:' + (process.argv[2] ?? 4321)))

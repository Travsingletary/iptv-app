/**
 * Companion static + API server for production-like hosting.
 * Serves `dist/` and POST /api/assistant without requiring Vite middleware.
 *
 * Usage:
 *   npm run build
 *   npm run start:api
 *
 * If you deploy pure static files without this process, the browser still
 * falls back to in-app `assistantCore` via `askAssistant()`.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const bundlePath = path.join(__dirname, '.assistant-core.bundle.mjs')
const port = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

async function loadAssistant() {
  await build({
    entryPoints: [path.join(root, 'src/lib/assistantCore.ts')],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  })
  return import(`${pathToFileURL(bundlePath).href}?t=${Date.now()}`)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(payload))
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0])
  const target = path.normalize(path.join(base, decoded))
  if (!target.startsWith(base)) return null
  return target
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url
  let filePath = safeJoin(distDir, urlPath || '/index.html')
  if (!filePath) {
    res.writeHead(403).end('Forbidden')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html')
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404).end('Not found')
    return
  }

  const ext = path.extname(filePath)
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
}

const { resolveAssistantReply } = await loadAssistant()

const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith('/api/assistant')) {
      if (req.method === 'GET' || req.method === 'HEAD') {
        const configured = Boolean(process.env.OPENAI_API_KEY)
        sendJson(res, 200, {
          ok: true,
          aiMode: configured ? 'live' : 'mock',
          configured,
        })
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' })
        return
      }
      const raw = await readBody(req)
      const parsed = JSON.parse(raw || '{}')
      const message = parsed.message?.trim()
      const context = parsed.context
      if (!message || !context) {
        sendJson(res, 400, { error: 'message and context are required' })
        return
      }
      const result = await resolveAssistantReply(message, context, {
        modelConfigured: Boolean(process.env.OPENAI_API_KEY),
        apiKey: process.env.OPENAI_API_KEY,
        provider: process.env.AI_PROVIDER,
        baseUrl: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL,
        confirmed: Boolean(parsed.confirmed),
      })
      sendJson(res, 200, result)
      return
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(req, res)
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    sendJson(res, 500, {
      error: 'assistant server failure',
      detail: error instanceof Error ? error.message : 'unknown',
    })
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Aether companion listening on http://0.0.0.0:${port}`)
  console.log(`Serving ${distDir} + POST /api/assistant`)
})

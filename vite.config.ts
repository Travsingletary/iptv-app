import { defineConfig, type Connect, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveAssistantReply } from './src/lib/assistantCore.ts'

interface AssistantRequestBody {
  message?: string
  context?: Parameters<typeof resolveAssistantReply>[1]
  confirmed?: boolean
}

function attachAssistantMiddleware(middlewares: Connect.Server) {
  middlewares.use('/api/assistant', async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', async () => {
      try {
        const parsed = (JSON.parse(body || '{}') as AssistantRequestBody) || {}
        const message = parsed.message?.trim()
        const context = parsed.context
        if (!message || !context) {
          res.statusCode = 400
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'message and context are required' }))
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
        res.statusCode = 200
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(result))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('content-type', 'application/json')
        res.end(
          JSON.stringify({
            error: 'assistant middleware failure',
            detail: error instanceof Error ? error.message : 'unknown',
          }),
        )
      }
    })
  })
}

function assistantApiPlugin() {
  return {
    name: 'aether-assistant-api',
    configureServer(server: ViteDevServer) {
      attachAssistantMiddleware(server.middlewares)
    },
    configurePreviewServer(server: PreviewServer) {
      attachAssistantMiddleware(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [react(), assistantApiPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})

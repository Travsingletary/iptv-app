import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveAssistantReply } from './src/lib/assistantCore'

interface AssistantRequestBody {
  message?: string
  context?: Parameters<typeof resolveAssistantReply>[1]
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'aether-assistant-api',
      // Dev-only API middleware for Vite. This keeps `/api/assistant`
      // available without adding a standalone backend in Phase 1.
      configureServer(server) {
        server.middlewares.use('/api/assistant', async (req, res) => {
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
                modelConfigured: Boolean(process.env.AI_PROVIDER || process.env.OPENAI_API_KEY),
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
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
})

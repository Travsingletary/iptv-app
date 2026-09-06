import type { AssistantApiResult, AssistantContextSnapshot } from './assistantCore'
import { resolveAssistantReply } from './assistantCore'

/**
 * Prefer `/api/assistant` (Vite middleware or companion server).
 * Fall back to in-browser `assistantCore` when the endpoint is missing
 * (static hosting / preview without middleware).
 */
export async function askAssistant(
  message: string,
  context: AssistantContextSnapshot,
  options: { confirmed?: boolean } = {},
): Promise<{ result: AssistantApiResult; source: 'api' | 'local' }> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message,
        context,
        confirmed: options.confirmed ?? false,
      }),
    })
    if (response.ok) {
      const result = (await response.json()) as AssistantApiResult
      return { result, source: 'api' }
    }
  } catch {
    // Network / CORS / missing route — use local core.
  }

  const apiKey =
    (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) || undefined
  const modelConfigured = Boolean(
    import.meta.env.VITE_AI_PROVIDER || apiKey,
  )
  const result = await resolveAssistantReply(message, context, {
    modelConfigured,
    apiKey,
    provider: import.meta.env.VITE_AI_PROVIDER as string | undefined,
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL as string | undefined,
    confirmed: options.confirmed,
  })
  return { result, source: 'local' }
}

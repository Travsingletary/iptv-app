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
): Promise<{ result: AssistantApiResult; source: 'api' | 'local' }> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, context }),
    })
    if (response.ok) {
      const result = (await response.json()) as AssistantApiResult
      return { result, source: 'api' }
    }
  } catch {
    // Network / CORS / missing route — use local core.
  }

  const modelConfigured = Boolean(
    import.meta.env.VITE_AI_PROVIDER || import.meta.env.VITE_OPENAI_API_KEY,
  )
  const result = await resolveAssistantReply(message, context, { modelConfigured })
  return { result, source: 'local' }
}

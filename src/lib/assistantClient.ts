import type { AssistantApiResult, AssistantContextSnapshot } from './assistantCore'
import { resolveAssistantReply } from './assistantCore'
import { hasByokApiKey, loadAiByokSettings } from './aiByok'
import { resolveClientProviderOptions } from './aiMode'
import { getLastProviderError } from './providerAdapter'

/**
 * Prefer on-device BYOK (Settings key) so Fire Stick APK works without a server.
 * Otherwise try `/api/assistant` (Vite middleware / companion).
 * Fall back to in-browser mock/local core when the endpoint is missing.
 */
export async function askAssistant(
  message: string,
  context: AssistantContextSnapshot,
  options: { confirmed?: boolean } = {},
): Promise<{ result: AssistantApiResult; source: 'api' | 'local' | 'byok' }> {
  const clientProvider = resolveClientProviderOptions()
  const byokActive = hasByokApiKey(loadAiByokSettings())

  // BYOK wins: call the provider directly from the WebView / browser.
  if (byokActive && clientProvider) {
    const result = await resolveAssistantReply(message, context, {
      ...clientProvider,
      confirmed: options.confirmed,
    })
    if (result.aiMode === 'mock' && clientProvider.apiKey) {
      const err = getLastProviderError()
      if (err) {
        return {
          result: {
            ...result,
            response: [
              `Live AI unavailable (${err.code}): ${err.message}`,
              'Using Mock AI for this reply. Fix the key, try OpenRouter/Groq, or set an API proxy URL in Settings.',
              result.response,
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
          source: 'byok',
        }
      }
    }
    return { result, source: 'byok' }
  }

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

  const result = await resolveAssistantReply(message, context, {
    modelConfigured: Boolean(clientProvider?.modelConfigured),
    apiKey: clientProvider?.apiKey,
    provider: clientProvider?.provider,
    baseUrl: clientProvider?.baseUrl,
    model: clientProvider?.model,
    confirmed: options.confirmed,
  })
  return { result, source: 'local' }
}

# Bring-your-own-key (BYOK) Assistant AI

SteadyStream testers can paste **their own** API key in **Settings → Assistant AI**. No server `.env` is required on Fire Stick APK builds.

## How testers add a key

1. Open **Settings** (TV remote: navigate to Settings).
2. Find **Assistant AI**.
3. Pick a **Provider** preset.
4. Enter your **API key** → **Save key**.
5. Optional: model override, custom base URL, or **API proxy URL**.
6. Tap **Test connection**.
7. Status badge shows **Live AI · &lt;provider&gt;** or **Mock AI**.

**Clear key** removes the secret and returns to honest Mock AI.

## Providers

| Preset | Transport | Default model | Notes |
|--------|-----------|---------------|-------|
| OpenAI | OpenAI chat/completions | `gpt-4o-mini` | Browser/WebView CORS often blocked — use proxy or OpenRouter |
| Anthropic | Anthropic Messages API | `claude-3-5-haiku-latest` | CORS risk; proxy recommended on APK/web |
| Google Gemini | OpenAI-compatible Gemini endpoint | `gemini-2.0-flash` | CORS varies |
| Groq | OpenAI-compatible | `llama-3.3-70b-versatile` | Usually works from browser/WebView |
| OpenRouter | OpenAI-compatible | `openai/gpt-4o-mini` | **Recommended for Fire Stick** — CORS-friendly, many models |
| Custom | OpenAI-compatible | user-defined | Requires base URL `…/v1` |

Anthropic / Gemini can also be used via **OpenRouter** (paste an OpenRouter key and set the OpenRouter model id).

## Mock vs Live

- **No key** → **Mock AI** (deterministic on-device tools). Never pretends to be live.
- **BYOK key saved** → client calls the provider **directly** from the WebView/browser (source `byok`). Works on APK without a Node server.
- **Server `OPENAI_API_KEY`** (dev / `start:api`) → Live via `/api/assistant` when BYOK is empty.
- If Live fails (CORS/auth), the assistant shows a clear error and falls back to Mock for that reply.

## APK / Fire Stick

Sideloaded builds do **not** ship with a server `.env`. BYOK is the supported path:

1. Prefer **OpenRouter** or **Groq**.
2. If OpenAI/Anthropic CORS-block the WebView, set **API proxy URL** to a self-hosted OpenAI-compatible relay that forwards `Authorization`.
3. Shipping this UI requires an APK rebuild that includes these web assets (separate from this branch’s docs-only note — parent will rebuild).

## Security

- Keys are stored in **localStorage** (`steadystream_ai_byok`) on the device.
- Keys are **never** committed; `.env*` is gitignored; UI shows a **masked** key only.
- Provider errors and logs must **not** include the full key.
- Treat shared Fire Sticks as untrusted — use expendable test keys.

## CORS limits

Many providers block browser `Origin` / Capacitor WebView origins. OpenRouter is designed for browser use. For blocked providers, run a tiny relay:

```text
Browser/WebView → https://your-proxy/v1/chat/completions → Provider
```

Point **API proxy URL** at `https://your-proxy/v1`.

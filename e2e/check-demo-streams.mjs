/**
 * Quick demo stream URL reachability check (Phase 6 hardening).
 * Does not fail the suite on partial CDN flakes — only fails if all URLs die.
 */
const DEMO_URLS = [
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  'https://test-streams.mux.dev/test_001/stream.m3u8',
  'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
  'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
  'https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8',
]

const out = []

for (const url of DEMO_URLS) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8_000)
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { range: 'bytes=0-64' },
    })
    clearTimeout(timer)
    const ok = res.ok || res.status === 206
    out.push({ url, status: res.status, ok })
    console.log(`${ok ? 'OK' : 'WARN'} ${res.status} ${url}`)
  } catch (err) {
    out.push({
      url,
      status: 0,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
    console.log(`WARN 0 ${url} (${err instanceof Error ? err.message : err})`)
  }
}

const failed = out.filter((r) => !r.ok)
console.log(`demo_streams checked=${out.length} warn=${failed.length}`)
if (failed.length === out.length) {
  console.error('DEMO_STREAMS_ALL_UNREACHABLE')
  process.exitCode = 1
} else {
  console.log('DEMO_STREAMS_CHECK_DONE')
}

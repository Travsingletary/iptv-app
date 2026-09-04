import type { Channel, EpgProgram, PlaylistSource } from '../types/iptv'

/** Public HLS samples for a working demo without a paid IPTV sub. */
const DEMO_STREAMS = {
  bigBuck: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  appleBipbop:
    'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
  tears:
    'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  /** Mux secondary sample (replaces Akamai Sintel which returns 403). */
  muxAlt: 'https://test-streams.mux.dev/test_001/stream.m3u8',
  ocean: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
  fmp4: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
  bbb: 'https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8',
}

const logos = {
  news: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=200&fit=crop',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=200&h=200&fit=crop',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop',
  kids: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=200&h=200&fit=crop',
  doc: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200&h=200&fit=crop',
  music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
}

const posters = {
  aurora: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=900&fit=crop',
  drift: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&h=900&fit=crop',
  harbor: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&h=900&fit=crop',
  ember: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=900&fit=crop',
  glass: 'https://images.unsplash.com/photo-1594908900066-3f47337549aa?w=600&h=900&fit=crop',
  night: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&h=900&fit=crop',
}

export const DEMO_SOURCE: PlaylistSource = {
  id: 'demo',
  name: 'Aether Demo Pack',
  type: 'demo',
  createdAt: Date.now(),
}

export const DEMO_CHANNELS: Channel[] = [
  {
    id: 'live_aether_one',
    name: 'Aether One',
    group: 'Entertainment',
    url: DEMO_STREAMS.bigBuck,
    kind: 'live',
    tvgId: 'aether.one',
    logo: logos.cinema,
    quality: '4K',
    description: 'Flagship entertainment channel with cinematic premieres.',
  },
  {
    id: 'live_pulse_news',
    name: 'Pulse News 24',
    group: 'News',
    url: DEMO_STREAMS.appleBipbop,
    kind: 'live',
    tvgId: 'pulse.news',
    logo: logos.news,
    quality: 'HD',
    description: 'Rolling world coverage and evening bulletins.',
  },
  {
    id: 'live_arena_sports',
    name: 'Arena Sports HD',
    group: 'Sports',
    url: DEMO_STREAMS.bbb,
    kind: 'live',
    tvgId: 'arena.sports',
    logo: logos.sports,
    quality: 'HD',
    catchup: true,
    description: 'Live match nights, highlights, and analysis.',
  },
  {
    id: 'live_horizon_docs',
    name: 'Horizon Docs',
    group: 'Documentary',
    url: DEMO_STREAMS.tears,
    kind: 'live',
    tvgId: 'horizon.docs',
    logo: logos.doc,
    quality: 'HD',
    description: 'Nature, space, and investigative long-form.',
  },
  {
    id: 'live_lumen_kids',
    name: 'Lumen Kids',
    group: 'Kids',
    url: DEMO_STREAMS.fmp4,
    kind: 'live',
    tvgId: 'lumen.kids',
    logo: logos.kids,
    quality: 'HD',
    description: 'Animated adventures for younger viewers.',
  },
  {
    id: 'live_wave_music',
    name: 'Wave Music TV',
    group: 'Music',
    url: DEMO_STREAMS.ocean,
    kind: 'live',
    tvgId: 'wave.music',
    logo: logos.music,
    quality: 'HD',
    description: 'Non-stop videos and live sessions.',
  },
  {
    id: 'live_noir_cinema',
    name: 'Noir Cinema',
    group: 'Movies',
    url: DEMO_STREAMS.tears,
    kind: 'live',
    tvgId: 'noir.cinema',
    logo: logos.cinema,
    quality: '4K',
    description: 'Classic and contemporary film blocks.',
  },
  {
    id: 'live_metro_local',
    name: 'Metro Local',
    group: 'Local',
    url: DEMO_STREAMS.bigBuck,
    kind: 'live',
    tvgId: 'metro.local',
    logo: logos.news,
    quality: 'HD',
    description: 'Community news and regional programming.',
  },
  {
    id: 'movie_aurora_drift',
    name: 'Aurora Drift',
    group: 'VOD · Action',
    url: DEMO_STREAMS.muxAlt,
    kind: 'movie',
    poster: posters.aurora,
    backdrop: posters.aurora,
    year: 2024,
    rating: 'PG-13',
    quality: '4K',
    description: 'A courier races across a fractured coastal megacity before dawn.',
  },
  {
    id: 'movie_glass_harbor',
    name: 'Glass Harbor',
    group: 'VOD · Drama',
    url: DEMO_STREAMS.tears,
    kind: 'movie',
    poster: posters.harbor,
    backdrop: posters.harbor,
    year: 2023,
    rating: 'R',
    quality: 'HD',
    description: 'Two siblings inherit a failing shipyard and a buried secret.',
  },
  {
    id: 'movie_ember_protocol',
    name: 'Ember Protocol',
    group: 'VOD · Sci-Fi',
    url: DEMO_STREAMS.fmp4,
    kind: 'movie',
    poster: posters.ember,
    backdrop: posters.ember,
    year: 2025,
    rating: 'PG-13',
    quality: '4K',
    description: 'An engineer unlocks a dormant orbital defense network.',
  },
  {
    id: 'movie_night_circuit',
    name: 'Night Circuit',
    group: 'VOD · Thriller',
    url: DEMO_STREAMS.ocean,
    kind: 'movie',
    poster: posters.night,
    backdrop: posters.night,
    year: 2022,
    rating: 'R',
    quality: 'HD',
    description: 'A late-night DJ receives encrypted calls from a stranger.',
  },
  {
    id: 'movie_soft_static',
    name: 'Soft Static',
    group: 'VOD · Indie',
    url: DEMO_STREAMS.bigBuck,
    kind: 'movie',
    poster: posters.glass,
    backdrop: posters.glass,
    year: 2021,
    rating: 'PG',
    quality: 'HD',
    description: 'A radio archivist maps forgotten frequencies of a vanished town.',
  },
  {
    id: 'series_drift_s1',
    name: 'The Drift — S1',
    group: 'Series',
    url: DEMO_STREAMS.appleBipbop,
    kind: 'series',
    poster: posters.drift,
    backdrop: posters.drift,
    year: 2024,
    rating: 'TV-14',
    quality: '4K',
    description: 'Eight episodes following a salvage crew in deep-water ruins.',
  },
]

const SHOW_TITLES: Record<string, string[]> = {
  'aether.one': [
    'Prime Cut',
    'Late Frame',
    'Studio After Dark',
    'Weekend Reel',
    'Aether Originals',
  ],
  'pulse.news': [
    'Morning Pulse',
    'World Desk',
    'Market Watch',
    'Evening Brief',
    'Night Desk Live',
  ],
  'arena.sports': [
    'Warm-Up Hour',
    'Match Center',
    'Halftime Report',
    'Postgame Live',
    'Arena Classics',
  ],
  'horizon.docs': [
    'Deep Blue',
    'Orbital Paths',
    'Vanishing Cities',
    'Field Notes',
    'Horizon Presents',
  ],
  'lumen.kids': [
    'Sky Pup Adventures',
    'Puzzle Planet',
    'Story Tree',
    'Maker Lab',
    'Bedtime Stars',
  ],
  'wave.music': [
    'Chart Wave',
    'Acoustic Lounge',
    'Beat Lab',
    'Guest Session',
    'Midnight Mix',
  ],
  'noir.cinema': [
    'Double Feature',
    'Director Spotlight',
    'Noir Hour',
    'Restored Classics',
    'Indie Block',
  ],
  'metro.local': [
    'City Morning',
    'Community Board',
    'Traffic & Weather',
    'Town Hall',
    'Nightly Metro',
  ],
}

function buildDemoEpg(now = Date.now()): EpgProgram[] {
  const programs: EpgProgram[] = []
  const startBase = now - 2 * 60 * 60_000

  for (const [channelId, titles] of Object.entries(SHOW_TITLES)) {
    let cursor = startBase - (channelId.length % 5) * 7 * 60_000
    for (let i = 0; i < 14; i += 1) {
      const duration = (40 + ((i * 7 + channelId.length) % 50)) * 60_000
      const title = titles[i % titles.length]
      programs.push({
        id: `demo_${channelId}_${i}`,
        channelId,
        title: i % 4 === 0 ? `${title} (Live)` : title,
        description: `${title} on ${channelId.replace('.', ' ')}. Curated for the Aether demo guide.`,
        category: channelId.includes('sports')
          ? 'Sports'
          : channelId.includes('news')
            ? 'News'
            : 'Entertainment',
        start: cursor,
        end: cursor + duration,
      })
      cursor += duration
    }
  }

  return programs
}

export const DEMO_EPG = buildDemoEpg()

export function refreshDemoEpg(now = Date.now()): EpgProgram[] {
  return buildDemoEpg(now)
}

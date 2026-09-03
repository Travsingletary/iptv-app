import { EpgGuide } from '../components/guide/EpgGuide'
import { useIptvStore } from '../store/useIptvStore'
import { Search } from 'lucide-react'

export function GuidePage() {
  const search = useIptvStore((s) => s.search)
  const setSearch = useIptvStore((s) => s.setSearch)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="absolute right-6 top-6 z-30 md:right-10">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter guide"
            className="w-48 rounded-full border border-white/10 bg-ink-900/80 py-2 pl-9 pr-3 text-sm backdrop-blur outline-none focus:border-ember-400/50 md:w-64"
          />
        </div>
      </div>
      <EpgGuide />
    </div>
  )
}

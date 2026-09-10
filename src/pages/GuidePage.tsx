import { EpgGuide } from '../components/guide/EpgGuide'

/** Guide route — search + smart categories live inside EpgGuide. */
export function GuidePage() {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <EpgGuide />
    </div>
  )
}

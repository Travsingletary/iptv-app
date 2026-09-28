# Fire Stick / lean-back remote (SteadyStream)

Web remote layer lives in `src/lib/fireStickRemote.ts` + `src/App.tsx` + spatial focus in `src/lib/tvFocus.ts`. Channel surfing helpers live in `src/lib/channelSurfing.ts` + `src/lib/surfingControls.ts`. Browser keyboard simulation matches Fire Stick D-pad.

Default mapping **mimics common TiviMate lean-back habits** (not a clone of their UI or trademarks). Live betting is deferred.

## Remote map (watching live / immersive)

| Fire Stick | Browser sim | Action |
| --- | --- | --- |
| **D-pad ↑ / ↓** | `ArrowUp` / `ArrowDown` | Channel zap (OSD + debounced tune) |
| **D-pad ←** | `ArrowLeft` | Open **Live channel side list** over video |
| **D-pad →** | `ArrowRight` | Previous / recent channel |
| **Select / OK** | `Enter` | Show player chrome / info; OK again (chrome up) opens Live list |
| **Back** | `Escape` / `Backspace` | Dismiss overlay → hide chrome → **open Guide** when already immersive |
| **0–9** | Digit keys | Number-pad LCN / index entry |
| **Menu** | `ContextMenu` / `R` (web) | Toggle overlay shell |

### When an overlay is open

| Control | Action |
| --- | --- |
| ↑↓←→ | Spatial focus (gold focus cursor) |
| OK | Activate focused control |
| Back | Dismiss overlay → immersive TV |

## TV-first shell

Primary nav (side rail): **Live TV · Guide · On Demand · Settings** only.  
Home hub / Favorites page / Multi-view live under **Settings → Playback & UI**.  
Assistant FAB is **off** by default (open from Settings).  
Tiny **Menu** control stays for web/mouse; prefer the physical remote on Fire Stick.

## Categories

Default Live/Guide chips are **provider folders** (real MegaOTT / Xtream `group` titles).  
Optional **Smart buckets** (News/Sports/…) under Settings → Live categories.

## Channel surfing

1. **Zap OSD** — ↑↓ while immersive (`data-testid="zap-osd"`).
2. **Debounced tune** — ~280ms idle before retune (`max_connections=1` safer).
3. **Number pad** — digits → LCN / index.
4. **Hop strip** — recents + favorites on the Live rail.
5. **Stable canvas** — single `VideoPlayer`; zaps change URL only.

Focus cursor: thick gold outline + glow on `[data-tv-focus]:focus` (`src/index.css`).

## Capacitor / Android TV leanback

See previous leanback packaging notes in git history / Android agent docs: `LEANBACK_LAUNCHER`, touchscreen/leanback `required=false`.

## Tests

```bash
npm test -- src/lib/fireStickRemote.test.ts src/lib/tvFocus.test.ts src/lib/categories.test.ts
AETHER_URL=http://127.0.0.1:5173 node e2e/verify-firestick-remote.mjs
```

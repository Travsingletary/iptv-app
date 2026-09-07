/**
 * Shared e2e artifact directory helper.
 * Prefer a local writable dir for reliability; publish key files to
 * /opt/cursor/artifacts for walkthrough upload when that mount works.
 */
import fs from 'node:fs'
import path from 'node:path'

const PREFERRED = '/opt/cursor/artifacts'
const LOCAL = path.resolve(process.cwd(), '.artifacts')

function canWrite(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    const probe = path.join(dir, `.probe_${process.pid}_${Date.now()}`)
    fs.writeFileSync(probe, 'ok')
    fs.unlinkSync(probe)
    return true
  } catch {
    return false
  }
}

/** Local-first: avoids intermittent EIO on the artifacts mount during long e2e runs. */
export function resolveArtifactDir() {
  fs.mkdirSync(LOCAL, { recursive: true })
  return LOCAL
}

export function safeWriteFile(filePath, contents) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, contents)
    return true
  } catch (err) {
    console.warn('safeWriteFile skipped:', err instanceof Error ? err.message : err)
    return false
  }
}

/** Best-effort copy into /opt/cursor/artifacts for walkthrough upload. */
export function publishArtifact(localPath, name = path.basename(localPath)) {
  if (!canWrite(PREFERRED)) {
    console.warn('publishArtifact: preferred mount unwritable')
    return null
  }
  const dest = path.join(PREFERRED, name)
  try {
    fs.copyFileSync(localPath, dest)
    return dest
  } catch (err) {
    console.warn('publishArtifact skipped:', err instanceof Error ? err.message : err)
    return null
  }
}

export function publishDir(localDir, names) {
  const published = []
  for (const name of names) {
    const src = path.join(localDir, name)
    if (!fs.existsSync(src)) continue
    const dest = publishArtifact(src, name)
    if (dest) published.push(dest)
  }
  return published
}

#!/usr/bin/env node
/**
 * CI-friendly full verification runner for phases 2–6 + finish pass.
 * Expects the app at AETHER_URL (default http://127.0.0.1:5173).
 *
 * Usage:
 *   npm run dev   # separate terminal / CI service
 *   npm run test:e2e
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scripts = [
  'verify-phase2.mjs',
  'verify-phase3.mjs',
  'verify-phase4.mjs',
  'verify-phase5.mjs',
  'verify-phase6.mjs',
  'verify-finish.mjs',
]

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script)], {
      stdio: 'inherit',
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${script} exited ${code}`))
    })
  })
}

console.log(`AETHER_URL=${process.env.AETHER_URL || 'http://127.0.0.1:5173'}`)
for (const script of scripts) {
  console.log(`\n=== ${script} ===`)
  await run(script)
}
console.log('\nVERIFY_ALL_OK')

#!/usr/bin/env node
/**
 * Runs Gradle assembleDebug for the Capacitor Android project.
 * Expects android/local.properties with sdk.dir=... (or ANDROID_HOME set).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const androidDir = join(root, 'android')
const gradlew = join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')
const localProps = join(androidDir, 'local.properties')

if (!existsSync(androidDir) || !existsSync(gradlew)) {
  console.error('Android project missing. Run: npx cap add android')
  process.exit(1)
}

const sdkHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
if (!existsSync(localProps) && sdkHome) {
  const sdkDir = sdkHome.replace(/\\/g, '/')
  writeFileSync(localProps, `sdk.dir=${sdkDir}\n`)
  console.log(`Wrote android/local.properties → sdk.dir=${sdkDir}`)
}

if (!existsSync(localProps) && !sdkHome) {
  console.error(
    [
      'Android SDK not configured.',
      'Set ANDROID_HOME (or ANDROID_SDK_ROOT) or create android/local.properties:',
      '  sdk.dir=/path/to/Android/sdk',
      'See docs/ANDROID_DISTRIBUTION.md',
    ].join('\n'),
  )
  process.exit(1)
}

const result = spawnSync(gradlew, ['assembleDebug', '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

if (result.status === 0) {
  console.log('\nAPK: android/app/build/outputs/apk/debug/app-debug.apk')
}

process.exit(result.status ?? 1)

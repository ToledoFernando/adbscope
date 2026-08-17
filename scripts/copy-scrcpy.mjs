// Copies scrcpy/ (adb.exe, scrcpy.exe, and their DLLs) into build/bin/
// alongside the compiled app, so `wails build` alone produces a
// self-contained package — no dependency on the user having the Android
// SDK or scrcpy installed separately. Wails runs `frontend:build` (see
// wails.json) before compiling the Go binary, but that only matters for
// timing relative to that step; this copy is independent of it.
import {cpSync, existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const src = join(rootDir, 'scrcpy')
const dest = join(rootDir, 'build', 'bin', 'scrcpy')

if (!existsSync(src)) {
  console.warn(`[copy-scrcpy] ${src} not found, skipping`)
  process.exit(0)
}

cpSync(src, dest, {recursive: true})
console.log(`[copy-scrcpy] copied ${src} -> ${dest}`)

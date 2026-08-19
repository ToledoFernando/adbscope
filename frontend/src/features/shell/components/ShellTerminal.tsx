import {useEffect, useRef, useState} from 'react'
import {Terminal} from '@xterm/xterm'
import {FitAddon} from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import {toast} from 'sonner'
import {useTranslation} from 'react-i18next'
import {Check, Palette} from 'lucide-react'
import {EventsOn} from '@/../wailsjs/runtime/runtime'
import {base64ToBytes, stringToBase64} from '@/lib/base64'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {startShell, stopShell, writeShell} from '../api'
import type {ShellOutput} from '../types'

interface ShellTerminalProps {
  deviceId: string
}

const PROMPT_COLOR_KEY = 'adbview.shell.promptColor'

const PROMPT_COLORS = [
  {nameKey: 'shell.colors.green', ansi: '32', swatch: '#4ade80'},
  {nameKey: 'shell.colors.cyan', ansi: '36', swatch: '#22d3ee'},
  {nameKey: 'shell.colors.yellow', ansi: '33', swatch: '#facc15'},
  {nameKey: 'shell.colors.magenta', ansi: '35', swatch: '#e879f9'},
  {nameKey: 'shell.colors.blue', ansi: '34', swatch: '#60a5fa'},
  {nameKey: 'shell.colors.white', ansi: '37', swatch: '#e5e5e5'},
] as const

function loadPromptColor(): string {
  const saved = localStorage.getItem(PROMPT_COLOR_KEY)
  return PROMPT_COLORS.some((c) => c.ansi === saved) ? saved! : PROMPT_COLORS[0].ansi
}

// Recolors the "user@host:path" part of the prompt by setting PS1 on the
// remote shell itself, rather than parsing/recoloring xterm's output
// stream client-side — the latter is fragile against arbitrary control
// sequences and multi-byte chunking. Built with $(...) substitutions
// instead of bash-only \u/\h/\w so it works on whatever shell the device
// ships (mksh, toybox sh, bash on rooted devices) — all POSIX shells
// re-expand PS1 before each prompt.
function buildPromptCommand(ansiCode: string) {
  return `export PS1='$(printf "\\033[${ansiCode}m")$(whoami)@$(hostname):$PWD$(printf "\\033[0m")$ '\n`
}

// A real terminal (xterm.js), not a text input that runs one-off
// commands — supports ANSI colors, cursor movement, line editing done by
// the remote shell itself, and raw control bytes (Ctrl+C is just
// onData delivering \x03, no special-casing needed).
//
// Known limitation: terminal resize only reflows the local xterm.js
// widget (via FitAddon). It does NOT tell the remote shell the new
// dimensions — that requires adb's client process to have a real local
// PTY to detect SIGWINCH from, which we don't give it (stdin is a Go
// pipe). Full-screen TUI apps (vim, top, htop) may render assuming the
// wrong size.
export function ShellTerminal({deviceId}: ShellTerminalProps) {
  const {t} = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [promptColor, setPromptColor] = useState(loadPromptColor)
  const promptColorRef = useRef(promptColor)
  promptColorRef.current = promptColor

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const term = new Terminal({
      convertEol: true,
      fontFamily: "'JetBrains Mono Variable', 'Cascadia Mono', Consolas, monospace",
      fontSize: 13,
      theme: {
        background: '#0d1116',
        foreground: '#e8ecf1',
        cursor: '#22d3ee',
        cursorAccent: '#0d1116',
        selectionBackground: 'rgba(34, 211, 238, 0.25)',
      },
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(el)
    fitAddon.fit()

    const dataDisposable = term.onData((data) => {
      writeShell(deviceId, stringToBase64(data)).catch(() => {})
    })

    startShell(deviceId)
      .then(() =>
        writeShell(deviceId, stringToBase64(buildPromptCommand(promptColorRef.current))),
      )
      .catch((err) => {
        term.writeln(`\r\n[error] ${String(err)}`)
        toast.error(String(err))
      })

    const off = EventsOn('shell.output', (payload: ShellOutput) => {
      if (payload.DeviceID !== deviceId) return
      term.write(base64ToBytes(payload.Data))
    })

    // Keeps the render/idle scheduler ticking while the shell is open. In
    // this WebView, a page with no ongoing animation can go long stretches
    // without an idle/frame slot, leaving freshly-arrived output queued
    // and unpainted until an unrelated input event (a keypress) gives the
    // browser a reason to run another frame.
    let rafId = requestAnimationFrame(function pump() {
      rafId = requestAnimationFrame(pump)
    })

    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      dataDisposable.dispose()
      off()
      stopShell(deviceId).catch(() => {})
      term.dispose()
    }
  }, [deviceId])

  function handleColorSelect(ansi: string) {
    setPromptColor(ansi)
    localStorage.setItem(PROMPT_COLOR_KEY, ansi)
    writeShell(deviceId, stringToBase64(buildPromptCommand(ansi))).catch(() => {})
  }

  return (
    <div className="flex h-full flex-col gap-2 p-12 pb-4 px-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-ink-muted uppercase">
          {t('shell.consoleLabel')}
        </span>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Palette />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('shell.promptColor')}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            {PROMPT_COLORS.map((color) => (
              <DropdownMenuItem key={color.ansi} onClick={() => handleColorSelect(color.ansi)}>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{backgroundColor: color.swatch}}
                />
                {t(color.nameKey)}
                {promptColor === color.ansi && <Check className="ml-auto h-3.5 w-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-h-0 flex-1 rounded-md border border-hairline-strong bg-panel-sunken p-3">
        <div ref={containerRef} className="h-full overflow-hidden" />
      </div>
    </div>
  )
}

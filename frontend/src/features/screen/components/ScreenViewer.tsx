import {useEffect, useRef, useState} from 'react'
import {toast} from 'sonner'
import {useTranslation} from 'react-i18next'
import {RefreshCcw, Settings2, Volume2, VolumeX} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {useDeviceStore} from '@/features/devices/store'
import {setScreenMirrorRect, setScreenMirrorVisible, startScreenMirror, stopScreenMirror} from '../api'

interface ScreenViewerProps {
  deviceId: string
}

const AUDIO_KEY = 'adbview.screen.audio'

function loadAudioEnabled(): boolean {
  return localStorage.getItem(AUDIO_KEY) === '1'
}

// The mirrored screen is a native scrcpy window embedded via Win32
// SetParent (see internal/infrastructure/scrcpy), not a canvas we draw
// to. This div just reserves screen space and reports its rect so Go can
// keep the native window positioned on top of it. Because it's a real
// native window and not part of the page's compositing, nothing in React
// can render visually on top of it — controls belong beside it, not over it.
export function ScreenViewer({deviceId}: ScreenViewerProps) {
  const {t} = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting')
  const [error, setError] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(loadAudioEnabled)
  const [restartKey, setRestartKey] = useState(0)
  const deviceOnline = useDeviceStore((s) => s.devices.some((d) => d.ID === deviceId && d.State === 'online'))

  // Audio is a launch-time flag for scrcpy, not something it can toggle on
  // a running session — audioEnabled/restartKey in the effect deps means
  // either one tears down and restarts the mirror.
  useEffect(() => {
    let cancelled = false
    setStatus('starting')
    setError(null)

    startScreenMirror(deviceId, audioEnabled)
      .then(() => !cancelled && setStatus('running'))
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setError(String(err))
        toast.error(String(err))
      })

    return () => {
      cancelled = true
      stopScreenMirror(deviceId).catch(() => {})
    }
  }, [deviceId, audioEnabled, restartKey])

  // The device list (kept in sync by useDeviceEvents) is the source of
  // truth for whether this device is still reachable. If it drops out
  // while we're mid-session, the mirror session was already stopped
  // centrally (see useDeviceEvents' device.disconnected handler) — this
  // just reflects that in the UI instead of leaving a frozen/blank native
  // window with no explanation.
  useEffect(() => {
    if (status !== 'running' || deviceOnline) return
    setStatus('error')
    setError(t('screenViewer.disconnected'))
  }, [status, deviceOnline, t])

  function handleReconnect() {
    setRestartKey((k) => k + 1)
  }

  function handleToggleAudio() {
    const next = !audioEnabled
    localStorage.setItem(AUDIO_KEY, next ? '1' : '0')
    setAudioEnabled(next)
  }

  useEffect(() => {
    if (status !== 'running') return
    const el = containerRef.current
    if (!el) return

    const dpr = window.devicePixelRatio || 1

    function report() {
      const rect = el!.getBoundingClientRect()
      setScreenMirrorRect(
        deviceId,
        Math.round(rect.x * dpr),
        Math.round(rect.y * dpr),
        Math.round(rect.width * dpr),
        Math.round(rect.height * dpr)
      ).catch(() => {})
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    window.addEventListener('resize', report)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', report)
    }
  }, [status, deviceId])

  // The mirror is a real native window (see the note above) — it always
  // renders above web content, so a Dialog/DropdownMenu/Select opened
  // anywhere in the app would otherwise visibly show through it. Radix's
  // scroll-lock (via react-remove-scroll) sets data-scroll-locked on
  // <body> for exactly the overlays that need this — modal dialogs and
  // menus — and leaves it off for non-modal ones like Tooltip, which is
  // also the behavior we want (no flicker on every hover).
  useEffect(() => {
    if (status !== 'running') return

    function syncVisibility() {
      const coveredByOverlay = document.body.hasAttribute('data-scroll-locked')
      setScreenMirrorVisible(deviceId, !coveredByOverlay).catch(() => {})
    }

    syncVisibility()
    const observer = new MutationObserver(syncVisibility)
    observer.observe(document.body, {attributes: true, attributeFilter: ['data-scroll-locked']})

    return () => {
      observer.disconnect()
      setScreenMirrorVisible(deviceId, true).catch(() => {})
    }
  }, [status, deviceId])

  return (
    <div className="flex flex-1 py-8 flex-col gap-2 overflow-hidden p-6">
      <div className="flex shrink-0 items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t('screenViewer.options')}>
              <Settings2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleReconnect}>
                <RefreshCcw />
                <p>{t('screenViewer.reconnect')}</p>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleToggleAudio}>
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <p>{audioEnabled ? t('screenViewer.audioOn') : t('screenViewer.audioOff')}</p>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {status === 'starting' && <p className="text-sm text-muted-foreground">{t('screenViewer.starting')}</p>}
      {status === 'error' && <p className="text-sm text-destructive">{error ?? t('screenViewer.error')}</p>}
      <div ref={containerRef} className="flex-1 -z-10 min-h-0 h-full bg-gray-100 dark:bg-[#0a0a0a] rounded-md border border-border"/>
    </div>
  )
}

import {type CSSProperties, type ReactNode, useEffect, useState} from 'react'
import {Copy, Minus, Square, X} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {cn} from '@/lib/utils'
import {
  Quit,
  WindowIsMaximised,
  WindowMinimise,
  WindowToggleMaximise,
} from '@/../wailsjs/runtime/runtime'
import SettingsModal from '@/features/Settings/components/SettingsModal'
import {APP_NAME} from '@/config'

// Wails reads this CSS custom property to decide which regions of a
// frameless window act as the native title bar (draggable, double-click
// to maximize). Buttons and other interactive children need the "no-drag"
// value or clicks get eaten by the drag handler instead of firing.
const dragRegion: CSSProperties = {['--wails-draggable' as string]: 'drag'}
const noDragRegion: CSSProperties = {['--wails-draggable' as string]: 'no-drag'}

interface TitleBarProps {
  leftContent?: ReactNode
}

export function TitleBar({leftContent}: TitleBarProps) {
  const {t} = useTranslation()
  const [isMaximised, setIsMaximised] = useState(false)

  useEffect(() => {
    WindowIsMaximised().then(setIsMaximised)
    // No dedicated Wails event for maximize/restore — a window resize
    // covers our own buttons plus external triggers (Windows snap,
    // double-click, keyboard shortcuts).
    const onResize = () => WindowIsMaximised().then(setIsMaximised)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      style={dragRegion}
      onDoubleClick={() => WindowToggleMaximise()}
      className="flex h-9 shrink-0 select-none items-center justify-between border-b border-hairline bg-panel"
    >
      <div style={noDragRegion} className="flex items-center gap-3 pl-1">
        <div className="flex items-center gap-2">
          <SettingsModal />
          <span className="size-1.5 rounded-full bg-state-live" aria-hidden />
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink uppercase">
            {APP_NAME}
          </span>
        </div>
        {leftContent}
      </div>

      <div style={noDragRegion} className="flex h-full items-center">
        <button
          type="button"
          aria-label={t('titleBar.minimize')}
          onClick={() => WindowMinimise()}
          className="flex h-full w-11 items-center justify-center text-ink-muted hover:bg-panel-raised hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={isMaximised ? t('titleBar.restore') : t('titleBar.maximize')}
          onClick={async () => {
            await WindowToggleMaximise()
            setIsMaximised(await WindowIsMaximised())
          }}
          className="flex h-full w-11 items-center justify-center text-ink-muted hover:bg-panel-raised hover:text-foreground"
        >
          {isMaximised ? <Copy className="h-3.5 w-3.5 -scale-x-100" /> : <Square className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          aria-label={t('titleBar.close')}
          onClick={() => Quit()}
          className={cn(
            'flex h-full w-11 items-center justify-center text-ink-muted',
            'hover:bg-state-fault hover:text-void',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

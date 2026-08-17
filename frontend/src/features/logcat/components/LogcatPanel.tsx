import {ChevronDown, ChevronUp, Pause, Play, Trash2} from 'lucide-react'
import {useTranslation} from 'react-i18next'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import {useDeviceStore} from '@/features/devices/store'
import {useLogcatStream} from '../hooks/useLogcatStream'
import {useLogcatStore} from '../store'
import type {LogLevel} from '../types'
import {LogcatList} from './LogcatList'
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable'

const LEVELS: LogLevel[] = ['V', 'D', 'I', 'W', 'E', 'F']

// Collapsible bottom panel, VS Code terminal-style: closed by default,
// only connects the logcat stream while open (useLogcatStream tears the
// stream down on close/unmount), so an idle device isn't logged forever.
// isOpen lives in the store (not local state) so a "disconnect device"
// action elsewhere can close it, which is what stops the process.
//
// Sizing is owned by the parent, not this component: when open, AppShell
// renders it inside a ResizablePanel (so it fills whatever height the
// drag handle gives it — h-full below); when closed, it's rendered as a
// plain flex child sized to its own content (just the toggle bar).
export function LogcatPanel() {
  const {t} = useTranslation()
  const isOpen = useLogcatStore((s) => s.isOpen)
  const setOpen = useLogcatStore((s) => s.setOpen)
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId)

  const LEVEL_LABELS: Record<LogLevel, string> = {
    V: t('logcat.levels.V'),
    D: t('logcat.levels.D'),
    I: t('logcat.levels.I'),
    W: t('logcat.levels.W'),
    E: t('logcat.levels.E'),
    F: t('logcat.levels.F'),
  }

  useLogcatStream(selectedDeviceId, isOpen)

  const entries = useLogcatStore((s) => s.entries)
  const isPaused = useLogcatStore((s) => s.isPaused)
  const search = useLogcatStore((s) => s.search)
  const levelFilter = useLogcatStore((s) => s.levelFilter)
  const setPaused = useLogcatStore((s) => s.setPaused)
  const setSearch = useLogcatStore((s) => s.setSearch)
  const setLevelFilter = useLogcatStore((s) => s.setLevelFilter)
  const clear = useLogcatStore((s) => s.clear)

  if (!isOpen) return null;

  return (
    <>
    <ResizableHandle withHandle />
    <ResizablePanel maxSize={"50%"} minSize={30} className={cn('flex flex-col border-t border-border', isOpen ? 'h-full' : 'shrink-0')}>
      <button
        onClick={() => setOpen(!isOpen)}
        className="flex h-8 shrink-0 items-center gap-2 px-4 text-xs text-muted-foreground hover:bg-accent"
      >
        {isOpen ? <ChevronDown className="size-3.5"/> : <ChevronUp className="size-3.5"/>}
        <span className="font-medium">{t('logcat.title')}</span>
        {!selectedDeviceId && <span>{t('logcat.selectDevice')}</span>}
      </button>

      {isOpen && (
        <div className="flex flex-1 flex-col overflow-hidden border-t border-border">
          <div className="flex shrink-0 items-center gap-2 px-2 py-1.5">
            <Input
              placeholder={t('logcat.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 max-w-xs text-xs"
            />
            <div className="flex gap-0.5">
              {LEVELS.map((level) => (
                <Tooltip key={level}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant={levelFilter === level ? 'secondary' : 'ghost'}
                      onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                    >
                      {level}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {levelFilter === level
                        ? t('logcat.showingOnly', {level: LEVEL_LABELS[level]})
                        : t('logcat.filterTo', {level: LEVEL_LABELS[level]})}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="ml-auto flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" onClick={() => setPaused(!isPaused)}>
                    {isPaused ? <Play className="size-4"/> : <Pause className="size-4"/>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPaused ? t('logcat.resume') : t('logcat.pause')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="ghost" onClick={clear}>
                    <Trash2 className="size-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('logcat.clear')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <LogcatList entries={entries} search={search} levelFilter={levelFilter}/>
        </div>
      )}
    </ResizablePanel>
    </>
  )
}

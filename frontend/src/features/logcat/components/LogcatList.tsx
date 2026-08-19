import {useMemo, useRef} from 'react'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useTranslation} from 'react-i18next'
import {cn} from '@/lib/utils'
import type {LogEntry, LogLevel} from '../types'

// Severity reads as a colored left rail + level glyph, never a full-row
// wash — a noisy app's stream stays scannable instead of turning into a
// wall of red (see DESIGN.md's State-Only Rule).
const levelRailColors: Record<LogLevel, string> = {
  V: 'border-transparent',
  D: 'border-transparent',
  I: 'border-state-online/50',
  W: 'border-state-warning',
  E: 'border-state-fault',
  F: 'border-state-fault',
}

const levelGlyphColors: Record<LogLevel, string> = {
  V: 'text-ink-faint',
  D: 'text-ink-muted',
  I: 'text-state-online',
  W: 'text-state-warning',
  E: 'text-state-fault',
  F: 'text-state-fault',
}

interface LogcatListProps {
  entries: LogEntry[]
  search: string
  levelFilter: LogLevel | null
}

export function LogcatList({entries, search, levelFilter}: LogcatListProps) {
  const {t} = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)

  // entries arrives oldest-first (each batch is appended); reversed here
  // so the newest line renders at the top, visible without scrolling as
  // the stream grows instead of requiring a scroll-to-bottom to follow it.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries
      .filter((entry) => {
        if (levelFilter && entry.Level !== levelFilter) return false
        if (!query) return true
        return (
          entry.Tag.toLowerCase().includes(query) ||
          entry.Message.toLowerCase().includes(query) ||
          entry.Raw.toLowerCase().includes(query)
        )
      })
      .reverse()
  }, [entries, search, levelFilter])

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  })

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        {entries.length === 0 ? t('logcat.waiting') : t('logcat.noMatch')}
      </div>
    )
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto font-mono text-xs">
      <div style={{height: virtualizer.getTotalSize(), position: 'relative'}}>
        {virtualizer.getVirtualItems().map((row) => {
          const entry = filtered[row.index]
          return (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: row.size,
                transform: `translateY(${row.start}px)`,
              }}
              className={cn(
                'flex items-center gap-2 truncate border-l-2 pr-3 pl-2.5',
                levelRailColors[entry.Level],
                entry.Level === 'V' && 'opacity-60',
              )}
            >
              <span className="shrink-0 text-ink-faint">
                {new Date(entry.Timestamp).toLocaleTimeString()}
              </span>
              <span className={cn('w-3 shrink-0 font-semibold', levelGlyphColors[entry.Level])}>{entry.Level}</span>
              <span className="shrink-0 max-w-[12rem] truncate text-ink-muted">{entry.Tag}</span>
              <span className="truncate text-ink">{entry.Message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

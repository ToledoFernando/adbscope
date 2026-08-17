import {useMemo, useRef} from 'react'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useTranslation} from 'react-i18next'
import {cn} from '@/lib/utils'
import type {LogEntry, LogLevel} from '../types'

const levelColors: Record<LogLevel, string> = {
  V: 'text-muted-foreground',
  D: 'text-muted-foreground',
  I: 'text-foreground',
  W: 'text-amber-500',
  E: 'text-red-500',
  F: 'text-red-500',
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
              className={cn('flex items-center gap-2 truncate px-3', levelColors[entry.Level])}
            >
              <span className="shrink-0 text-muted-foreground">
                {new Date(entry.Timestamp).toLocaleTimeString()}
              </span>
              <span className="w-3 shrink-0 font-semibold">{entry.Level}</span>
              <span className="shrink-0 max-w-[12rem] truncate text-muted-foreground">{entry.Tag}</span>
              <span className="truncate">{entry.Message}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

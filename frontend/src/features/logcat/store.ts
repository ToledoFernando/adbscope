import {create} from 'zustand'
import type {LogEntry, LogLevel} from './types'

// Caps in-memory retention so a chatty device over a long session doesn't
// grow the store unbounded. Virtualization (LogcatList) handles render
// performance separately — this is purely a memory ceiling.
const MAX_ENTRIES = 10000

interface LogcatStore {
  entries: LogEntry[]
  isPaused: boolean
  search: string
  levelFilter: LogLevel | null
  // Lives here (not local component state) so external actions — like a
  // "disconnect this device" button — can close the panel, which is what
  // actually triggers useLogcatStream's cleanup and stops the process.
  isOpen: boolean

  addBatch: (entries: LogEntry[]) => void
  clear: () => void
  setPaused: (paused: boolean) => void
  setSearch: (search: string) => void
  setLevelFilter: (level: LogLevel | null) => void
  setOpen: (open: boolean) => void
  reset: () => void
}

export const useLogcatStore = create<LogcatStore>((set, get) => ({
  entries: [],
  isPaused: false,
  search: '',
  levelFilter: null,
  isOpen: false,

  addBatch: (batch) => {
    if (get().isPaused) return
    set((state) => {
      const merged = state.entries.concat(batch)
      const entries = merged.length > MAX_ENTRIES ? merged.slice(merged.length - MAX_ENTRIES) : merged
      return {entries}
    })
  },

  clear: () => set({entries: []}),
  setPaused: (isPaused) => set({isPaused}),
  setSearch: (search) => set({search}),
  setLevelFilter: (levelFilter) => set({levelFilter}),
  setOpen: (isOpen) => set({isOpen}),
  reset: () => set({entries: [], isPaused: false, search: '', levelFilter: null}),
}))

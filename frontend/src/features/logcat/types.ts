// Wails only generates TS types from bound method signatures, not from
// event payloads (EventsEmit) — these mirror domain.LogEntry and
// logcat.Batch (app.go / internal/application/logcat) by hand.

export type LogLevel = 'V' | 'D' | 'I' | 'W' | 'E' | 'F'

export interface LogEntry {
  Timestamp: string
  Level: LogLevel
  PID: number
  TID: number
  Tag: string
  Message: string
  Raw: string
}

export interface LogBatch {
  DeviceID: string
  Entries: LogEntry[]
}

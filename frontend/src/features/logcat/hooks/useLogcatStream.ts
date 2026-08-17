import {useEffect} from 'react'
import {toast} from 'sonner'
import {EventsOn} from '@/../wailsjs/runtime/runtime'
import {startLogcat, stopLogcat} from '../api'
import {useLogcatStore} from '../store'
import type {LogBatch} from '../types'

// Connects the logcat stream only while active (panel open + a device is
// selected) and disconnects otherwise — mirrors how a VS Code terminal
// only keeps its shell alive while the panel is visible.
export function useLogcatStream(deviceId: string | null, active: boolean) {
  const addBatch = useLogcatStore((s) => s.addBatch)
  const reset = useLogcatStore((s) => s.reset)

  useEffect(() => {
    if (!deviceId || !active) return

    reset()
    startLogcat(deviceId).catch((err) => toast.error(String(err)))

    const off = EventsOn('logcat.batch', (batch: LogBatch) => {
      if (batch.DeviceID !== deviceId) return
      addBatch(batch.Entries)
    })

    return () => {
      off()
      stopLogcat(deviceId).catch(() => {})
    }
  }, [deviceId, active, addBatch, reset])
}

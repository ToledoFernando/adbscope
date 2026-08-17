import {StartShell, StopShell, WriteShell} from '@/../wailsjs/go/main/App'

export function startShell(deviceId: string) {
  return StartShell(deviceId)
}

export function stopShell(deviceId: string) {
  return StopShell(deviceId)
}

// Wails' TS codegen mis-types the []byte param as number[] — Go's
// encoding/json (which Wails uses to decode call args) expects a base64
// string for a []byte parameter. See features/devices/api.ts for the
// symmetric case on a return value.
export function writeShell(deviceId: string, base64Data: string) {
  const write = WriteShell as unknown as (id: string, data: string) => Promise<void>
  return write(deviceId, base64Data)
}

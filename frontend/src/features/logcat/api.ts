import {StartLogcat, StopLogcat} from '@/../wailsjs/go/main/App'

export function startLogcat(deviceId: string) {
  return StartLogcat(deviceId)
}

export function stopLogcat(deviceId: string) {
  return StopLogcat(deviceId)
}

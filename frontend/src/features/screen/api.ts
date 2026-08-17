import {SetScreenMirrorRect, SetScreenMirrorVisible, StartScreenMirror, StopScreenMirror} from '@/../wailsjs/go/main/App'

export function startScreenMirror(deviceId: string, audio: boolean) {
  return StartScreenMirror(deviceId, audio)
}

export function stopScreenMirror(deviceId: string) {
  return StopScreenMirror(deviceId)
}

export function setScreenMirrorRect(deviceId: string, x: number, y: number, width: number, height: number) {
  return SetScreenMirrorRect(deviceId, x, y, width, height)
}

export function setScreenMirrorVisible(deviceId: string, visible: boolean) {
  return SetScreenMirrorVisible(deviceId, visible)
}

import {BuildRecordingPath, ChooseRecordingPath, SetScreenMirrorRect, SetScreenMirrorVisible, StartScreenMirror, StopScreenMirror} from '@/../wailsjs/go/main/App'

export function startScreenMirror(deviceId: string, audio: boolean, recordPath: string) {
  return StartScreenMirror(deviceId, audio, recordPath)
}

// Opens a native "Save As" dialog for a screen recording. Returns "" if
// the user cancels — callers should treat that as "don't start
// recording", not an error. Only needed when no default recordings
// folder is set (see buildRecordingPath / capturePathsStore).
export function chooseRecordingPath(deviceId: string, dialogTitle: string) {
  return ChooseRecordingPath(deviceId, dialogTitle)
}

// Builds a recording path inside dir with a generated filename, without
// prompting — used when a default recordings folder is configured.
export function buildRecordingPath(deviceId: string, dir: string) {
  return BuildRecordingPath(deviceId, dir)
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

import {
  BuildScreenshotPath,
  ChooseScreenshotPath,
  ConnectWiFi,
  DisconnectDevice,
  PairWiFi,
  RestartServer,
  SaveScreenshot,
  TakeScreenshot,
} from '@/../wailsjs/go/main/App'

export function connectWiFi(ip: string, port: string) {
  return ConnectWiFi(ip, port)
}

export function pairWiFi(ip: string, port: string, code: string) {
  return PairWiFi(ip, port, code)
}

export function disconnectDevice(deviceId: string) {
  return DisconnectDevice(deviceId)
}

export function restartServer() {
  return RestartServer()
}

// Wails' TS codegen mis-types []byte return values as number[] — Go's
// encoding/json (which Wails uses for call results) always base64-encodes
// []byte into a JSON string. The actual runtime value is a base64 string.
export async function takeScreenshot(deviceId: string): Promise<string> {
  return (await TakeScreenshot(deviceId)) as unknown as string
}

// Opens a native "Save As" dialog for a screenshot. Returns "" if the
// user cancels. Only needed when no default screenshots folder is set
// (see buildScreenshotPath / capturePathsStore).
export function chooseScreenshotPath(deviceId: string, dialogTitle: string) {
  return ChooseScreenshotPath(deviceId, dialogTitle)
}

// Builds a screenshot path inside dir with a generated filename, without
// prompting — used when a default screenshots folder is configured.
export function buildScreenshotPath(deviceId: string, dir: string) {
  return BuildScreenshotPath(deviceId, dir)
}

// Captures deviceId's current screen and writes it as PNG directly to path.
export function saveScreenshot(deviceId: string, path: string) {
  return SaveScreenshot(deviceId, path)
}

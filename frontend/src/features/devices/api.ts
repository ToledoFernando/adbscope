import {ConnectWiFi, DisconnectDevice, PairWiFi, RestartServer, TakeScreenshot} from '@/../wailsjs/go/main/App'

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

// Hand-written to mirror app.go's shellOutput struct — event payloads
// aren't covered by Wails' TS codegen (see logcat/types.ts).
export interface ShellOutput {
  DeviceID: string
  Data: string // base64-encoded raw bytes
}

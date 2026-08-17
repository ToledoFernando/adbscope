package adb

import "context"

// TakeScreenshot captures the device's current screen as PNG bytes.
// exec-out (instead of shell) avoids the text-mode transformations `adb
// shell` can apply to its stream, which would corrupt binary output.
func TakeScreenshot(ctx context.Context, client Client, serial string) ([]byte, error) {
	return client.Execute(ctx, "-s", serial, "exec-out", "screencap", "-p")
}

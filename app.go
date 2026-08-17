package main

import (
	"context"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"myproject/internal/application/devices"
	"myproject/internal/application/logcat"
	"myproject/internal/application/screen"
	"myproject/internal/application/shell"
	"myproject/internal/domain"
	"myproject/internal/infrastructure/adb"
	"myproject/internal/infrastructure/bundled"
)

const devicePollInterval = 1500 * time.Millisecond

// App struct
type App struct {
	ctx     context.Context
	devices *devices.Service
	screen  *screen.Service
	logcat  *logcat.Service
	shell   *shell.Service
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	binDir := a.extractBundledBinaries(ctx)

	client, err := adb.NewClient(binDir)
	if err != nil {
		runtime.LogError(ctx, err.Error())
		return
	}
	a.devices = devices.NewService(client)
	a.screen = screen.NewService(client, binDir)
	a.logcat = logcat.NewService(client)
	a.shell = shell.NewService(client)

	go a.watchDevices(ctx)
}

// extractBundledBinaries writes the embedded adb/scrcpy binaries (see
// main.go's bundledBinaries) to a stable per-user cache directory, so the
// app ships as a single executable with no companion scrcpy/ folder to
// keep alongside it. Returns "" on failure — callers fall back to
// locating adb/scrcpy next to the executable or on PATH (see
// internal/infrastructure/{adb,scrcpy}/locate.go), same as before this
// existed.
func (a *App) extractBundledBinaries(ctx context.Context) string {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		runtime.LogError(ctx, "resolving cache dir: "+err.Error())
		return ""
	}

	destDir := filepath.Join(cacheDir, appName, "scrcpy")
	dir, err := bundled.Extract(bundledBinaries, "scrcpy", destDir)
	if err != nil {
		runtime.LogError(ctx, "extracting bundled binaries: "+err.Error())
		return ""
	}
	return dir
}

// shutdown stops any active screen mirror / logcat / shell session so
// nothing lingers as an orphan process after the app closes.
func (a *App) shutdown(ctx context.Context) {
	if a.screen != nil {
		a.screen.StopAll()
	}
	if a.logcat != nil {
		a.logcat.StopAll()
	}
	if a.shell != nil {
		a.shell.StopAll()
	}
}

// watchDevices polls adb for connected devices and emits granular
// device.connected / device.updated / device.disconnected events so the
// frontend never has to poll itself.
func (a *App) watchDevices(ctx context.Context) {
	ticker := time.NewTicker(devicePollInterval)
	defer ticker.Stop()

	var previous []domain.Device
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			current, err := a.devices.GetDevices(ctx)
			if err != nil {
				runtime.LogError(ctx, err.Error())
				continue
			}

			added, removed, updated := devices.Diff(previous, current)
			for _, d := range added {
				runtime.EventsEmit(ctx, "device.connected", d)
			}
			for _, d := range updated {
				runtime.EventsEmit(ctx, "device.updated", d)
			}
			for _, d := range removed {
				runtime.EventsEmit(ctx, "device.disconnected", d)
			}

			previous = current
		}
	}
}

// GetDevices returns every device currently visible to adb.
func (a *App) GetDevices() ([]domain.Device, error) {
	return a.devices.GetDevices(a.ctx)
}

// GetDeviceInfo returns the currently known info for a single device.
func (a *App) GetDeviceInfo(deviceID string) (domain.Device, error) {
	return a.devices.GetDeviceInfo(a.ctx, deviceID)
}

// ConnectWiFi connects to a device over the network. port defaults to 5555
// when empty.
func (a *App) ConnectWiFi(ip string, port string) error {
	return a.devices.ConnectWiFi(a.ctx, ip, port)
}

// PairWiFi pairs with a device using the pairing code from its Wireless
// debugging screen (Android 11+). One-time step before ConnectWiFi works.
func (a *App) PairWiFi(ip string, port string, code string) error {
	return a.devices.PairWiFi(a.ctx, ip, port, code)
}

// DisconnectDevice tears down a WiFi device's connection.
func (a *App) DisconnectDevice(deviceID string) error {
	return a.devices.DisconnectDevice(a.ctx, deviceID)
}

// RestartServer kills and restarts the adb server — fixes most "protocol
// fault" / stale-connection errors.
func (a *App) RestartServer() error {
	return a.devices.RestartServer(a.ctx)
}

// TakeScreenshot captures the device's current screen as PNG bytes.
func (a *App) TakeScreenshot(deviceID string) ([]byte, error) {
	return a.devices.TakeScreenshot(a.ctx, deviceID)
}

// GetDeviceOverview returns the full detail (model, android, sdk, battery,
// storage, ...) for a single device.
func (a *App) GetDeviceOverview(deviceID string) (domain.DeviceInfo, error) {
	return a.devices.GetDeviceOverview(a.ctx, deviceID)
}

// StartScreenMirror mirrors a device's screen, embedded into ADBScope's
// own window. Only one device can be mirrored at a time — starting a new
// one stops whatever was running before. audio also mirrors the device's
// audio output (Android 11+ only).
func (a *App) StartScreenMirror(deviceID string, audio bool) error {
	device, err := a.devices.GetDeviceInfo(a.ctx, deviceID)
	if err != nil {
		return err
	}
	return a.screen.Start(a.ctx, deviceID, device.Serial, audio)
}

// SetScreenMirrorRect repositions the embedded screen mirror to match the
// on-screen area the frontend reserves for it. x/y/width/height are
// physical pixels.
func (a *App) SetScreenMirrorRect(deviceID string, x int, y int, width int, height int) error {
	return a.screen.Reposition(deviceID, int32(x), int32(y), int32(width), int32(height))
}

// StopScreenMirror tears down the screen mirror session for a device.
func (a *App) StopScreenMirror(deviceID string) error {
	return a.screen.Stop(deviceID)
}

// SetScreenMirrorVisible shows or hides the embedded screen mirror
// window without stopping the session — used by the frontend to keep it
// from covering dropdowns/dialogs, which it would otherwise always render
// above (it's a real native window, outside CSS z-index).
func (a *App) SetScreenMirrorVisible(deviceID string, visible bool) {
	a.screen.SetVisible(deviceID, visible)
}

// StartLogcat begins streaming logcat for a device. Batches of parsed
// entries arrive as "logcat.batch" events, not individual events per
// line — a chatty device can log thousands of lines/sec.
func (a *App) StartLogcat(deviceID string) error {
	device, err := a.devices.GetDeviceInfo(a.ctx, deviceID)
	if err != nil {
		return err
	}
	return a.logcat.Start(a.ctx, deviceID, device.Serial, func(batch logcat.Batch) {
		runtime.EventsEmit(a.ctx, "logcat.batch", batch)
	})
}

// StopLogcat tears down the logcat stream for a device.
func (a *App) StopLogcat(deviceID string) {
	a.logcat.Stop(deviceID)
}

type shellOutput struct {
	DeviceID string
	Data     []byte
}

// StartShell opens an interactive shell for a device. Output arrives via
// "shell.output" events as raw bytes (base64-encoded through JSON).
func (a *App) StartShell(deviceID string) error {
	device, err := a.devices.GetDeviceInfo(a.ctx, deviceID)
	if err != nil {
		return err
	}
	return a.shell.Start(a.ctx, deviceID, device.Serial, func(deviceID string, data []byte) {
		runtime.EventsEmit(a.ctx, "shell.output", shellOutput{DeviceID: deviceID, Data: data})
	})
}

// WriteShell sends raw input to the active shell session for a device.
func (a *App) WriteShell(deviceID string, data []byte) error {
	return a.shell.Write(deviceID, data)
}

// StopShell tears down the shell session for a device.
func (a *App) StopShell(deviceID string) {
	a.shell.Stop(deviceID)
}

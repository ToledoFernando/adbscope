package scrcpy

import (
	"context"
	"fmt"
	"os/exec"
	"time"
)

// windowTitlePrefix marks every window our own sessions create, letting
// killStaleWindows surgically clean up orphans without ever touching a
// scrcpy window the user opened by hand.
const windowTitlePrefix = "adbscope-screen-"

// Session is a running scrcpy process mirroring one device's screen,
// embedded into our own window instead of opening its own — scrcpy has no
// "library mode", so this drives the real binary and reparents its native
// window via Win32 APIs (see window_windows.go).
type Session struct {
	DeviceID string

	cmd   *exec.Cmd
	title string
	hwnd  windowHandle
}

// Start launches scrcpy for the given device (identified by its adb
// serial) and waits for its window to appear, ready to be embedded. audio
// mirrors the device's audio output through scrcpy (Android 11+ only);
// it's a launch-time flag for scrcpy, not something togglable on a
// running session — changing it means stopping and starting again.
func Start(ctx context.Context, deviceID, serial string, audio bool) (*Session, error) {
	path, err := locateScrcpy()
	if err != nil {
		return nil, fmt.Errorf("scrcpy not found: %w", err)
	}

	// Clean up any orphaned session window from an earlier run (crash,
	// or an app restart that skipped OnShutdown) before starting a new
	// one — otherwise it can silently steal the device's adb forward
	// tunnel, and the new session opens a window that never gets video.
	killStaleWindows(windowTitlePrefix)

	// Unique per session, not just per device: window titles are how we
	// (re)find this window later (EmbedInMainWindow, and implicitly via
	// waitForWindow below). A device-only title would let a still-dying
	// previous session's window (Stop() kills but doesn't always finish
	// tearing down before a new Start()) get matched instead of the new
	// one — Go reports success, but you're looking at a zombie window.
	title := fmt.Sprintf("%s%s-%d", windowTitlePrefix, deviceID, time.Now().UnixNano())
	args := []string{
		"--serial", serial,
		"--window-title", title,
		"--window-borderless",
		// Spawn far off any real monitor. hideWindow() below still races
		// against however long it takes us to find and hide the window —
		// this doesn't race at all, since the window is never inside
		// visible screen space for even a single frame.
		"--window-x=-32000",
		"--window-y=-32000",
	}
	if !audio {
		args = append(args, "--no-audio")
	}
	cmd := exec.CommandContext(ctx, path, args...)
	cmd.SysProcAttr = noWindowAttr()

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start scrcpy: %w", err)
	}

	hwnd, err := waitForWindow(title, 10*time.Second)
	if err != nil {
		_ = cmd.Process.Kill()
		return nil, err
	}

	// scrcpy's window is visible/floating the instant SDL creates it —
	// hide it immediately so it never flashes on screen as a standalone
	// window before embedInto reparents and reveals it inside our own.
	hideWindow(hwnd)

	// The window exists as soon as SDL creates it, which can be slightly
	// ahead of its renderer being fully set up. Reparenting/restyling out
	// from under a renderer that's still initializing is a plausible
	// source of the intermittent blank-window behavior — this is a cheap,
	// imprecise mitigation, not a real readiness signal (scrcpy doesn't
	// expose one to check against).
	time.Sleep(400 * time.Millisecond)

	return &Session{DeviceID: deviceID, cmd: cmd, title: title, hwnd: hwnd}, nil
}

// EmbedInMainWindow reparents the scrcpy window into ADBScope's own
// window (identified by its title), stripping native decorations so it
// blends into the layout instead of floating as a separate window.
func (s *Session) EmbedInMainWindow(mainWindowTitle string) error {
	parent, err := findOwnMainWindow(mainWindowTitle)
	if err != nil {
		return err
	}
	return embedInto(s.hwnd, parent)
}

// Reposition moves/resizes the embedded window to match the on-screen
// placeholder the frontend reserves for it. x/y/width/height are physical
// pixels, relative to the parent window's client area.
func (s *Session) Reposition(x, y, width, height int32) error {
	return reposition(s.hwnd, x, y, width, height)
}

// SetVisible shows or hides the embedded window without touching its
// parent/position — used to keep it from covering dropdowns/dialogs (see
// embedInto's "airspace" note).
func (s *Session) SetVisible(visible bool) {
	setWindowVisible(s.hwnd, visible)
}

// Stop terminates the scrcpy process and waits for it to fully exit
// before returning — a subsequent Start() must never race a still-dying
// previous process.
func (s *Session) Stop() error {
	if s.cmd == nil || s.cmd.Process == nil {
		return nil
	}
	if err := s.cmd.Process.Kill(); err != nil {
		return err
	}
	_ = s.cmd.Wait()
	return nil
}

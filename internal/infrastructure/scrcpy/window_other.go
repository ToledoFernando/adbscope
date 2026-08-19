//go:build !windows

package scrcpy

import (
	"errors"
	"time"
)

type windowHandle uintptr

// Embedding a native scrcpy window into our own is a Windows-specific
// technique (Win32 SetParent). ADBScope currently only targets Windows;
// these stubs just keep the package compiling on other platforms.
var errUnsupportedPlatform = errors.New("scrcpy window embedding is only supported on Windows")

func waitForWindow(title string, timeout time.Duration) (windowHandle, error) {
	return 0, errUnsupportedPlatform
}

func embedInto(child, parent windowHandle) error {
	return errUnsupportedPlatform
}

func reposition(hwnd windowHandle, x, y, width, height int32) error {
	return errUnsupportedPlatform
}

func findOwnMainWindow(titleHint string) (windowHandle, error) {
	return 0, errUnsupportedPlatform
}

func killStaleWindows(prefix string) {}

func hideWindow(hwnd windowHandle) {}

func closeWindow(hwnd windowHandle) {}

func setWindowVisible(hwnd windowHandle, visible bool) {}

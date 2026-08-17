//go:build windows

package adb

import "syscall"

// noWindowAttr suppresses the console window Windows otherwise flashes for
// every invocation of adb.exe — a console-subsystem binary — since it has
// no window of its own to attach to when launched from a GUI app. With
// device polling and per-command shelling, that's a window every few
// seconds without this.
func noWindowAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true}
}

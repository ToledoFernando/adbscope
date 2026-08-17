//go:build windows

package scrcpy

import "syscall"

// noWindowAttr suppresses any console window Windows might otherwise
// flash for the launched process. scrcpy.exe itself is a GUI/SDL app, but
// this keeps the launch path consistent with adb's (see the adb package's
// identical helper) and harmless either way.
func noWindowAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true}
}

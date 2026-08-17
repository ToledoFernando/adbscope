//go:build !windows

package adb

import "syscall"

func noWindowAttr() *syscall.SysProcAttr {
	return nil
}

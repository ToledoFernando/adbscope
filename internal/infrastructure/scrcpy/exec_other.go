//go:build !windows

package scrcpy

import "syscall"

func noWindowAttr() *syscall.SysProcAttr {
	return nil
}

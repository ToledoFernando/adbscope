package domain

import "errors"

// Domain-level errors. Infrastructure implementations must translate
// provider-specific failures (exit codes, stderr text) into these so the
// application layer and frontend never need to interpret raw ADB output.
var (
	ErrDeviceNotFound      = errors.New("device not found")
	ErrDeviceOffline       = errors.New("device offline")
	ErrDeviceUnauthorized  = errors.New("device unauthorized")
	ErrADBNotFound         = errors.New("adb executable not found")
	ErrADBConnectionFailed = errors.New("adb connection failed")
	ErrADBCommandFailed    = errors.New("adb command failed")
	ErrDeviceNotWiFi       = errors.New("device is not connected over wifi")
	ErrScreenStreamFailed  = errors.New("screen stream failed")
	ErrLogcatFailed        = errors.New("logcat failed")
	ErrShellFailed         = errors.New("shell failed")
)

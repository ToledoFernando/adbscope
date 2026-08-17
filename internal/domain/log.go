package domain

import "time"

// LogLevel mirrors Android's logcat priority levels.
type LogLevel string

const (
	LogVerbose LogLevel = "V"
	LogDebug   LogLevel = "D"
	LogInfo    LogLevel = "I"
	LogWarning LogLevel = "W"
	LogError   LogLevel = "E"
	LogFatal   LogLevel = "F"
)

// LogEntry is a single parsed logcat line.
type LogEntry struct {
	Timestamp time.Time
	Level     LogLevel
	PID       int
	TID       int
	Tag       string
	Message   string
	Raw       string
}

package adb

import (
	"regexp"
	"strconv"
	"strings"
	"time"

	"myproject/internal/domain"
)

// Matches `adb logcat -v threadtime` lines, e.g.:
// "08-16 10:23:45.123  1234  1234 I ActivityManager: Start proc..."
var logLineRe = regexp.MustCompile(`^(\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]*):\s?(.*)$`)

// parseLogLine parses a single line of threadtime-formatted logcat
// output. Lines that don't match (blank lines, the occasional banner)
// are reported via ok=false rather than erroring — logcat is a live
// stream, one unparseable line shouldn't kill it.
func parseLogLine(line string) (domain.LogEntry, bool) {
	m := logLineRe.FindStringSubmatch(line)
	if m == nil {
		return domain.LogEntry{}, false
	}

	pid, _ := strconv.Atoi(m[2])
	tid, _ := strconv.Atoi(m[3])

	return domain.LogEntry{
		Timestamp: parseLogTimestamp(m[1]),
		Level:     domain.LogLevel(m[4]),
		PID:       pid,
		TID:       tid,
		Tag:       strings.TrimSpace(m[5]),
		Message:   m[6],
		Raw:       line,
	}, true
}

// parseLogTimestamp parses threadtime's "MM-DD HH:MM:SS.mmm" (no year)
// and fills in the current year.
func parseLogTimestamp(s string) time.Time {
	parsed, err := time.Parse("01-02 15:04:05.000", s)
	if err != nil {
		return time.Time{}
	}
	now := time.Now()
	return time.Date(now.Year(), parsed.Month(), parsed.Day(), parsed.Hour(), parsed.Minute(), parsed.Second(), parsed.Nanosecond(), now.Location())
}

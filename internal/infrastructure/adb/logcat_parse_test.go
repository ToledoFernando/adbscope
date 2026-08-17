package adb

import "testing"

func TestParseLogLine(t *testing.T) {
	line := "08-16 10:23:45.123  1234  5678 I ActivityManager: Start proc 1234:com.foo/u0a123"

	entry, ok := parseLogLine(line)
	if !ok {
		t.Fatal("expected line to parse")
	}

	if entry.PID != 1234 || entry.TID != 5678 {
		t.Errorf("PID/TID = %d/%d, want 1234/5678", entry.PID, entry.TID)
	}
	if entry.Level != "I" {
		t.Errorf("Level = %q, want I", entry.Level)
	}
	if entry.Tag != "ActivityManager" {
		t.Errorf("Tag = %q, want ActivityManager", entry.Tag)
	}
	if entry.Message != "Start proc 1234:com.foo/u0a123" {
		t.Errorf("Message = %q", entry.Message)
	}
	if entry.Raw != line {
		t.Errorf("Raw = %q, want original line", entry.Raw)
	}
	if entry.Timestamp.Month() != 8 || entry.Timestamp.Day() != 16 {
		t.Errorf("Timestamp = %v, want August 16", entry.Timestamp)
	}
}

func TestParseLogLineError(t *testing.T) {
	line := "08-16 10:23:45.123  1234  5678 E AndroidRuntime: FATAL EXCEPTION: main"

	entry, ok := parseLogLine(line)
	if !ok {
		t.Fatal("expected line to parse")
	}
	if entry.Level != "E" {
		t.Errorf("Level = %q, want E", entry.Level)
	}
}

func TestParseLogLineTagWithSpaces(t *testing.T) {
	line := "08-16 10:23:45.123  1234  5678 D  My Tag : some message"

	entry, ok := parseLogLine(line)
	if !ok {
		t.Fatal("expected line to parse")
	}
	if entry.Tag != "My Tag" {
		t.Errorf("Tag = %q, want %q", entry.Tag, "My Tag")
	}
}

func TestParseLogLineUnmatched(t *testing.T) {
	cases := []string{
		"",
		"--------- beginning of main",
		"not a logcat line at all",
	}
	for _, line := range cases {
		if _, ok := parseLogLine(line); ok {
			t.Errorf("parseLogLine(%q) unexpectedly matched", line)
		}
	}
}

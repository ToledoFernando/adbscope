package adb

import (
	"bufio"
	"bytes"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var propLineRe = regexp.MustCompile(`^\[(.+?)\]: \[(.*)\]$`)

// parseProps parses the output of `adb shell getprop` (no args), which
// dumps every system property as "[key]: [value]" lines.
func parseProps(output []byte) map[string]string {
	props := make(map[string]string)
	scanner := bufio.NewScanner(bytes.NewReader(output))
	for scanner.Scan() {
		m := propLineRe.FindStringSubmatch(strings.TrimSpace(scanner.Text()))
		if m == nil {
			continue
		}
		props[m[1]] = m[2]
	}
	return props
}

var batteryLevelRe = regexp.MustCompile(`level:\s*(\d+)`)

// parseBatteryLevel extracts the battery percentage from
// `adb shell dumpsys battery` output. Returns 0 if not found.
func parseBatteryLevel(output []byte) int {
	m := batteryLevelRe.FindSubmatch(output)
	if m == nil {
		return 0
	}
	level, _ := strconv.Atoi(string(m[1]))
	return level
}

var batteryStatusValues = map[string]string{
	"1": "unknown",
	"2": "charging",
	"3": "discharging",
	"4": "not charging",
	"5": "full",
}

// parseBatteryStatus extracts the charging status from
// `adb shell dumpsys battery` output. Returns "" if not found.
func parseBatteryStatus(output []byte) string {
	return lookupBatteryField(output, `status:\s*(\d+)`, batteryStatusValues)
}

var batteryHealthValues = map[string]string{
	"1": "unknown",
	"2": "good",
	"3": "overheat",
	"4": "dead",
	"5": "over voltage",
	"6": "unspecified failure",
	"7": "cold",
}

// parseBatteryHealth extracts the battery health from
// `adb shell dumpsys battery` output. Returns "" if not found.
func parseBatteryHealth(output []byte) string {
	return lookupBatteryField(output, `health:\s*(\d+)`, batteryHealthValues)
}

func lookupBatteryField(output []byte, pattern string, values map[string]string) string {
	m := regexp.MustCompile(pattern).FindSubmatch(output)
	if m == nil {
		return ""
	}
	return values[string(m[1])]
}

var batteryPluggedRe = regexp.MustCompile(`(AC|USB|Wireless) powered:\s*true`)

// parseBatteryPlugged reports which power source is charging the device
// (AC, USB, Wireless) from `adb shell dumpsys battery` output, or "" if
// the device is on battery power.
func parseBatteryPlugged(output []byte) string {
	m := batteryPluggedRe.FindSubmatch(output)
	if m == nil {
		return ""
	}
	return string(m[1])
}

var batteryVoltageRe = regexp.MustCompile(`voltage:\s*(\d+)`)

// parseBatteryVoltage extracts battery voltage in volts from
// `adb shell dumpsys battery` output (reported in millivolts).
func parseBatteryVoltage(output []byte) float64 {
	m := batteryVoltageRe.FindSubmatch(output)
	if m == nil {
		return 0
	}
	mv, _ := strconv.Atoi(string(m[1]))
	return float64(mv) / 1000
}

var batteryTemperatureRe = regexp.MustCompile(`temperature:\s*(\d+)`)

// parseBatteryTemperature extracts battery temperature in degrees Celsius
// from `adb shell dumpsys battery` output (reported in tenths of a degree).
func parseBatteryTemperature(output []byte) float64 {
	m := batteryTemperatureRe.FindSubmatch(output)
	if m == nil {
		return 0
	}
	tenths, _ := strconv.Atoi(string(m[1]))
	return float64(tenths) / 10
}

var cpuCoreRe = regexp.MustCompile(`(?m)^processor\s*:\s*\d+`)

// parseCPUCores counts logical CPU cores from `adb shell cat /proc/cpuinfo`
// output.
func parseCPUCores(output []byte) int {
	return len(cpuCoreRe.FindAll(output, -1))
}

var memTotalRe = regexp.MustCompile(`MemTotal:\s*(\d+)\s*kB`)

// parseMemTotal extracts total RAM in bytes from
// `adb shell cat /proc/meminfo` output.
func parseMemTotal(output []byte) int64 {
	m := memTotalRe.FindSubmatch(output)
	if m == nil {
		return 0
	}
	kb, _ := strconv.ParseInt(string(m[1]), 10, 64)
	return kb * 1024
}

// parseUptime extracts device uptime in seconds from
// `adb shell cat /proc/uptime` output (first field, a float).
func parseUptime(output []byte) int64 {
	fields := strings.Fields(string(output))
	if len(fields) == 0 {
		return 0
	}
	seconds, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0
	}
	return int64(seconds)
}

var wmSizeRe = regexp.MustCompile(`Physical size:\s*(\d+)x(\d+)`)

// parseWMSize extracts the screen resolution from `adb shell wm size`
// output, ignoring any "Override size" line.
func parseWMSize(output []byte) string {
	m := wmSizeRe.FindSubmatch(output)
	if m == nil {
		return ""
	}
	return fmt.Sprintf("%s × %s", m[1], m[2])
}

var wmDensityRe = regexp.MustCompile(`Physical density:\s*(\d+)`)

// parseWMDensity extracts screen density from `adb shell wm density` output.
func parseWMDensity(output []byte) int {
	m := wmDensityRe.FindSubmatch(output)
	if m == nil {
		return 0
	}
	density, _ := strconv.Atoi(string(m[1]))
	return density
}

// parseStorage extracts used/total bytes for /data from `adb shell df /data`
// output. Returns zero values if the output doesn't match the expected
// "header + one data row" shape.
func parseStorage(output []byte) (used, total int64) {
	scanner := bufio.NewScanner(bytes.NewReader(output))
	if !scanner.Scan() { // header row
		return 0, 0
	}
	if !scanner.Scan() { // data row
		return 0, 0
	}

	fields := strings.Fields(scanner.Text())
	if len(fields) < 3 {
		return 0, 0
	}

	totalKB, err1 := strconv.ParseInt(fields[1], 10, 64)
	usedKB, err2 := strconv.ParseInt(fields[2], 10, 64)
	if err1 != nil || err2 != nil {
		return 0, 0
	}

	return usedKB * 1024, totalKB * 1024
}

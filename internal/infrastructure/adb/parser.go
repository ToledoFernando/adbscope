package adb

import (
	"bufio"
	"strings"

	"myproject/internal/domain"
)

// parseDevices parses the output of `adb devices -l` into domain devices.
func parseDevices(output []byte) []domain.Device {
	var devices []domain.Device

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "List of devices") {
			continue
		}

		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		serial := fields[0]
		device := domain.Device{
			ID:        serial,
			Serial:    serial,
			State:     parseState(fields[1]),
			Transport: parseTransport(serial),
		}

		for _, f := range fields[2:] {
			if model, ok := strings.CutPrefix(f, "model:"); ok {
				device.Model = strings.ReplaceAll(model, "_", " ")
			}
		}

		devices = append(devices, device)
	}

	return devices
}

func parseState(raw string) domain.DeviceState {
	switch raw {
	case "device":
		return domain.DeviceOnline
	case "unauthorized":
		return domain.DeviceUnauthorized
	default:
		return domain.DeviceOffline
	}
}

func parseTransport(serial string) domain.TransportType {
	switch {
	case strings.HasPrefix(serial, "emulator-"):
		return domain.TransportEmulator
	case strings.Contains(serial, ":"):
		return domain.TransportWiFi
	default:
		return domain.TransportUSB
	}
}

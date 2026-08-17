package adb

import (
	"testing"

	"myproject/internal/domain"
)

func TestParseDevices(t *testing.T) {
	output := []byte(`List of devices attached
1234567890ABCDEF       device product:panther model:Pixel_8_Pro device:panther transport_id:3
192.168.1.42:5555      device product:panther model:Pixel_8_Pro device:panther transport_id:5
ABCDEF123               unauthorized usb:1-1 product:panther model:Pixel_8_Pro device:panther transport_id:1
emulator-5554           device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:2
XYZ999                  offline

`)

	devices := parseDevices(output)
	if len(devices) != 5 {
		t.Fatalf("got %d devices, want 5", len(devices))
	}

	usb := devices[0]
	if usb.Serial != "1234567890ABCDEF" || usb.State != domain.DeviceOnline || usb.Transport != domain.TransportUSB {
		t.Errorf("usb device parsed wrong: %+v", usb)
	}
	if usb.Model != "Pixel 8 Pro" {
		t.Errorf("usb model = %q, want %q", usb.Model, "Pixel 8 Pro")
	}

	wifi := devices[1]
	if wifi.Serial != "192.168.1.42:5555" || wifi.Transport != domain.TransportWiFi {
		t.Errorf("wifi device parsed wrong: %+v", wifi)
	}

	unauthorized := devices[2]
	if unauthorized.State != domain.DeviceUnauthorized {
		t.Errorf("unauthorized device state = %q, want %q", unauthorized.State, domain.DeviceUnauthorized)
	}

	emulator := devices[3]
	if emulator.Transport != domain.TransportEmulator {
		t.Errorf("emulator transport = %q, want %q", emulator.Transport, domain.TransportEmulator)
	}

	offline := devices[4]
	if offline.State != domain.DeviceOffline {
		t.Errorf("offline device state = %q, want %q", offline.State, domain.DeviceOffline)
	}
}

func TestParseDevicesEmpty(t *testing.T) {
	devices := parseDevices([]byte("List of devices attached\n\n"))
	if len(devices) != 0 {
		t.Fatalf("got %d devices, want 0", len(devices))
	}
}

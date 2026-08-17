package domain

import "context"

// TransportType identifies how ADBScope reaches a device.
type TransportType string

const (
	TransportUSB      TransportType = "usb"
	TransportWiFi     TransportType = "wifi"
	TransportEmulator TransportType = "emulator"
)

// Transport abstracts how a device is reached (USB, WiFi, emulator, ...).
// Callers depend on this interface, never on a concrete provider like ADB.
type Transport interface {
	Type() TransportType
	Connect(ctx context.Context, target string) error
	Disconnect(ctx context.Context, target string) error
}

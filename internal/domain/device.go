package domain

// DeviceState represents the current connectivity state of a device.
type DeviceState string

const (
	DeviceOnline       DeviceState = "online"
	DeviceOffline      DeviceState = "offline"
	DeviceUnauthorized DeviceState = "unauthorized"
)

// Device is ADBScope's own representation of a connected Android device.
// It has no knowledge of ADB — infrastructure implementations translate
// their provider-specific data into this shape.
type Device struct {
	ID           string
	Serial       string
	State        DeviceState
	Transport    TransportType
	Manufacturer string
	Model        string
	Android      string
	SDK          int
	Architecture string
}

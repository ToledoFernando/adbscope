package domain

// Orientation describes the current rotation of a device's screen.
type Orientation int

const (
	OrientationPortrait Orientation = iota
	OrientationLandscape
)

// ScreenFrame is a single decoded frame captured from a device's screen.
type ScreenFrame struct {
	DeviceID    string
	Data        []byte
	Width       int
	Height      int
	Orientation Orientation
	Timestamp   int64
}

package domain

// DeviceInfo is the full detail shown on the Device Overview screen. It's
// heavier to gather than Device (requires shelling into the device), so
// it's fetched on demand when a device is selected — never during polling.
type DeviceInfo struct {
	Device

	Brand         string
	Board         string
	Hardware      string
	BuildID       string
	SecurityPatch string
	Bootloader    string
	SupportedABIs string

	Resolution        string
	Density           int
	StorageUsedBytes  int64
	StorageTotalBytes int64

	CPUCores      int
	TotalRAMBytes int64
	UptimeSeconds int64

	BatteryLevel       int
	BatteryStatus      string
	BatteryHealth      string
	BatteryPlugged     string
	BatteryVoltage     float64
	BatteryTemperature float64
}

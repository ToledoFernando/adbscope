package devices

import (
	"context"

	"myproject/internal/domain"
	"myproject/internal/infrastructure/adb"
)

// Service exposes device discovery to the rest of the application. Callers
// depend only on this type — never on the adb package directly.
type Service struct {
	client adb.Client
}

func NewService(client adb.Client) *Service {
	return &Service{client: client}
}

func (s *Service) GetDevices(ctx context.Context) ([]domain.Device, error) {
	return adb.ListDevices(ctx, s.client)
}

func (s *Service) GetDeviceInfo(ctx context.Context, deviceID string) (domain.Device, error) {
	all, err := s.GetDevices(ctx)
	if err != nil {
		return domain.Device{}, err
	}
	for _, d := range all {
		if d.ID == deviceID {
			return d, nil
		}
	}
	return domain.Device{}, domain.ErrDeviceNotFound
}

// ConnectWiFi connects to a device over the network. port defaults to 5555
// (adb's standard wireless debugging port) when empty.
func (s *Service) ConnectWiFi(ctx context.Context, ip, port string) error {
	if port == "" {
		port = "5555"
	}
	return adb.ConnectWiFi(ctx, s.client, ip+":"+port)
}

// PairWiFi pairs with a device using the pairing code from its "Pair
// device with pairing code" screen (Android 11+ wireless debugging). A
// one-time step per network — ConnectWiFi is used afterwards.
func (s *Service) PairWiFi(ctx context.Context, ip, port, code string) error {
	return adb.PairWiFi(ctx, s.client, ip+":"+port, code)
}

// DisconnectDevice tears down a WiFi connection. USB devices can't be
// disconnected this way — unplugging is the only "disconnect" for them.
func (s *Service) DisconnectDevice(ctx context.Context, deviceID string) error {
	device, err := s.GetDeviceInfo(ctx, deviceID)
	if err != nil {
		return err
	}
	if device.Transport != domain.TransportWiFi {
		return domain.ErrDeviceNotWiFi
	}
	return adb.DisconnectWiFi(ctx, s.client, device.Serial)
}

// RestartServer kills and restarts the adb server — the standard fix when
// adb enters a bad state (e.g. "protocol fault" errors during pairing).
func (s *Service) RestartServer(ctx context.Context) error {
	return adb.RestartServer(ctx, s.client)
}

// TakeScreenshot captures the device's current screen as PNG bytes.
func (s *Service) TakeScreenshot(ctx context.Context, deviceID string) ([]byte, error) {
	device, err := s.GetDeviceInfo(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	return adb.TakeScreenshot(ctx, s.client, device.Serial)
}

// GetDeviceOverview gathers the full detail shown on the Device Overview
// screen. Unlike GetDeviceInfo (identity only, from the cached device
// list), this shells into the device and is meant to be called on demand
// when a device is selected — not during polling.
func (s *Service) GetDeviceOverview(ctx context.Context, deviceID string) (domain.DeviceInfo, error) {
	device, err := s.GetDeviceInfo(ctx, deviceID)
	if err != nil {
		return domain.DeviceInfo{}, err
	}
	return adb.FetchDeviceOverview(ctx, s.client, device)
}

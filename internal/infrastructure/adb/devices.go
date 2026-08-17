package adb

import (
	"context"

	"myproject/internal/domain"
)

// ListDevices returns every device currently visible to adb, translated
// into ADBScope's own domain representation.
func ListDevices(ctx context.Context, client Client) ([]domain.Device, error) {
	out, err := client.Execute(ctx, "devices", "-l")
	if err != nil {
		return nil, err
	}
	return parseDevices(out), nil
}

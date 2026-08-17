package adb

import (
	"context"
	"fmt"
	"strings"

	"myproject/internal/domain"
)

// ConnectWiFi connects to a device reachable over the network (after
// `adb tcpip` or wireless pairing). target is host:port.
//
// `adb connect` exits 0 even when the connection fails, so success has to
// be determined from its output text rather than the process exit code.
func ConnectWiFi(ctx context.Context, client Client, target string) error {
	out, err := client.Execute(ctx, "connect", target)
	if err != nil {
		return err
	}

	msg := strings.TrimSpace(string(out))
	if strings.HasPrefix(msg, "connected to") || strings.HasPrefix(msg, "already connected to") {
		return nil
	}
	return fmt.Errorf("%w: %s", domain.ErrADBConnectionFailed, msg)
}

// DisconnectWiFi tears down a connection previously established with
// ConnectWiFi. target is host:port.
func DisconnectWiFi(ctx context.Context, client Client, target string) error {
	_, err := client.Execute(ctx, "disconnect", target)
	return err
}

// PairWiFi pairs with a device using the 6-digit code shown on its
// "Pair device with pairing code" screen (Android 11+ wireless
// debugging). target is host:port for the pairing service — a different,
// ephemeral port from the one ConnectWiFi uses. Pairing is a one-time step
// per network; ConnectWiFi is what's used afterwards (and every time
// after that).
func PairWiFi(ctx context.Context, client Client, target, code string) error {
	out, err := client.Execute(ctx, "pair", target, code)
	if err != nil {
		return err
	}

	msg := strings.TrimSpace(string(out))
	if !strings.HasPrefix(msg, "Successfully paired") {
		return fmt.Errorf("%w: %s", domain.ErrADBConnectionFailed, msg)
	}
	return nil
}

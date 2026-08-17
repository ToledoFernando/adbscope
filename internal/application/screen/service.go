package screen

import (
	"context"
	"fmt"
	"sync"

	"myproject/internal/domain"
	"myproject/internal/infrastructure/adb"
	"myproject/internal/infrastructure/scrcpy"
)

const mainWindowTitle = "ADBScope"

// Service manages the single active screen-mirroring session. Only one
// device can be mirrored at a time in V1 — starting a new one stops
// whatever was running before.
type Service struct {
	client adb.Client
	binDir string

	mu      sync.Mutex
	session *scrcpy.Session
}

// binDir is where the app's embedded binaries were extracted to at
// startup (see extractBundledBinaries in app.go) — pass "" if extraction
// failed, and scrcpy.Start falls back to its usual lookup locations.
func NewService(client adb.Client, binDir string) *Service {
	return &Service{client: client, binDir: binDir}
}

// Start mirrors deviceID's screen, embedded into ADBScope's own window.
// audio mirrors the device's audio output too (Android 11+ only).
func (s *Service) Start(ctx context.Context, deviceID, serial string, audio bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.session != nil {
		_ = s.session.Stop()
		s.session = nil
	}

	// Best-effort cleanup: if a previous session was killed abruptly (no
	// graceful shutdown on Windows), its adb port-forward for this device
	// can linger and block the new scrcpy connection from ever completing
	// its handshake — the window still opens (we only check for that),
	// but no video ever arrives. Ignoring the error is fine: this is a
	// no-op when there's nothing stale to remove.
	_, _ = s.client.Execute(ctx, "-s", serial, "forward", "--remove-all")

	session, err := scrcpy.Start(ctx, deviceID, serial, audio, s.binDir)
	if err != nil {
		return fmt.Errorf("%w: %s", domain.ErrScreenStreamFailed, err)
	}

	if err := session.EmbedInMainWindow(mainWindowTitle); err != nil {
		_ = session.Stop()
		return fmt.Errorf("%w: %s", domain.ErrScreenStreamFailed, err)
	}

	s.session = session
	return nil
}

// Reposition matches the embedded window to the on-screen area the
// frontend reserves for it. x/y/width/height are physical pixels.
func (s *Service) Reposition(deviceID string, x, y, width, height int32) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.session == nil || s.session.DeviceID != deviceID {
		return nil // stale call from a view that's no longer the active one
	}
	return s.session.Reposition(x, y, width, height)
}

// SetVisible shows or hides the embedded mirror window for deviceID
// without stopping the session — used to keep it from visually covering
// dropdowns/dialogs, which as native content it would otherwise always
// render above regardless of CSS z-index.
func (s *Service) SetVisible(deviceID string, visible bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.session == nil || s.session.DeviceID != deviceID {
		return // stale call from a view that's no longer the active one
	}
	s.session.SetVisible(visible)
}

// Stop tears down the mirror session for deviceID, if it's the active one.
func (s *Service) Stop(deviceID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.session == nil || s.session.DeviceID != deviceID {
		return nil
	}
	err := s.session.Stop()
	s.session = nil
	return err
}

// StopAll tears down any active session regardless of device. Meant to be
// called on app shutdown so scrcpy never lingers as an orphan process.
func (s *Service) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.session != nil {
		_ = s.session.Stop()
		s.session = nil
	}
}

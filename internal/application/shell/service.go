package shell

import (
	"context"
	"fmt"
	"io"
	"sync"

	"myproject/internal/domain"
	"myproject/internal/infrastructure/adb"
)

// OutputFunc is called with each chunk of raw shell output as it arrives.
type OutputFunc func(deviceID string, data []byte)

// Service manages the single active interactive shell session. Only one
// device's shell runs at a time — starting a new one stops whatever was
// running before, matching the Screen/Logcat services' pattern.
type Service struct {
	client adb.Client

	mu       sync.Mutex
	deviceID string
	cancel   context.CancelFunc
	stdin    io.WriteCloser
	stdout   io.Closer
}

func NewService(client adb.Client) *Service {
	return &Service{client: client}
}

// Start opens an interactive shell for deviceID, calling onOutput with
// each chunk of raw output as it arrives.
func (s *Service) Start(ctx context.Context, deviceID, serial string, onOutput OutputFunc) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopLocked()

	sessionCtx, cancel := context.WithCancel(ctx)

	stdin, stdout, err := adb.StartShell(sessionCtx, s.client, serial)
	if err != nil {
		cancel()
		return fmt.Errorf("%w: %s", domain.ErrShellFailed, err)
	}

	s.deviceID = deviceID
	s.cancel = cancel
	s.stdin = stdin
	s.stdout = stdout

	go pumpOutput(stdout, func(data []byte) {
		onOutput(deviceID, data)
	})

	return nil
}

// Write sends raw input to the active shell session for deviceID.
func (s *Service) Write(deviceID string, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.deviceID != deviceID || s.stdin == nil {
		return domain.ErrShellFailed
	}
	_, err := s.stdin.Write(data)
	return err
}

// Stop tears down the shell session for deviceID, if it's the active one.
func (s *Service) Stop(deviceID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.deviceID != deviceID {
		return
	}
	s.stopLocked()
}

// StopAll tears down any active session regardless of device. Meant to be
// called on app shutdown.
func (s *Service) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.stopLocked()
}

func (s *Service) stopLocked() {
	if s.cancel != nil {
		s.cancel()
	}
	if s.stdin != nil {
		_ = s.stdin.Close()
	}
	if s.stdout != nil {
		_ = s.stdout.Close()
	}
	s.deviceID = ""
	s.cancel = nil
	s.stdin = nil
	s.stdout = nil
}

// pumpOutput forwards raw bytes as they arrive — deliberately not
// line-buffered. A real terminal needs partial lines (prompts without a
// trailing newline), cursor-movement escape sequences, etc.; scanning by
// line would break all of that.
func pumpOutput(r io.Reader, onData func([]byte)) {
	buf := make([]byte, 4096)
	for {
		n, err := r.Read(buf)
		if n > 0 {
			chunk := make([]byte, n)
			copy(chunk, buf[:n])
			onData(chunk)
		}
		if err != nil {
			return
		}
	}
}

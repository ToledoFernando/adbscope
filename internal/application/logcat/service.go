package logcat

import (
	"context"
	"io"
	"sync"
	"time"

	"myproject/internal/domain"
	"myproject/internal/infrastructure/adb"
)

const (
	batchInterval = 100 * time.Millisecond
	batchMaxSize  = 200
)

// Batch is a group of log entries flushed together, so the frontend never
// has to handle thousands of individual per-line events per second.
type Batch struct {
	DeviceID string
	Entries  []domain.LogEntry
}

// BatchFunc is called with each flushed batch.
type BatchFunc func(Batch)

// Service manages the single active logcat stream. Only one device's
// logcat runs at a time, matching the single bottom panel in the UI —
// starting a new stream stops whatever was running before.
type Service struct {
	client adb.Client

	mu       sync.Mutex
	deviceID string
	cancel   context.CancelFunc
	closer   io.Closer
}

func NewService(client adb.Client) *Service {
	return &Service{client: client}
}

// Start begins streaming logcat for deviceID, calling onBatch with
// batches of parsed entries as they're flushed.
func (s *Service) Start(ctx context.Context, deviceID, serial string, onBatch BatchFunc) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.stopLocked()

	streamCtx, cancel := context.WithCancel(ctx)

	entries, closer, err := adb.StreamLogcat(streamCtx, s.client, serial)
	if err != nil {
		cancel()
		return err
	}

	s.deviceID = deviceID
	s.cancel = cancel
	s.closer = closer

	go batchEntries(streamCtx, entries, func(batch []domain.LogEntry) {
		onBatch(Batch{DeviceID: deviceID, Entries: batch})
	})

	return nil
}

// Stop tears down the logcat stream for deviceID, if it's the active one.
func (s *Service) Stop(deviceID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.deviceID != deviceID {
		return
	}
	s.stopLocked()
}

// StopAll tears down any active stream regardless of device. Meant to be
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
	if s.closer != nil {
		_ = s.closer.Close()
	}
	s.deviceID = ""
	s.cancel = nil
	s.closer = nil
}

// batchEntries collects entries off the channel and flushes them in
// groups — whichever comes first, batchMaxSize entries or batchInterval
// elapsed — instead of forwarding each one individually.
func batchEntries(ctx context.Context, entries <-chan domain.LogEntry, flush func([]domain.LogEntry)) {
	ticker := time.NewTicker(batchInterval)
	defer ticker.Stop()

	var buf []domain.LogEntry
	for {
		select {
		case <-ctx.Done():
			return

		case entry, ok := <-entries:
			if !ok {
				if len(buf) > 0 {
					flush(buf)
				}
				return
			}
			buf = append(buf, entry)
			if len(buf) >= batchMaxSize {
				flush(buf)
				buf = nil
			}

		case <-ticker.C:
			if len(buf) > 0 {
				flush(buf)
				buf = nil
			}
		}
	}
}

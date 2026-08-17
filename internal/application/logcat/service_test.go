package logcat

import (
	"context"
	"sync"
	"testing"
	"time"

	"myproject/internal/domain"
)

func TestBatchEntriesFlushesOnSize(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	entries := make(chan domain.LogEntry)
	var mu sync.Mutex
	var flushes [][]domain.LogEntry

	done := make(chan struct{})
	go func() {
		batchEntries(ctx, entries, func(batch []domain.LogEntry) {
			mu.Lock()
			flushes = append(flushes, batch)
			mu.Unlock()
		})
		close(done)
	}()

	for i := 0; i < batchMaxSize; i++ {
		entries <- domain.LogEntry{Message: "x"}
	}

	deadline := time.After(2 * time.Second)
	for {
		mu.Lock()
		n := len(flushes)
		mu.Unlock()
		if n >= 1 {
			break
		}
		select {
		case <-deadline:
			t.Fatal("timed out waiting for size-triggered flush")
		case <-time.After(10 * time.Millisecond):
		}
	}

	mu.Lock()
	defer mu.Unlock()
	if len(flushes[0]) != batchMaxSize {
		t.Errorf("first flush size = %d, want %d", len(flushes[0]), batchMaxSize)
	}

	close(entries)
	<-done
}

func TestBatchEntriesFlushesRemainderOnClose(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	entries := make(chan domain.LogEntry)
	var mu sync.Mutex
	var flushes [][]domain.LogEntry

	done := make(chan struct{})
	go func() {
		batchEntries(ctx, entries, func(batch []domain.LogEntry) {
			mu.Lock()
			flushes = append(flushes, batch)
			mu.Unlock()
		})
		close(done)
	}()

	entries <- domain.LogEntry{Message: "only one"}
	close(entries)

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for batchEntries to exit")
	}

	mu.Lock()
	defer mu.Unlock()
	if len(flushes) != 1 || len(flushes[0]) != 1 {
		t.Errorf("flushes = %+v, want exactly one batch of one entry", flushes)
	}
}

func TestBatchEntriesStopsOnContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	entries := make(chan domain.LogEntry)

	done := make(chan struct{})
	go func() {
		batchEntries(ctx, entries, func([]domain.LogEntry) {})
		close(done)
	}()

	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("batchEntries did not exit after context cancel")
	}
}

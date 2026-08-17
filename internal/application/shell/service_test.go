package shell

import (
	"io"
	"sync"
	"testing"
	"time"
)

func TestPumpOutputForwardsPartialChunksWithoutNewline(t *testing.T) {
	r, w := io.Pipe()

	var mu sync.Mutex
	var received []byte
	done := make(chan struct{})

	go func() {
		pumpOutput(r, func(data []byte) {
			mu.Lock()
			received = append(received, data...)
			mu.Unlock()
		})
		close(done)
	}()

	// No trailing newline — a shell prompt like "pixel8:/ $ " never gets
	// one. A line-buffered reader (bufio.Scanner) would sit on this
	// forever; pumpOutput must forward it immediately.
	if _, err := w.Write([]byte("pixel8:/ $ ")); err != nil {
		t.Fatal(err)
	}

	deadline := time.After(2 * time.Second)
	for {
		mu.Lock()
		got := string(received)
		mu.Unlock()
		if got == "pixel8:/ $ " {
			break
		}
		select {
		case <-deadline:
			t.Fatalf("timed out waiting for partial chunk, got %q so far", got)
		case <-time.After(10 * time.Millisecond):
		}
	}

	_ = w.Close()
	<-done
}

func TestPumpOutputStopsWhenReaderCloses(t *testing.T) {
	r, w := io.Pipe()

	done := make(chan struct{})
	go func() {
		pumpOutput(r, func([]byte) {})
		close(done)
	}()

	_ = w.Close()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("pumpOutput did not return after reader closed")
	}
}

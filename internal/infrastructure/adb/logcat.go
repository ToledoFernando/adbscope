package adb

import (
	"bufio"
	"context"
	"io"

	"myproject/internal/domain"
)

// StreamLogcat starts `adb logcat` for a device and returns a channel of
// parsed entries plus the underlying stream so callers can Close() it to
// stop early. The channel closes when the stream ends — process exit,
// Close(), or ctx cancellation.
func StreamLogcat(ctx context.Context, client Client, serial string) (<-chan domain.LogEntry, io.Closer, error) {
	// -T 1: start from the most recent line instead of dumping the
	// device's entire historical log buffer first. Without it, opening
	// the panel can flood the frontend with thousands of backlog entries
	// in one burst — the batcher still groups them, but that many
	// re-renders/filter passes in quick succession is what was freezing
	// the UI, not a slow parser.
	stream, err := client.ExecuteStream(ctx, "-s", serial, "logcat", "-v", "threadtime", "-T", "1")
	if err != nil {
		return nil, nil, err
	}

	entries := make(chan domain.LogEntry)
	go func() {
		defer close(entries)

		scanner := bufio.NewScanner(stream)
		scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

		for scanner.Scan() {
			entry, ok := parseLogLine(scanner.Text())
			if !ok {
				continue
			}
			select {
			case entries <- entry:
			case <-ctx.Done():
				return
			}
		}
	}()

	return entries, stream, nil
}

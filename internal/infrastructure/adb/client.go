package adb

import (
	"context"
	"io"
)

// Client executes ADB commands. It is the only contract the rest of
// ADBScope depends on — callers never know they're actually invoking the
// adb binary, nor which arguments were used.
type Client interface {
	Execute(ctx context.Context, args ...string) ([]byte, error)
	ExecuteStream(ctx context.Context, args ...string) (io.ReadCloser, error)
	// ExecuteInteractive runs a long-lived, bidirectional command (an
	// interactive shell) — write to stdin, read raw bytes from stdout as
	// they arrive.
	ExecuteInteractive(ctx context.Context, args ...string) (stdin io.WriteCloser, stdout io.ReadCloser, err error)
}

package adb

import (
	"context"
	"io"
)

// StartShell opens an interactive shell session on a device. -tt forces a
// remote PTY allocation unconditionally. Plain -t only allocates one "if
// on a tty" — our stdin is a Go pipe, never a real tty, so -t alone is a
// no-op and the session runs without a working PTY (no prompt, no line
// editing, no colors).
func StartShell(ctx context.Context, client Client, serial string) (stdin io.WriteCloser, stdout io.ReadCloser, err error) {
	return client.ExecuteInteractive(ctx, "-s", serial, "shell", "-tt")
}

package adb

import "context"

// RestartServer kills and restarts the adb server. adb's server can end up
// in a bad state (stale process, protocol faults after being juggled by
// multiple adb client versions/instances) — this is the standard fix, and
// a common enough real-world gotcha to expose directly instead of making
// users find a terminal.
func RestartServer(ctx context.Context, client Client) error {
	if _, err := client.Execute(ctx, "kill-server"); err != nil {
		return err
	}
	_, err := client.Execute(ctx, "start-server")
	return err
}

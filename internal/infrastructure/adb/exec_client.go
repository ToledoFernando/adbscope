package adb

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os/exec"
	"strings"

	"github.com/aymanbagabas/go-pty"

	"myproject/internal/domain"
)

// execClient runs commands against a located adb binary.
type execClient struct {
	binPath string
}

// NewClient locates the adb binary — preferring the copy extracted from
// the app's embedded binaries (binDir; pass "" to skip straight to the
// fallbacks), falling back to a copy next to the executable or PATH —
// and returns a Client backed by it.
func NewClient(binDir string) (Client, error) {
	path, err := locateADB(binDir)
	if err != nil {
		return nil, domain.ErrADBNotFound
	}
	return &execClient{binPath: path}, nil
}

func (c *execClient) Execute(ctx context.Context, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, c.binPath, args...)
	cmd.SysProcAttr = noWindowAttr()
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrADBCommandFailed, strings.TrimSpace(stderr.String()))
	}
	return out, nil
}

// streamReadCloser reaps the underlying process once the consumer is done
// reading, so long-running adb commands (logcat, shell) don't leak zombies.
type streamReadCloser struct {
	io.ReadCloser
	cmd *exec.Cmd
}

func (s *streamReadCloser) Close() error {
	closeErr := s.ReadCloser.Close()
	waitErr := s.cmd.Wait()
	if closeErr != nil {
		return closeErr
	}
	return waitErr
}

func (c *execClient) ExecuteStream(ctx context.Context, args ...string) (io.ReadCloser, error) {
	cmd := exec.CommandContext(ctx, c.binPath, args...)
	cmd.SysProcAttr = noWindowAttr()

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrADBCommandFailed, err)
	}
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("%w: %s", domain.ErrADBCommandFailed, err)
	}

	return &streamReadCloser{ReadCloser: stdout, cmd: cmd}, nil
}

// ptyStdin is the write side of a pseudo-terminal-attached command. Actual
// teardown (closing the console, reaping the process) happens once, via
// the paired ptyStdout's Close — see ExecuteInteractive.
type ptyStdin struct {
	p pty.Pty
}

func (s *ptyStdin) Write(b []byte) (int, error) { return s.p.Write(b) }
func (s *ptyStdin) Close() error                { return nil }

// ptyStdout reaps the underlying process once the consumer is done
// reading, same contract as streamReadCloser.
type ptyStdout struct {
	p   pty.Pty
	cmd *pty.Cmd
}

func (s *ptyStdout) Read(b []byte) (int, error) { return s.p.Read(b) }

func (s *ptyStdout) Close() error {
	closeErr := s.p.Close()
	waitErr := s.cmd.Wait()
	if closeErr != nil {
		return closeErr
	}
	return waitErr
}

// ExecuteInteractive runs the command attached to a real pseudo-console
// (Windows ConPTY) rather than plain OS pipes. adb's own stdout buffering
// behavior depends on whether it detects a console or a pipe on the other
// end — attached to a pipe, output can sit unflushed until enough of it
// accumulates or something else nudges the process, which showed up as
// shell output only appearing after an unrelated keypress. A pseudo-console
// makes adb see a real terminal, matching how it behaves when run
// interactively by hand.
func (c *execClient) ExecuteInteractive(ctx context.Context, args ...string) (io.WriteCloser, io.ReadCloser, error) {
	p, err := pty.New()
	if err != nil {
		return nil, nil, fmt.Errorf("%w: %s", domain.ErrShellFailed, err)
	}

	cmd := p.CommandContext(ctx, c.binPath, args...)
	if err := cmd.Start(); err != nil {
		_ = p.Close()
		return nil, nil, fmt.Errorf("%w: %s", domain.ErrShellFailed, err)
	}

	return &ptyStdin{p: p}, &ptyStdout{p: p, cmd: cmd}, nil
}

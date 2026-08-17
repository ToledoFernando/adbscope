package scrcpy

import (
	"os"
	"os/exec"
	"path/filepath"
)

// locateScrcpy finds scrcpy.exe. binDir — the directory the embedded
// binaries were extracted to at startup (see extractBundledBinaries in
// app.go) — is checked first; if it's empty (extraction failed) or
// doesn't have scrcpy, this falls back to a copy next to the executable
// or on PATH, same as before binaries were embedded into the build.
func locateScrcpy(binDir string) (string, error) {
	const name = "scrcpy.exe"

	var candidates []string
	if binDir != "" {
		candidates = append(candidates, filepath.Join(binDir, name))
	}
	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates, filepath.Join(exeDir, "scrcpy", name), filepath.Join(exeDir, name))
	}
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates, filepath.Join(cwd, "scrcpy", name))
	}

	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}

	return exec.LookPath(name)
}

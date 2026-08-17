package scrcpy

import (
	"os"
	"os/exec"
	"path/filepath"
)

// locateScrcpy finds the bundled scrcpy.exe (shipped alongside adb.exe in
// the scrcpy/ folder), falling back to PATH.
func locateScrcpy() (string, error) {
	const name = "scrcpy.exe"

	var candidates []string
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

package adb

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func adbBinaryName() string {
	if runtime.GOOS == "windows" {
		return "adb.exe"
	}
	return "adb"
}

// candidatePaths lists, in preference order, where the bundled adb binary
// might live relative to the running executable and the working directory.
// exeDir/cwd may be empty (when os.Executable/os.Getwd fail) — callers
// just get a shorter list.
func candidatePaths(exeDir, cwd, name string) []string {
	var candidates []string
	if exeDir != "" {
		candidates = append(candidates,
			filepath.Join(exeDir, "scrcpy", name), // build/bin/scrcpy/adb.exe (packaged layout)
			filepath.Join(exeDir, name),
		)
	}
	if cwd != "" {
		candidates = append(candidates, filepath.Join(cwd, "scrcpy", name)) // repo root during `wails dev`
	}
	return candidates
}

func firstExisting(paths []string) (string, bool) {
	for _, path := range paths {
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			return path, true
		}
	}
	return "", false
}

// locateADB finds the adb binary to use. binDir — the directory the
// embedded binaries were extracted to at startup (see
// extractBundledBinaries in app.go) — is checked first so ADBScope
// doesn't depend on the user having the Android SDK installed; if it's
// empty (extraction failed) or doesn't have adb, this falls back to a
// copy next to the executable or on PATH, same as before binaries were
// embedded into the build.
func locateADB(binDir string) (string, error) {
	name := adbBinaryName()

	var candidates []string
	if binDir != "" {
		candidates = append(candidates, filepath.Join(binDir, name))
	}

	var exeDir string
	if exePath, err := os.Executable(); err == nil {
		exeDir = filepath.Dir(exePath)
	}
	cwd, _ := os.Getwd()
	candidates = append(candidates, candidatePaths(exeDir, cwd, name)...)

	if path, ok := firstExisting(candidates); ok {
		return path, nil
	}

	return exec.LookPath(name)
}

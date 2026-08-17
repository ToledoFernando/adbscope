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

// locateADB finds the adb binary to use, preferring the copy bundled
// alongside scrcpy — so ADBScope doesn't depend on the user having the
// Android SDK installed — and falling back to whatever adb is on PATH.
func locateADB() (string, error) {
	name := adbBinaryName()

	var exeDir string
	if exePath, err := os.Executable(); err == nil {
		exeDir = filepath.Dir(exePath)
	}
	cwd, _ := os.Getwd()

	if path, ok := firstExisting(candidatePaths(exeDir, cwd, name)); ok {
		return path, nil
	}

	return exec.LookPath(name)
}

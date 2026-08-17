package adb

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCandidatePaths(t *testing.T) {
	got := candidatePaths("C:\\app", "C:\\repo", "adb.exe")
	want := []string{
		filepath.Join("C:\\app", "scrcpy", "adb.exe"),
		filepath.Join("C:\\app", "adb.exe"),
		filepath.Join("C:\\repo", "scrcpy", "adb.exe"),
	}
	if len(got) != len(want) {
		t.Fatalf("got %d candidates, want %d: %v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("candidate[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestCandidatePathsEmptyDirs(t *testing.T) {
	got := candidatePaths("", "", "adb.exe")
	if len(got) != 0 {
		t.Errorf("got %v, want empty", got)
	}
}

func TestFirstExisting(t *testing.T) {
	dir := t.TempDir()
	realFile := filepath.Join(dir, "adb.exe")
	if err := os.WriteFile(realFile, []byte("fake"), 0o644); err != nil {
		t.Fatal(err)
	}

	missing := filepath.Join(dir, "does-not-exist.exe")

	path, ok := firstExisting([]string{missing, realFile})
	if !ok || path != realFile {
		t.Errorf("firstExisting = (%q, %v), want (%q, true)", path, ok, realFile)
	}
}

func TestFirstExistingNoneFound(t *testing.T) {
	_, ok := firstExisting([]string{filepath.Join(t.TempDir(), "nope.exe")})
	if ok {
		t.Error("expected ok=false when no candidate exists")
	}
}

func TestFirstExistingSkipsDirectories(t *testing.T) {
	dir := t.TempDir()
	_, ok := firstExisting([]string{dir})
	if ok {
		t.Error("expected directories to be skipped")
	}
}

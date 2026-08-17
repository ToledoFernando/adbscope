// Package bundled extracts embedded binary assets (adb, scrcpy, and their
// DLLs) to a real directory on disk so they can be exec'd — an embed.FS
// can't run a program directly, only read its bytes.
package bundled

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// Extract writes every file under root in embedded to destDir, so the app
// can ship as a single executable — adb.exe/scrcpy.exe/their DLLs travel
// inside the binary instead of as a companion folder — and locates them
// there at runtime instead of expecting them next to the .exe.
//
// Skips the write if destDir already holds a matching fingerprint from a
// previous run, so a ~35MB payload (mostly SDL3.dll) isn't rewritten on
// every launch. The fingerprint is derived from the embedded files'
// paths and sizes, so a rebuild with different bundled binaries
// re-extracts automatically — no version number to remember to bump.
func Extract(embedded embed.FS, root, destDir string) (string, error) {
	fingerprint, err := fingerprintOf(embedded, root)
	if err != nil {
		return "", fmt.Errorf("fingerprinting bundled binaries: %w", err)
	}

	markerPath := filepath.Join(destDir, ".fingerprint")
	if existing, err := os.ReadFile(markerPath); err == nil && string(existing) == fingerprint {
		return destDir, nil
	}

	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return "", fmt.Errorf("creating %s: %w", destDir, err)
	}

	err = fs.WalkDir(embedded, root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		target := filepath.Join(destDir, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		data, err := embedded.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o755)
	})
	if err != nil {
		return "", fmt.Errorf("extracting bundled binaries: %w", err)
	}

	// Best-effort: if this fails, the next launch just re-extracts.
	_ = os.WriteFile(markerPath, []byte(fingerprint), 0o644)
	return destDir, nil
}

func fingerprintOf(embedded embed.FS, root string) (string, error) {
	h := sha256.New()
	err := fs.WalkDir(embedded, root, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		fmt.Fprintf(h, "%s:%d\n", path, info.Size())
		return nil
	})
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

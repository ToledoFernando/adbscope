//go:build windows

package scrcpy

import (
	"fmt"
	"os"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

type windowHandle uintptr

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procFindWindowW              = user32.NewProc("FindWindowW")
	procSetParent                = user32.NewProc("SetParent")
	procGetWindowLongPtrW        = user32.NewProc("GetWindowLongPtrW")
	procSetWindowLongPtrW        = user32.NewProc("SetWindowLongPtrW")
	procMoveWindow               = user32.NewProc("MoveWindow")
	procShowWindow               = user32.NewProc("ShowWindow")
	procSetWindowPos             = user32.NewProc("SetWindowPos")
	procEnumWindows              = user32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	procIsWindowVisible          = user32.NewProc("IsWindowVisible")
	procGetWindowTextW           = user32.NewProc("GetWindowTextW")

	procOpenProcess      = kernel32.NewProc("OpenProcess")
	procTerminateProcess = kernel32.NewProc("TerminateProcess")
	procCloseHandle      = kernel32.NewProc("CloseHandle")
)

const processTerminate = 0x0001

// GWL_STYLE (-16). Can't be a uintptr constant directly (Go rejects
// negative-to-unsigned constant conversions), so it goes through a typed
// variable first, forcing a runtime conversion that sign-extends correctly.
var gwlStyleIndex int32 = -16
var gwlStyle = uintptr(gwlStyleIndex)

const (
	wsChild      uintptr = 0x40000000
	wsPopup      uintptr = 0x80000000
	wsCaption    uintptr = 0x00C00000
	wsThickFrame uintptr = 0x00040000

	swShow = 5
	swHide = 0

	swpNoSize       = 0x0001
	swpNoMove       = 0x0002
	swpNoActivate   = 0x0010
	swpFrameChanged = 0x0020

	hwndTop = 0
)

func findWindowByTitle(title string) (windowHandle, bool) {
	titlePtr, err := syscall.UTF16PtrFromString(title)
	if err != nil {
		return 0, false
	}
	hwnd, _, _ := procFindWindowW.Call(0, uintptr(unsafe.Pointer(titlePtr)))
	if hwnd == 0 {
		return 0, false
	}
	return windowHandle(hwnd), true
}

// hideWindow hides a window without touching its style/parent — used to
// suppress the brief floating-window flash between scrcpy creating its
// own top-level window and us reparenting it into ours.
func hideWindow(hwnd windowHandle) {
	procShowWindow.Call(uintptr(hwnd), swHide)
}

// setWindowVisible shows or hides an already-embedded window without
// touching its parent/position — used to keep the mirror from covering
// dropdowns/dialogs, which as a real native window (see embedInto) it
// would otherwise always render above regardless of CSS z-index.
func setWindowVisible(hwnd windowHandle, visible bool) {
	cmd := uintptr(swHide)
	if visible {
		cmd = swShow
	}
	procShowWindow.Call(uintptr(hwnd), cmd)
}

func waitForWindow(title string, timeout time.Duration) (windowHandle, error) {
	deadline := time.Now().Add(timeout)
	for {
		if hwnd, ok := findWindowByTitle(title); ok {
			return hwnd, nil
		}
		if time.Now().After(deadline) {
			return 0, fmt.Errorf("timed out waiting for scrcpy window %q to appear", title)
		}
		time.Sleep(150 * time.Millisecond)
	}
}

// embedInto strips child's native decorations, turns it into a WS_CHILD
// of parent, and reparents it. Note: a native child window like this sits
// outside the WebView2 surface's compositing — it will always render
// either fully above or fully below sibling web content ("airspace"
// problem), so React overlays can't visually cover it. Design the screen
// view's controls around the video, not on top of it.
func embedInto(child, parent windowHandle) error {
	// Order matters: SetParent first, then restyle. Doing it the other
	// way leaves the window briefly claiming WS_CHILD while it still has
	// no actual parent — an invalid intermediate state the desktop
	// compositor doesn't always handle the same way twice.
	ret, _, callErr := procSetParent.Call(uintptr(child), uintptr(parent))
	if ret == 0 {
		return fmt.Errorf("SetParent failed: %w", callErr)
	}

	style, _, _ := procGetWindowLongPtrW.Call(uintptr(child), gwlStyle)
	newStyle := (style &^ (wsPopup | wsCaption | wsThickFrame)) | wsChild
	procSetWindowLongPtrW.Call(uintptr(child), gwlStyle, newStyle)

	// SWP_NOMOVE|SWP_NOSIZE: only refresh the frame/z-order here, actual
	// positioning comes later from Reposition. Insert-after HWND_TOP:
	// without this the reparented window stays behind the pre-existing
	// WebView2 sibling and is fully obscured, even though it's correctly
	// sized and positioned.
	procSetWindowPos.Call(uintptr(child), hwndTop, 0, 0, 0, 0, swpFrameChanged|swpNoMove|swpNoSize|swpNoActivate)
	procShowWindow.Call(uintptr(child), swShow)
	return nil
}

func reposition(hwnd windowHandle, x, y, width, height int32) error {
	ret, _, callErr := procMoveWindow.Call(uintptr(hwnd), uintptr(x), uintptr(y), uintptr(width), uintptr(height), 1)
	if ret == 0 {
		return fmt.Errorf("MoveWindow failed: %w", callErr)
	}
	return nil
}

// killStaleWindows forcibly terminates the process behind any top-level
// window whose title starts with prefix. Our own session titles are
// always unique (device ID + timestamp), so a matching window can only be
// an orphan from an earlier run — e.g. one whose process survived a
// previous crash, or an app restart that skipped OnShutdown. Never
// touches windows outside that exact prefix, so a scrcpy window the user
// opened by hand for testing is untouched.
func killStaleWindows(prefix string) {
	seenPIDs := map[uint32]bool{}

	cb := syscall.NewCallback(func(hwnd uintptr, _ uintptr) uintptr {
		buf := make([]uint16, 256)
		procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
		if !strings.HasPrefix(syscall.UTF16ToString(buf), prefix) {
			return 1
		}

		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))
		if pid == 0 || seenPIDs[pid] {
			return 1
		}
		seenPIDs[pid] = true

		handle, _, _ := procOpenProcess.Call(processTerminate, 0, uintptr(pid))
		if handle != 0 {
			procTerminateProcess.Call(handle, 1)
			procCloseHandle.Call(handle)
		}
		return 1
	})

	procEnumWindows.Call(cb, 0)
}

// findOwnMainWindow locates ADBScope's own top-level window by matching
// the current process ID and a title substring — there's no public Wails
// API for this, so it's done the same way scrcpy's window is found.
func findOwnMainWindow(titleHint string) (windowHandle, error) {
	pid := uint32(os.Getpid())
	var found windowHandle

	cb := syscall.NewCallback(func(hwnd uintptr, _ uintptr) uintptr {
		var winPid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&winPid)))
		if winPid != pid {
			return 1
		}

		visible, _, _ := procIsWindowVisible.Call(hwnd)
		if visible == 0 {
			return 1
		}

		buf := make([]uint16, 256)
		procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
		if !strings.Contains(syscall.UTF16ToString(buf), titleHint) {
			return 1
		}

		found = windowHandle(hwnd)
		return 0
	})

	procEnumWindows.Call(cb, 0)
	if found == 0 {
		return 0, fmt.Errorf("could not find ADBScope's main window (looking for title containing %q)", titleHint)
	}
	return found, nil
}

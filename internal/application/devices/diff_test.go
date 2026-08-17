package devices

import (
	"testing"

	"myproject/internal/domain"
)

func TestDiff(t *testing.T) {
	previous := []domain.Device{
		{ID: "A", State: domain.DeviceOnline, Model: "Pixel"},
		{ID: "B", State: domain.DeviceOnline, Model: "Galaxy"},
	}
	current := []domain.Device{
		{ID: "A", State: domain.DeviceOffline, Model: "Pixel"},   // updated
		{ID: "C", State: domain.DeviceOnline, Model: "Emulator"}, // added
		// B removed
	}

	added, removed, updated := Diff(previous, current)

	if len(added) != 1 || added[0].ID != "C" {
		t.Errorf("added = %+v, want [C]", added)
	}
	if len(removed) != 1 || removed[0].ID != "B" {
		t.Errorf("removed = %+v, want [B]", removed)
	}
	if len(updated) != 1 || updated[0].ID != "A" {
		t.Errorf("updated = %+v, want [A]", updated)
	}
}

func TestDiffNoChanges(t *testing.T) {
	devices := []domain.Device{{ID: "A", State: domain.DeviceOnline}}

	added, removed, updated := Diff(devices, devices)

	if len(added) != 0 || len(removed) != 0 || len(updated) != 0 {
		t.Errorf("expected no changes, got added=%+v removed=%+v updated=%+v", added, removed, updated)
	}
}

func TestDiffEmptyPrevious(t *testing.T) {
	current := []domain.Device{{ID: "A", State: domain.DeviceOnline}}

	added, removed, updated := Diff(nil, current)

	if len(added) != 1 || len(removed) != 0 || len(updated) != 0 {
		t.Errorf("expected 1 added, got added=%+v removed=%+v updated=%+v", added, removed, updated)
	}
}

package devices

import "myproject/internal/domain"

// Diff compares two device snapshots so callers can emit granular
// connected/updated/disconnected events instead of resending full lists.
func Diff(previous, current []domain.Device) (added, removed, updated []domain.Device) {
	prevByID := make(map[string]domain.Device, len(previous))
	for _, d := range previous {
		prevByID[d.ID] = d
	}

	currByID := make(map[string]domain.Device, len(current))
	for _, d := range current {
		currByID[d.ID] = d
	}

	for id, d := range currByID {
		old, existed := prevByID[id]
		switch {
		case !existed:
			added = append(added, d)
		case old != d:
			updated = append(updated, d)
		}
	}

	for id, d := range prevByID {
		if _, stillPresent := currByID[id]; !stillPresent {
			removed = append(removed, d)
		}
	}

	return added, removed, updated
}

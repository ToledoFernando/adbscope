package adb

import "testing"

func TestParseProps(t *testing.T) {
	output := []byte(`[ro.product.manufacturer]: [Google]
[ro.product.model]: [Pixel 8 Pro]
[ro.build.version.release]: [15]
[ro.build.version.sdk]: [35]
[ro.product.cpu.abi]: [arm64-v8a]
`)

	props := parseProps(output)

	cases := map[string]string{
		"ro.product.manufacturer":  "Google",
		"ro.product.model":         "Pixel 8 Pro",
		"ro.build.version.release": "15",
		"ro.build.version.sdk":     "35",
		"ro.product.cpu.abi":       "arm64-v8a",
	}
	for key, want := range cases {
		if got := props[key]; got != want {
			t.Errorf("props[%q] = %q, want %q", key, got, want)
		}
	}
}

func TestParseBatteryLevel(t *testing.T) {
	output := []byte(`Current Battery Service state:
  AC powered: false
  USB powered: true
  Wireless powered: false
  Max charging current: 0
  status: 2
  health: 2
  present: true
  level: 82
  scale: 100
  voltage: 4123
  temperature: 289
`)

	if got := parseBatteryLevel(output); got != 82 {
		t.Errorf("parseBatteryLevel = %d, want 82", got)
	}
}

func TestParseBatteryLevelMissing(t *testing.T) {
	if got := parseBatteryLevel([]byte("no such field")); got != 0 {
		t.Errorf("parseBatteryLevel = %d, want 0", got)
	}
}

func TestParseWMSize(t *testing.T) {
	output := []byte("Physical size: 1344x2992\n")
	if got, want := parseWMSize(output), "1344 × 2992"; got != want {
		t.Errorf("parseWMSize = %q, want %q", got, want)
	}
}

func TestParseWMSizeWithOverride(t *testing.T) {
	output := []byte("Physical size: 1344x2992\nOverride size: 1080x2400\n")
	if got, want := parseWMSize(output), "1344 × 2992"; got != want {
		t.Errorf("parseWMSize = %q, want %q", got, want)
	}
}

func TestParseWMDensity(t *testing.T) {
	output := []byte("Physical density: 480\n")
	if got := parseWMDensity(output); got != 480 {
		t.Errorf("parseWMDensity = %d, want 480", got)
	}
}

func TestParseStorage(t *testing.T) {
	output := []byte(`Filesystem     1K-blocks    Used Available Use% Mounted on
/dev/block/dm-6 111602140 45230080  64825600  42% /data
`)

	used, total := parseStorage(output)
	wantUsed := int64(45230080) * 1024
	wantTotal := int64(111602140) * 1024
	if used != wantUsed || total != wantTotal {
		t.Errorf("parseStorage = (%d, %d), want (%d, %d)", used, total, wantUsed, wantTotal)
	}
}

func TestParseStorageMalformed(t *testing.T) {
	used, total := parseStorage([]byte("unexpected output"))
	if used != 0 || total != 0 {
		t.Errorf("parseStorage = (%d, %d), want (0, 0)", used, total)
	}
}

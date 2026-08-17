package adb

import (
	"context"
	"testing"
)

func TestTakeScreenshot(t *testing.T) {
	want := []byte{0x89, 'P', 'N', 'G', '\r', '\n'}
	client := &fakeClient{output: want}

	got, err := TakeScreenshot(context.Background(), client, "emulator-5554")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if string(got) != string(want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

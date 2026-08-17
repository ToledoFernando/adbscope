package adb

import (
	"context"
	"errors"
	"io"
	"testing"

	"myproject/internal/domain"
)

type fakeClient struct {
	output []byte
	err    error
}

func (f *fakeClient) Execute(ctx context.Context, args ...string) ([]byte, error) {
	return f.output, f.err
}

func (f *fakeClient) ExecuteStream(ctx context.Context, args ...string) (io.ReadCloser, error) {
	return nil, errors.New("not implemented")
}

func (f *fakeClient) ExecuteInteractive(ctx context.Context, args ...string) (io.WriteCloser, io.ReadCloser, error) {
	return nil, nil, errors.New("not implemented")
}

func TestConnectWiFiSuccess(t *testing.T) {
	client := &fakeClient{output: []byte("connected to 192.168.1.42:5555\n")}
	if err := ConnectWiFi(context.Background(), client, "192.168.1.42:5555"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestConnectWiFiAlreadyConnected(t *testing.T) {
	client := &fakeClient{output: []byte("already connected to 192.168.1.42:5555\n")}
	if err := ConnectWiFi(context.Background(), client, "192.168.1.42:5555"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestConnectWiFiFailure(t *testing.T) {
	client := &fakeClient{output: []byte("failed to connect to 192.168.1.42:5555: Connection refused\n")}
	err := ConnectWiFi(context.Background(), client, "192.168.1.42:5555")
	if !errors.Is(err, domain.ErrADBConnectionFailed) {
		t.Fatalf("expected ErrADBConnectionFailed, got %v", err)
	}
}

func TestConnectWiFiExecuteError(t *testing.T) {
	client := &fakeClient{err: errors.New("boom")}
	if err := ConnectWiFi(context.Background(), client, "192.168.1.42:5555"); err == nil {
		t.Fatal("expected error")
	}
}

func TestPairWiFiSuccess(t *testing.T) {
	client := &fakeClient{output: []byte("Successfully paired to 192.168.1.42:40719 [guid=adb-1234]\n")}
	if err := PairWiFi(context.Background(), client, "192.168.1.42:40719", "123456"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestPairWiFiWrongCode(t *testing.T) {
	client := &fakeClient{output: []byte("Failed: Wrong pairing code\n")}
	err := PairWiFi(context.Background(), client, "192.168.1.42:40719", "000000")
	if !errors.Is(err, domain.ErrADBConnectionFailed) {
		t.Fatalf("expected ErrADBConnectionFailed, got %v", err)
	}
}

func TestPairWiFiExecuteError(t *testing.T) {
	client := &fakeClient{err: errors.New("boom")}
	if err := PairWiFi(context.Background(), client, "192.168.1.42:40719", "123456"); err == nil {
		t.Fatal("expected error")
	}
}

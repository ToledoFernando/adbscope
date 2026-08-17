package adb

import (
	"context"
	"strconv"

	"myproject/internal/domain"
)

// FetchDeviceOverview gathers the full detail shown on the Device Overview
// screen. Each piece of extra info (battery, resolution, density, storage)
// is best-effort: if its shell command fails or its output doesn't parse,
// that field is simply left at its zero value rather than failing the
// whole overview.
func FetchDeviceOverview(ctx context.Context, client Client, device domain.Device) (domain.DeviceInfo, error) {
	props, err := fetchProps(ctx, client, device.Serial)
	if err != nil {
		return domain.DeviceInfo{}, err
	}

	info := domain.DeviceInfo{Device: device}
	info.Manufacturer = props["ro.product.manufacturer"]
	if model := props["ro.product.model"]; model != "" {
		info.Model = model
	}
	info.Android = props["ro.build.version.release"]
	info.SDK, _ = strconv.Atoi(props["ro.build.version.sdk"])
	info.Architecture = props["ro.product.cpu.abi"]
	info.Brand = props["ro.product.brand"]
	info.Board = props["ro.product.board"]
	info.Hardware = props["ro.hardware"]
	info.BuildID = props["ro.build.id"]
	info.SecurityPatch = props["ro.build.version.security_patch"]
	info.Bootloader = props["ro.bootloader"]
	info.SupportedABIs = props["ro.product.cpu.abilist"]

	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "dumpsys", "battery"); err == nil {
		info.BatteryLevel = parseBatteryLevel(out)
		info.BatteryStatus = parseBatteryStatus(out)
		info.BatteryHealth = parseBatteryHealth(out)
		info.BatteryPlugged = parseBatteryPlugged(out)
		info.BatteryVoltage = parseBatteryVoltage(out)
		info.BatteryTemperature = parseBatteryTemperature(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "wm", "size"); err == nil {
		info.Resolution = parseWMSize(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "wm", "density"); err == nil {
		info.Density = parseWMDensity(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "df", "/data"); err == nil {
		info.StorageUsedBytes, info.StorageTotalBytes = parseStorage(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "cat", "/proc/cpuinfo"); err == nil {
		info.CPUCores = parseCPUCores(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "cat", "/proc/meminfo"); err == nil {
		info.TotalRAMBytes = parseMemTotal(out)
	}
	if out, err := client.Execute(ctx, "-s", device.Serial, "shell", "cat", "/proc/uptime"); err == nil {
		info.UptimeSeconds = parseUptime(out)
	}

	return info, nil
}

func fetchProps(ctx context.Context, client Client, serial string) (map[string]string, error) {
	out, err := client.Execute(ctx, "-s", serial, "shell", "getprop")
	if err != nil {
		return nil, err
	}
	return parseProps(out), nil
}

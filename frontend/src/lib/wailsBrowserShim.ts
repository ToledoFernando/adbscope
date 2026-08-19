// Dev-only fallback so `vite` (plain browser) can render the shell without
// the Wails/WebView2 host. Only installs when window.runtime is missing —
// a real Wails build always provides it, so this never runs in production.
// Lets contributors preview UI changes in an ordinary browser without
// standing up the full `wails dev` native window.
if (import.meta.env.DEV && typeof (window as any).runtime === "undefined") {
  const now = () => new Date().toISOString();

  ;(window as any).runtime = {
    LogPrint: () => {},
    LogTrace: () => {},
    LogDebug: () => {},
    LogInfo: () => {},
    LogWarning: () => {},
    LogError: () => {},
    LogFatal: () => {},
    EventsOnMultiple: () => () => {},
    EventsOn: () => () => {},
    EventsOff: () => {},
    EventsOffAll: () => {},
    EventsOnce: () => () => {},
    EventsEmit: () => {},
    WindowReload: () => {},
    WindowReloadApp: () => {},
    WindowSetAlwaysOnTop: () => {},
    WindowSetSystemDefaultTheme: () => {},
    WindowSetLightTheme: () => {},
    WindowSetDarkTheme: () => {},
    WindowCenter: () => {},
    WindowSetTitle: () => {},
    WindowFullscreen: () => {},
    WindowUnfullscreen: () => {},
    WindowIsFullscreen: () => Promise.resolve(false),
    WindowSetSize: () => {},
    WindowGetSize: () => Promise.resolve({ w: 1280, h: 800 }),
    WindowSetMinSize: () => {},
    WindowSetMaxSize: () => {},
    WindowSetPosition: () => {},
    WindowGetPosition: () => Promise.resolve({ x: 0, y: 0 }),
    WindowHide: () => {},
    WindowShow: () => {},
    WindowClose: () => {},
    WindowToggleMaximise: () => Promise.resolve(),
    WindowMaximise: () => {},
    WindowUnmaximise: () => {},
    WindowIsMaximised: () => Promise.resolve(false),
    WindowMinimise: () => {},
    WindowUnminimise: () => {},
    WindowIsMinimised: () => Promise.resolve(false),
    WindowIsNormal: () => Promise.resolve(true),
    WindowSetBackgroundColour: () => {},
    ScreenGetAll: () => Promise.resolve([]),
    BrowserOpenURL: (url: string) => window.open(url, "_blank"),
    Environment: () =>
      Promise.resolve({ buildType: "dev", platform: "browser", arch: "browser" }),
    Quit: () => {},
    Hide: () => {},
    Show: () => {},
    ClipboardGetText: () => Promise.resolve(""),
    ClipboardSetText: () => Promise.resolve(true),
  }

  const fakeDevice = {
    ID: "emulator-5554",
    Serial: "emulator-5554",
    State: "online",
    Transport: "usb",
    Manufacturer: "Google",
    Model: "Pixel 8 Pro",
    Android: "15",
    SDK: 35,
    Architecture: "arm64-v8a",
  }

  const fakeDeviceInfo = {
    ...fakeDevice,
    Brand: "google",
    Board: "shusky",
    Hardware: "shusky",
    BuildID: "AP4A.250105.002",
    SecurityPatch: "2026-07-05",
    Bootloader: "slider-1.4-12345678",
    SupportedABIs: "arm64-v8a,armeabi-v7a,armeabi",
    Resolution: "1344x2992",
    Density: 489,
    StorageUsedBytes: 84 * 1024 ** 3,
    StorageTotalBytes: 128 * 1024 ** 3,
    CPUCores: 9,
    TotalRAMBytes: 12 * 1024 ** 3,
    UptimeSeconds: 2 * 86400 + 3 * 3600 + 41 * 60,
    BatteryLevel: 76,
    BatteryStatus: "Discharging",
    BatteryHealth: "Good",
    BatteryPlugged: "",
    BatteryVoltage: 4.32,
    BatteryTemperature: 31.4,
  }

  const stubbedResults: Record<string, unknown> = {
    GetDevices: [fakeDevice],
    GetDeviceInfo: fakeDeviceInfo,
    GetDeviceOverview: fakeDeviceInfo,
    TakeScreenshot: "",
  }

  ;(window as any).go = {
    main: {
      App: new Proxy(
        {},
        {
          get:
            (_target, method: string) =>
            (..._args: unknown[]) => {
              if (method in stubbedResults) return Promise.resolve(stubbedResults[method])
              return Promise.resolve(undefined)
            },
        },
      ),
    },
  }

  console.info(`[wailsBrowserShim ${now()}] window.runtime/window.go stubbed for browser preview`)
}

export {}

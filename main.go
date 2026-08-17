package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

// bundledBinaries carries adb.exe, scrcpy.exe, and their DLLs (scrcpy/ at
// the repo root) inside the compiled executable, so the app ships as a
// single file instead of needing that folder alongside it. Extracted to
// disk on startup — see internal/infrastructure/bundled and app.go's
// extractBundledBinaries.
//
//go:embed all:scrcpy
var bundledBinaries embed.FS

// App identity/window defaults. appName must be kept in sync by hand with
// wails.json's "name"/"info.productName" and frontend/src/config.ts's
// APP_NAME — Go, the Wails build config, and the frontend bundle are three
// separate build artifacts with no shared runtime link between them.
const (
	appName      = "ADBScope"
	windowWidth  = 1024
	windowHeight = 768
)

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:     appName,
		Width:     windowWidth,
		Height:    windowHeight,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

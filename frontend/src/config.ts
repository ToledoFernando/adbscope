// App identity used in the UI (title bar, document title, etc). Kept by
// hand in sync with wails.json's "name"/"info.productName" and main.go's
// appName — there's no shared runtime link between the Go binary, the
// Wails build config, and this frontend bundle.
export const APP_NAME = "ADBScope"

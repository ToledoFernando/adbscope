import {create} from 'zustand'

const RECORDINGS_DIR_KEY = 'adbview.captures.recordingsDir'
const SCREENSHOTS_DIR_KEY = 'adbview.captures.screenshotsDir'

interface CapturePathsStore {
  // "" means "ask every time" (native save dialog); a configured folder
  // skips that dialog and saves straight there with a generated filename.
  recordingsDir: string
  screenshotsDir: string
  setRecordingsDir: (dir: string) => void
  setScreenshotsDir: (dir: string) => void
}

export const useCapturePathsStore = create<CapturePathsStore>((set) => ({
  recordingsDir: localStorage.getItem(RECORDINGS_DIR_KEY) ?? '',
  screenshotsDir: localStorage.getItem(SCREENSHOTS_DIR_KEY) ?? '',

  setRecordingsDir: (dir) => {
    localStorage.setItem(RECORDINGS_DIR_KEY, dir)
    set({recordingsDir: dir})
  },

  setScreenshotsDir: (dir) => {
    localStorage.setItem(SCREENSHOTS_DIR_KEY, dir)
    set({screenshotsDir: dir})
  },
}))

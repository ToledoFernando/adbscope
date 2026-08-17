import {create} from 'zustand'

const STORAGE_KEY = 'adbview.device.aliases'

function loadAliases(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

interface AliasStore {
  aliases: Record<string, string>
  setAlias: (deviceId: string, name: string) => void
  clearAlias: (deviceId: string) => void
}

// Custom per-device display names, keyed by device ID and persisted
// locally — purely a frontend label, the backend has no concept of
// device nicknames (devices come from live `adb devices` output, nothing
// to rename there).
export const useDeviceAliasStore = create<AliasStore>((set) => ({
  aliases: loadAliases(),

  setAlias: (deviceId, name) =>
    set((state) => {
      const aliases = {...state.aliases, [deviceId]: name}
      localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases))
      return {aliases}
    }),

  clearAlias: (deviceId) =>
    set((state) => {
      const aliases = {...state.aliases}
      delete aliases[deviceId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(aliases))
      return {aliases}
    }),
}))

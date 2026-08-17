import {create} from 'zustand'

const STORAGE_KEY = 'adbview.device.ignored'

function loadIgnored(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function persist(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

interface IgnoredStore {
  ignored: Set<string>
  ignore: (deviceId: string) => void
  unignore: (deviceId: string) => void
}

// "Eliminar" removes a device from the sidebar immediately, but the
// backend keeps polling `adb devices` regardless of what the frontend
// does — without this, a still-reachable USB/WiFi device would just
// reappear on the next poll. Membership here suppresses that until the
// device fully disconnects and reconnects fresh (see useDeviceEvents'
// device.disconnected handler, which unignores on real disconnect) — a
// genuinely new connection isn't permanently blocked.
export const useIgnoredDevicesStore = create<IgnoredStore>((set, get) => ({
  ignored: loadIgnored(),

  ignore: (deviceId) => {
    const next = new Set(get().ignored)
    next.add(deviceId)
    persist(next)
    set({ignored: next})
  },

  unignore: (deviceId) => {
    const next = new Set(get().ignored)
    next.delete(deviceId)
    persist(next)
    set({ignored: next})
  },
}))

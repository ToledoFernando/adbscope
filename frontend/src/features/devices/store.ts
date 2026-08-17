import {create} from 'zustand'
import type {Device} from './types'

interface DeviceStore {
  devices: Device[]
  selectedDeviceId: string | null
  isLoading: boolean

  setDevices: (devices: Device[]) => void
  upsertDevice: (device: Device) => void
  removeDevice: (deviceId: string) => void
  selectDevice: (deviceId: string | null) => void
  setLoading: (isLoading: boolean) => void
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  selectedDeviceId: null,
  isLoading: false,

  setDevices: (devices) => set({devices}),

  upsertDevice: (device) =>
    set((state) => {
      const index = state.devices.findIndex((d) => d.ID === device.ID)
      if (index === -1) {
        return {devices: [...state.devices, device]}
      }
      const devices = [...state.devices]
      devices[index] = device
      return {devices}
    }),

  // Deliberately doesn't clear selectedDeviceId when it matches deviceId:
  // if the device you're actively viewing drops off the list, staying
  // "selected" keeps its Overview/Screen/Shell tabs mounted so they can
  // show their own disconnected state with a manual reconnect option,
  // instead of silently kicking you back to "select a device". See
  // useDeviceEvents' device.disconnected handler for the session teardown
  // that goes with this.
  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.ID !== deviceId),
    })),

  selectDevice: (deviceId) => set({selectedDeviceId: deviceId}),

  setLoading: (isLoading) => set({isLoading}),
}))

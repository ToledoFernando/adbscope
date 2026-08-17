import type {domain} from '@/../wailsjs/go/models'

export type Device = domain.Device

export const DeviceState = {
  Online: 'online',
  Offline: 'offline',
  Unauthorized: 'unauthorized',
} as const

export const TransportType = {
  USB: 'usb',
  WiFi: 'wifi',
  Emulator: 'emulator',
} as const

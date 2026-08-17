import {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {toast} from 'sonner'
import {EventsOn} from '@/../wailsjs/runtime/runtime'
import {GetDevices} from '@/../wailsjs/go/main/App'
import {useLogcatStore} from '@/features/logcat/store'
import {useDeviceStore} from '../store'
import {stopDeviceSessions} from '../teardown'
import {useIgnoredDevicesStore} from '../ignoredStore'
import type {Device} from '../types'

// Loads the initial device snapshot and keeps the store in sync with the
// device.connected/updated/disconnected events emitted by the Go backend.
export function useDeviceEvents() {
  const {t} = useTranslation()
  const setDevices = useDeviceStore((s) => s.setDevices)
  const upsertDevice = useDeviceStore((s) => s.upsertDevice)
  const removeDevice = useDeviceStore((s) => s.removeDevice)
  const setLoading = useDeviceStore((s) => s.setLoading)

  useEffect(() => {
    const isIgnored = (id: string) => useIgnoredDevicesStore.getState().ignored.has(id)

    setLoading(true)
    GetDevices()
      .then((devices) => setDevices(devices.filter((d) => !isIgnored(d.ID))))
      .finally(() => setLoading(false))

    const offConnected = EventsOn('device.connected', (device: Device) => {
      if (isIgnored(device.ID)) return
      upsertDevice(device)
    })
    const offUpdated = EventsOn('device.updated', (device: Device) => {
      if (isIgnored(device.ID)) return
      upsertDevice(device)
    })
    const offDisconnected = EventsOn('device.disconnected', (device: Device) => {
      removeDevice(device.ID)
      // A real disconnect means a future connection is a fresh one — an
      // "Eliminar" from before shouldn't keep blocking it forever.
      useIgnoredDevicesStore.getState().unignore(device.ID)

      // Only the device currently open in the workspace has live
      // sessions worth stopping — and since removeDevice no longer clears
      // selectedDeviceId, its tabs stay mounted, so those sessions won't
      // notice on their own (no unmount to trigger their cleanup).
      if (useDeviceStore.getState().selectedDeviceId !== device.ID) return
      stopDeviceSessions(device.ID)
      useLogcatStore.getState().setOpen(false)
      toast.error(t('devices.lostConnection', {device: device.Model || device.Serial}))
    })

    return () => {
      offConnected()
      offUpdated()
      offDisconnected()
    }
  }, [setDevices, upsertDevice, removeDevice, setLoading, t])
}

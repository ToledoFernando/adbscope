import {useTranslation} from 'react-i18next'
import {ScrollArea} from '@/components/ui/scroll-area'
import {useDeviceStore} from '../store'
import {DeviceListItem} from './DeviceListItem'

export function DeviceList() {
  const devices = useDeviceStore((s) => s.devices)
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId)
  const selectDevice = useDeviceStore((s) => s.selectDevice)
  const isLoading = useDeviceStore((s) => s.isLoading)
  const {t} = useTranslation()

  if (isLoading && devices?.length === 0) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">{t('deviceList.loading')}</p>
  }

  if (devices?.length === 0) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">{t('deviceList.empty')}</p>
  }

  return (
    <div className="h-full w-full overflow-hidden flex-1">
      <div className="flex flex-col w-full flex-1">
        {devices?.map((device) => (
          <DeviceListItem
            key={device.ID}
            device={device}
            selected={device.ID === selectedDeviceId}
            onSelect={() => selectDevice(device.ID)}
          />
        ))}
      </div>
    </div>
  )
}

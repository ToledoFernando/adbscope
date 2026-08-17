import {useState} from 'react'
import {toast} from 'sonner'
import {useTranslation} from 'react-i18next'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Separator} from '@/components/ui/separator'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {connectWiFi, pairWiFi, restartServer} from '../api'

export function ConnectDeviceDialog() {
  const {t} = useTranslation()
  const [open, setOpen] = useState(false)

  const [pairIp, setPairIp] = useState('')
  const [pairPort, setPairPort] = useState('')
  const [pairCode, setPairCode] = useState('')
  const [isPairing, setIsPairing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)

  const [ip, setIp] = useState('')
  const [port, setPort] = useState('5555')
  const [isConnecting, setIsConnecting] = useState(false)

  async function handlePair() {
    if (!pairIp.trim() || !pairPort.trim() || !pairCode.trim()) {
      toast.error(t('connectDialog.errors.fillPairFields'))
      return
    }
    setIsPairing(true)
    try {
      await pairWiFi(pairIp.trim(), pairPort.trim(), pairCode.trim())
      toast.success(t('connectDialog.toasts.paired'))
      setPairCode('')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsPairing(false)
    }
  }

  async function handleRestartServer() {
    setIsRestarting(true)
    try {
      await restartServer()
      toast.success(t('connectDialog.toasts.serverRestarted'))
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsRestarting(false)
    }
  }

  async function handleConnect() {
    if (!ip.trim()) {
      toast.error(t('connectDialog.errors.enterIp'))
      return
    }
    setIsConnecting(true)
    try {
      await connectWiFi(ip.trim(), port.trim())
      toast.success(t('connectDialog.toasts.connected', {address: `${ip}:${port || '5555'}`}))
      setOpen(false)
      setIp('')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          {t('connectDialog.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('connectDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('connectDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wifi">
          <TabsList className="w-full">
            <TabsTrigger value="usb" className="flex-1">{t('connectDialog.tabUsb')}</TabsTrigger>
            <TabsTrigger value="wifi" className="flex-1">{t('connectDialog.tabWifi')}</TabsTrigger>
          </TabsList>

          <TabsContent value="usb" className="text-sm text-muted-foreground">
            {t('connectDialog.usbHint')}
          </TabsContent>

          <TabsContent value="wifi" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {t('connectDialog.pairHint')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pair-ip">{t('connectDialog.ipAddress')}</Label>
                  <Input id="pair-ip" placeholder="192.168.1.42" value={pairIp} onChange={(e) => setPairIp(e.target.value)}/>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pair-port">{t('connectDialog.port')}</Label>
                  <Input id="pair-port" placeholder="40719" value={pairPort} onChange={(e) => setPairPort(e.target.value)}/>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pair-code">{t('connectDialog.pairingCode')}</Label>
                <Input id="pair-code" placeholder="123456" value={pairCode} onChange={(e) => setPairCode(e.target.value)}/>
              </div>
              <Button variant="outline" onClick={handlePair} disabled={isPairing}>
                {isPairing ? t('connectDialog.pairing') : t('connectDialog.pair')}
              </Button>
              <Button
                variant="link"
                size="sm"
                className="h-auto self-start px-0 text-xs text-muted-foreground"
                onClick={handleRestartServer}
                disabled={isRestarting}
              >
                {isRestarting ? t('connectDialog.restartingServer') : t('connectDialog.restartServer')}
              </Button>
            </div>

            <Separator/>

            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {t('connectDialog.connectHint')}
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wifi-ip">{t('connectDialog.ipAddress')}</Label>
                <Input id="wifi-ip" placeholder="192.168.1.42" value={ip} onChange={(e) => setIp(e.target.value)}/>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wifi-port">{t('connectDialog.port')}</Label>
                <Input id="wifi-port" placeholder="5555" value={port} onChange={(e) => setPort(e.target.value)}/>
              </div>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? t('connectDialog.connecting') : t('connectDialog.connect')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

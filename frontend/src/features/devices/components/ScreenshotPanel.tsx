import {useState} from 'react'
import {toast} from 'sonner'
import {useTranslation} from 'react-i18next'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {takeScreenshot} from '../api'

interface ScreenshotPanelProps {
  deviceId: string
}

export function ScreenshotPanel({deviceId}: ScreenshotPanelProps) {
  const {t} = useTranslation()
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  async function handleCapture() {
    setIsCapturing(true)
    try {
      const base64 = await takeScreenshot(deviceId)
      setDataUrl(`data:image/png;base64,${base64}`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsCapturing(false)
    }
  }

  function handleSave() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `screenshot-${Date.now()}.png`
    a.click()
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{t('screenshot.title')}</CardTitle>
        <div className="flex gap-2">
          {dataUrl && (
            <Button variant="outline" size="sm" onClick={handleSave}>
              {t('screenshot.save')}
            </Button>
          )}
          <Button size="sm" onClick={handleCapture} disabled={isCapturing}>
            {isCapturing ? t('screenshot.capturing') : t('screenshot.capture')}
          </Button>
        </div>
      </CardHeader>
      {dataUrl && (
        <CardContent>
          <img src={dataUrl} alt={t('screenshot.title')} className="max-h-96 w-auto rounded-md border border-border"/>
        </CardContent>
      )}
    </Card>
  )
}

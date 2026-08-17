import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Settings } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Content from './Content';

function SettingsModal() {
  const { t } = useTranslation()
  return (
    <Dialog modal>

        <DialogTrigger asChild>
            <Button variant={'ghost'} className='px-0' aria-label={t('settings.title')}>
                <Settings />
            </Button>
        </DialogTrigger>

        <DialogContent>
            <Content />
        </DialogContent>

    </Dialog>        
  )
}

export default SettingsModal
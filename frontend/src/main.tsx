import {createRoot} from 'react-dom/client'
import {HashRouter} from 'react-router-dom'
import {Toaster} from 'sonner'
import './lib/wailsBrowserShim'
import './style.css'
import './i18n'
import './features/Settings/store'
import App from './App'
import { StrictMode } from 'react'
import { TooltipProvider } from './components/ui/tooltip'
import { APP_NAME } from './config'

document.title = APP_NAME

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <StrictMode>
        <TooltipProvider>

        <HashRouter>
            <App/>
            <Toaster position="top-right"/>
        </HashRouter>
        </TooltipProvider>
    </StrictMode>
)

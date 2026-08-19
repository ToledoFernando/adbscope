import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {DeviceList} from "@/features/devices/components/DeviceList";
import {ConnectDeviceDialog} from "@/features/devices/components/ConnectDeviceDialog";
import {LogcatPanel} from "@/features/logcat/components/LogcatPanel";
import {useLogcatStore} from "@/features/logcat/store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import SettingsModal from "@/features/Settings/components/SettingsModal";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({children}: AppShellProps) {
  const isLogcatOpen = useLogcatStore((s) => s.isOpen);
  const {t} = useTranslation();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void text-foreground">
      <ResizablePanelGroup className="flex min-h-0 flex-1 overflow-hidden">
      <ResizablePanel
        className="flex shrink-0 flex-col border-r border-hairline bg-panel"
        minSize={"10%"}
        maxSize={"30%"}
      >
        <div className="flex justify-between h-9 shrink-0 items-center border-b border-hairline px-3">
          <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-ink-muted uppercase">
            {t("appShell.devices")}
          </span>
          <SettingsModal />
        </div>
        <div className="flex-1 overflow-hidden">
          <DeviceList/>
        </div>
        <div className="border-t border-hairline p-2">
          <ConnectDeviceDialog/>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle/>
      <ResizablePanel className="bg-void">
          <ResizablePanelGroup orientation="vertical" className="flex flex-1 flex-col overflow-hidden">
            <ResizablePanel className="flex flex-1 h-full flex-col overflow-hidden">
                {children}
              </ResizablePanel>
                <LogcatPanel/>
          </ResizablePanelGroup>
      </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

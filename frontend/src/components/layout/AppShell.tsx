import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {DeviceList} from "@/features/devices/components/DeviceList";
import {ConnectDeviceDialog} from "@/features/devices/components/ConnectDeviceDialog";
import {LogcatPanel} from "@/features/logcat/components/LogcatPanel";
import {useLogcatStore} from "@/features/logcat/store";
import {TitleBar} from "./TitleBar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({children}: AppShellProps) {
  const isLogcatOpen = useLogcatStore((s) => s.isOpen);
  const {t} = useTranslation();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void text-foreground">
      <TitleBar/>
      <ResizablePanelGroup className="flex min-h-0 flex-1 overflow-hidden">
      <ResizablePanel
        className="flex shrink-0 flex-col border-r border-hairline bg-panel"
        minSize={"5%"}
        maxSize={"20%"}
      >
        <div className="flex h-9 shrink-0 items-center border-b border-hairline px-3">
          <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-ink-muted uppercase">
            {t("appShell.devices")}
          </span>
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
        {/* {isLogcatOpen ? (
          <ResizablePanelGroup orientation="vertical" className="flex flex-1 flex-col overflow-hidden">
            <ResizablePanel defaultSize={"70%"} minSize={"20%"}>
              {children}
            </ResizablePanel>
            <ResizableHandle withHandle/>
            <ResizablePanel defaultSize={"30%"} minSize={"10%"} maxSize={"80%"}>
              <LogcatPanel/>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
            <LogcatPanel/>
          </div>
        )} */}
      </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

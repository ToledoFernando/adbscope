import { useRef, useState } from "react";
import {
  Check,
  Languages,
  PowerOff,
  RefreshCcw,
  ScanSquare,
  Settings,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceOverview } from "@/features/devices/components/DeviceOverview";
import { useDeviceEvents } from "@/features/devices/hooks/useDeviceEvents";
import { useDeviceStore } from "@/features/devices/store";
import { stopDeviceSessions } from "@/features/devices/teardown";
import { useLogcatStore } from "@/features/logcat/store";
import { ScreenViewer } from "@/features/screen/components/ScreenViewer";
import { ShellTerminal } from "@/features/shell/components/ShellTerminal";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { takeScreenshot } from "./features/devices/api";

function Workspace() {
  const { t, i18n } = useTranslation();
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const selectDevice = useDeviceStore((s) => s.selectDevice);
  const closeLogcat = useLogcatStore((s) => s.setOpen);
  const isOpenLogCat = useLogcatStore((s) => s.isOpen);
  // Bumped on disconnect to force Overview/Screen/Shell to fully remount
  // instead of trusting each tab's own state to notice their process died.
  const [generation, setGeneration] = useState(0);

  // Tracks which tabs have ever been opened for this device. A visited tab
  // gets forceMount (stays mounted, just hidden via CSS, when switching
  // away) so its live session — scrcpy, the shell — keeps running in the
  // background instead of dying on every tab switch. An unvisited tab
  // stays unmounted until first opened, so nothing starts eagerly.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set(["overview"]),
  );
  // Bumped by "Reconectar" to remount just DeviceOverview and force it to
  // refetch — unlike `generation`, this leaves any live Screen/Shell
  // sessions running.
  const [overviewKey, setOverviewKey] = useState(0);

  const [activeTab, setActiveTab] = useState("overview");
  const tabsListRef = useRef<HTMLDivElement>(null);

  // A quick brightness blip on the segmented selector itself — chrome
  // only, never the tab content — so switching instruments reads as a
  // deliberate channel change instead of an instant CSS toggle. Kept off
  // the content panes entirely: those geometry-drive the embedded native
  // scrcpy window (see ScreenViewer), and animating them is not safe.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        tabsListRef.current,
        { filter: "brightness(1.6)" },
        { filter: "brightness(1)", duration: 0.25, ease: "power2.out" },
      );
    },
    { dependencies: [activeTab], scope: tabsListRef },
  );

  function handleReconnect() {
    setOverviewKey((k) => k + 1);
    toast.success(t("workspace.refreshingToast"));
  }

  async function handleCapture() {
    if (!selectedDeviceId) return;
    try {
      const base64 = await takeScreenshot(selectedDeviceId);
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${base64}`;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      // setDataUrl(`data:image/png;base64,${base64}`)
    } catch (err) {
      toast.error(String(err));
    } finally {
    }
  }

  if (!selectedDeviceId) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("workspace.selectDevice")}
      </div>
    );
  }

  async function handleDisconnect() {
    const deviceId = selectedDeviceId!;
    closeLogcat(false); // triggers useLogcatStream's own cleanup -> StopLogcat
    await stopDeviceSessions(deviceId);
    setGeneration((g) => g + 1);
    selectDevice(null);
    toast.success(t("workspace.disconnectedToast"));
  }

  return (
    <Tabs
      key={`${selectedDeviceId}-${generation}`}
      defaultValue="overview"
      onValueChange={(value) => {
        setVisitedTabs((prev) =>
          prev.has(value) ? prev : new Set(prev).add(value),
        )
        setActiveTab(value)
      }}
      className="flex flex-1 h-full flex-col overflow-hidden gap-0"
    >
      <div className="mx-6 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TabsList ref={tabsListRef} className="w-fit">
            <TabsTrigger value="overview">{t("workspace.overview")}</TabsTrigger>
            <TabsTrigger value="screen">{t("workspace.screen")}</TabsTrigger>
            <TabsTrigger value="shell">{t("workspace.shell")}</TabsTrigger>
          </TabsList>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => closeLogcat(!isOpenLogCat)}
                size={"icon-lg"}
                variant={"ghost"}
                className="cursor-pointer"
              >
                <Terminal />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("workspace.openConsole")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={"icon-lg"}>
              <Settings />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleCapture}>
                <ScanSquare />
                {t("workspace.takeScreenshot")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReconnect}>
                <RefreshCcw />
                {t("workspace.reconnect")}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Languages />
                  {t("language.label")}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                      >
                        {lang.label}
                        {i18n.resolvedLanguage === lang.code && (
                          <Check className="ml-auto h-3.5 w-3.5" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleDisconnect}
                variant="destructive"
              >
                <PowerOff />
                {t("workspace.disconnect")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* <Button variant="outline" size="sm" onClick={handleDisconnect}>
          <PowerOff/>
          Disconnect
        </Button> */}
      </div>
      <TabsContent
        value="overview"
        forceMount
        className="hidden flex-1 overflow-y-auto data-[state=active]:block"
      >
        <DeviceOverview key={overviewKey} deviceId={selectedDeviceId} />
      </TabsContent>
      {visitedTabs.has("screen") && (
        <TabsContent
          value="screen"
          forceMount
          className="hidden flex-1 h-full flex-col overflow-hidden data-[state=active]:flex"
        >
          <ScreenViewer deviceId={selectedDeviceId} />
        </TabsContent>
      )}
      {visitedTabs.has("shell") && (
        <TabsContent
          value="shell"
          forceMount
          className="hidden flex-1 flex-col overflow-hidden data-[state=active]:flex"
        >
          <ShellTerminal deviceId={selectedDeviceId} />
        </TabsContent>
      )}
    </Tabs>
  );
}

function App() {
  useDeviceEvents();

  return (
    <AppShell>
      <Workspace />
    </AppShell>
  );
}

export default App;

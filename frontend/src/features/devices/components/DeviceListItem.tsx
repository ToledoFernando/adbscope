import { useRef, useState } from "react";
import { MoreVertical, Pencil, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { disconnectDevice } from "../api";
import { stopDeviceSessions } from "../teardown";
import { useDeviceAliasStore } from "../aliasStore";
import { useIgnoredDevicesStore } from "../ignoredStore";
import type { Device } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeviceStore } from "../store";

const stateDotStyles: Record<string, string> = {
  online: "bg-state-online animate-led-pulse",
  offline: "bg-ink-faint",
  unauthorized: "bg-state-warning",
};

interface DeviceListItemProps {
  device: Device;
  selected: boolean;
  onSelect: () => void;
}

export function DeviceListItem({
  device,
  selected,
  onSelect,
}: DeviceListItemProps) {
  const deviceConnected = useDeviceStore((state) => state.selectedDeviceId);
  const selectDevice = useDeviceStore((state) => state.selectDevice);
  const removeDevice = useDeviceStore((state) => state.removeDevice);
  const alias = useDeviceAliasStore((s) => s.aliases[device.ID]);
  const setAlias = useDeviceAliasStore((s) => s.setAlias);
  const ignoreDevice = useIgnoredDevicesStore((s) => s.ignore);
  const { t } = useTranslation();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const transportLabels: Record<string, string> = {
    usb: t("deviceListItem.transport.usb"),
    wifi: t("deviceListItem.transport.wifi"),
    emulator: t("deviceListItem.transport.emulator"),
  };

  const displayName = alias || device.Model || device.Serial;

  async function handleDisconnect(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await stopDeviceSessions(device.ID);
      await disconnectDevice(device.ID);
      if (deviceConnected === device.ID) selectDevice(null);
      toast.success(t("deviceListItem.disconnectedToast", { device: displayName }));
    } catch (err) {
      toast.error(String(err));
    }
  }

  // Disconnects (WiFi only — adb has no way to sever a USB session in
  // software) and stops sessions, but also hides the entry from the
  // sidebar immediately and keeps it hidden even if the backend's
  // `adb devices` polling still sees it (still plugged in / still
  // reachable on the network) — see ignoredStore. A real disconnect
  // clears that suppression, so this isn't a permanent ban.
  async function handleEliminate(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await stopDeviceSessions(device.ID);
      if (device.Transport === "wifi") {
        await disconnectDevice(device.ID);
      }
      if (deviceConnected === device.ID) selectDevice(null);
      ignoreDevice(device.ID);
      removeDevice(device.ID);
      setAlias(device.ID, "");
      toast.success(t("deviceListItem.removedToast", { device: displayName }));
    } catch (err) {
      toast.error(String(err));
    }
  }

  function handleOpenRename() {
    setRenameValue(displayName);
    setRenameOpen(true);
  }

  function handleSaveRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== device.Model && trimmed !== device.Serial) {
      setAlias(device.ID, trimmed);
    } else {
      setAlias(device.ID, "");
    }
    setRenameOpen(false);
  }

  const rootRef = useRef<HTMLDivElement>(null);

  // A device tile mounts once per device joining the rack (React key =
  // device.ID), so this fires exactly on "a device just showed up" — a
  // quick channel-strip power-on, not a re-render tic.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(rootRef.current, {
        opacity: 0,
        y: -6,
        duration: 0.32,
        ease: "power2.out",
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "group relative flex w-full flex-col gap-1.5 border-b border-hairline py-2 pr-2 pl-3 text-left text-sm transition-colors hover:bg-panel-raised",
        selected && "bg-panel-raised",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 bg-state-live transition-opacity",
          selected ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div className="flex w-full items-center gap-2">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            stateDotStyles[device.State] ?? stateDotStyles.offline,
          )}
        />
        <span className="min-w-0 flex-1 truncate font-medium">
          {displayName}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t("deviceListItem.options")}
              className="optionMenu hidden group-hover:block shrink-0 opacity-0 group-hover:opacity-100"
              // onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleOpenRename}>
                <Pencil />
                {t("deviceListItem.edit")}
              </DropdownMenuItem>
              {device.Transport === "wifi" && (
                <DropdownMenuItem onClick={handleDisconnect}>
                  <PowerOff />
                  {t("deviceListItem.disconnect")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={handleEliminate}>
                <Trash2 />
                {t("deviceListItem.delete")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 pl-4">
        <Badge variant={device.Transport === "wifi" ? "default" : "secondary"} className="py-0">
          {transportLabels[device.Transport] ?? device.Transport}
        </Badge>
        <span className="truncate font-mono text-xs text-ink-faint">{device.Serial}</span>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deviceListItem.renameTitle")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={device.Model || device.Serial}
            onKeyDown={(e) => e.key === "Enter" && handleSaveRename()}
          />
          <DialogFooter>
            {alias && (
              <Button variant="outline" onClick={() => { setAlias(device.ID, ""); setRenameOpen(false); }}>
                {t("deviceListItem.resetName")}
              </Button>
            )}
            <Button onClick={handleSaveRename}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

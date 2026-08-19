import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GetDeviceOverview } from "@/../wailsjs/go/main/App";
import type { domain } from "@/../wailsjs/go/models";
import ChartPie from "@/components/ui/PieChart";
import { cn } from "@/lib/utils";
import { useDeviceAliasStore } from "../aliasStore";
import {
  Battery,
  BatteryCharging,
  CircleDot,
  Clock,
  HardDrive,
  Info,
  MemoryStick,
  MonitorSmartphone,
  Smartphone,
  Usb,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Label } from "recharts";

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatUptime(seconds: number) {
  if (!seconds) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

const STATE_CONFIG: Record<string, { labelKey: string; className: string }> = {
  online: {
    labelKey: "overview.state.online",
    className: "border-state-online/30 bg-state-online/10 text-state-online",
  },
  offline: {
    labelKey: "overview.state.offline",
    className: "border-hairline bg-transparent text-ink-faint",
  },
  unauthorized: {
    labelKey: "overview.state.unauthorized",
    className: "border-state-warning/30 bg-state-warning/10 text-state-warning",
  },
};

const TRANSPORT_ICON: Record<string, LucideIcon> = {
  usb: Usb,
  wifi: Wifi,
  emulator: MonitorSmartphone,
};

interface DeviceOverviewProps {
  deviceId: string;
}

export function DeviceOverview({ deviceId }: DeviceOverviewProps) {
  const { t } = useTranslation();
  const alias = useDeviceAliasStore((s) => s.aliases[deviceId]);
  const [info, setInfo] = useState<domain.DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    GetDeviceOverview(deviceId)
      .then((data) => !cancelled && setInfo(data))
      .catch((err) => !cancelled && setError(String(err)))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <p className="p-6 text-sm text-destructive">
        {error ?? t("overview.loadError")}
      </p>
    );
  }

  const storagePercent = info.StorageTotalBytes
    ? Math.round((info.StorageUsedBytes / info.StorageTotalBytes) * 100)
    : 0;

  const stateConfig = STATE_CONFIG[info.State] ?? STATE_CONFIG.offline;
  const TransportIcon = TRANSPORT_ICON[info.Transport] ?? Smartphone;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-hairline bg-panel-raised">
          <Smartphone className="h-5 w-5 text-ink-muted" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-base font-semibold text-foreground">
              {alias || info.Model || info.Serial}
            </h1>
            <Badge variant="outline" className={cn("gap-1", stateConfig.className)}>
              <CircleDot className="h-2 w-2 fill-current" />
              {t(stateConfig.labelKey)}
            </Badge>
            <Badge variant="outline" className="gap-1 text-ink-muted">
              <TransportIcon className="h-3 w-3" />
              {t(`deviceListItem.transport.${info.Transport}`, info.Transport)}
            </Badge>
          </div>
          <p className="truncate font-mono text-xs text-ink-faint">
            {info.Manufacturer || "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<BatteryCharging className="h-4 w-4" />}
          label={t("overview.battery")}
          value={`${info.BatteryLevel}%`}
          progress={info.BatteryLevel}
          sub={info.BatteryStatus || "—"}
        />
        <StatTile
          icon={<HardDrive className="h-4 w-4" />}
          label={t("overview.storage")}
          value={`${storagePercent}%`}
          progress={storagePercent}
          sub={t("overview.storageOf", {
            used: formatBytes(info.StorageUsedBytes),
            total: formatBytes(info.StorageTotalBytes),
          })}
        />
        <StatTile
          icon={<MemoryStick className="h-4 w-4" />}
          label={t("overview.ram")}
          value={formatBytes(info.TotalRAMBytes)}
          sub={info.CPUCores ? t("overview.cores", { count: info.CPUCores }) : "—"}
        />
        <StatTile
          icon={<Clock className="h-4 w-4" />}
          label={t("overview.uptime")}
          value={formatUptime(info.UptimeSeconds)}
          sub={t("overview.uptimeSub")}
        />
      </div>

      <div className="grid grid-cols-10 gap-4">
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" /> {t("overview.deviceInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <InfoSection title={t("overview.sections.identification")}>
              <InfoRow label={t("overview.fields.model")} value={info.Model || "—"} />
              <InfoRow label={t("overview.fields.manufacturer")} value={info.Manufacturer || "—"} />
              <InfoRow label={t("overview.fields.brand")} value={info.Brand || "—"} />
              <InfoRow label={t("overview.fields.serial")} value={info.Serial} mono />
            </InfoSection>

            <Separator />

            <InfoSection title={t("overview.sections.system")}>
              <InfoRow label={t("overview.fields.android")} value={info.Android || "—"} />
              <InfoRow label={t("overview.fields.sdk")} value={info.SDK ? String(info.SDK) : "—"} />
              <InfoRow label={t("overview.fields.securityPatch")} value={info.SecurityPatch || "—"} />
              <InfoRow label={t("overview.fields.buildId")} value={info.BuildID || "—"} mono />
            </InfoSection>

            <Separator />

            <InfoSection title={t("overview.sections.hardware")}>
              <InfoRow label={t("overview.fields.architecture")} value={info.Architecture || "—"} />
              <InfoRow label={t("overview.fields.supportedAbis")} value={info.SupportedABIs || "—"} mono />
              <InfoRow label={t("overview.fields.board")} value={info.Board || "—"} />
              <InfoRow label={t("overview.fields.hardware")} value={info.Hardware || "—"} />
              <InfoRow label={t("overview.fields.bootloader")} value={info.Bootloader || "—"} mono />
              <InfoRow label={t("overview.fields.cpuCores")} value={info.CPUCores ? String(info.CPUCores) : "—"} />
            </InfoSection>

            <Separator />

            <InfoSection title={t("overview.sections.screen")}>
              <InfoRow label={t("overview.fields.resolution")} value={info.Resolution || "—"} />
              <InfoRow
                label={t("overview.fields.density")}
                value={info.Density ? `${info.Density} dpi` : "—"}
              />
            </InfoSection>
          </CardContent>
        </Card>

        <div className="flex flex-col col-span-2 gap-4">
          <ChartPie
            headerComponent={
              <CardTitle className="flex items-center gap-2 text-sm">
                <Battery className="h-4 w-4" /> {t("overview.battery")}
              </CardTitle>
            }
            dataKey="value"
            nameKey="label"
            valueFormatter={(value) => `${value}%`}
            footerComponent={
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {t("overview.batteryDetail.status")}: <span className="font-medium text-foreground">{info.BatteryStatus || "—"}</span>
                </span>
                <span>
                  {t("overview.batteryDetail.health")}: <span className="font-medium text-foreground">{info.BatteryHealth || "—"}</span>
                </span>
                <span>
                  {t("overview.batteryDetail.charger")}:{" "}
                  <span className="font-medium text-foreground">
                    {info.BatteryPlugged || t("overview.batteryDetail.none")}
                  </span>
                </span>
                <span>
                  {t("overview.batteryDetail.voltage")}:{" "}
                  <span className="font-medium text-foreground">
                    {info.BatteryVoltage ? `${info.BatteryVoltage.toFixed(2)} V` : "—"}
                  </span>
                </span>
                <span className="col-span-2">
                  {t("overview.batteryDetail.temperature")}:{" "}
                  <span className="font-medium text-foreground">
                    {info.BatteryTemperature ? `${info.BatteryTemperature.toFixed(1)} °C` : "—"}
                  </span>
                </span>
              </div>
            }
            data={[
              {
                label: t("overview.pieLabels.charge"),
                value: info.BatteryLevel,
                fill: info.BatteryLevel <= 15 ? "var(--state-fault)" : "var(--state-online)",
              },
              { label: t("overview.pieLabels.remaining"), value: 100 - info.BatteryLevel, fill: "var(--panel-sunken)" },
            ]}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground font-mono text-2xl font-semibold"
                      >
                        {info.BatteryLevel}%
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </ChartPie>

          <ChartPie
            headerComponent={
              <CardTitle className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4" /> {t("overview.storage")}
              </CardTitle>
            }
            dataKey="value"
            nameKey="label"
            valueFormatter={formatBytes}
            data={[
              {
                label: t("overview.pieLabels.used"),
                value: info.StorageUsedBytes,
                fill: "var(--state-live)",
              },
              {
                label: t("overview.pieLabels.free"),
                value: info.StorageTotalBytes - info.StorageUsedBytes,
                fill: "var(--panel-sunken)",
              },
            ]}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground font-mono text-xl font-semibold"
                      >
                        {formatBytes(info.StorageUsedBytes)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground font-mono text-xs"
                      >
                        {t("overview.ofTotal", { total: formatBytes(info.StorageTotalBytes) })}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </ChartPie>
        </div>
      </div>

    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  const readoutRef = useRef<HTMLSpanElement>(null);

  // Progress tiles (battery/storage) read out a live percentage — count it
  // up like an instrument settling on a reading instead of snapping to the
  // new value, so a refreshed overview feels like a taken measurement.
  useGSAP(
    () => {
      if (progress === undefined || !readoutRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = { n: 0 };
      gsap.to(target, {
        n: progress,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          if (readoutRef.current) readoutRef.current.textContent = `${Math.round(target.n)}%`;
        },
      });
    },
    { dependencies: [progress], scope: readoutRef },
  );

  return (
    <Card className="gap-2 py-3">
      <CardContent className="flex flex-col gap-1.5 px-3.5">
        <div className="flex items-center gap-1.5 text-ink-muted">
          {icon}
          <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
        </div>
        <span ref={readoutRef} className="font-mono text-2xl font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {progress !== undefined && <Progress value={progress} className="h-1.5" />}
        {sub && <span className="truncate font-mono text-[11px] text-ink-faint">{sub}</span>}
      </CardContent>
    </Card>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">{label}</span>
      <span
        className={cn("truncate text-sm font-medium text-foreground", mono && "font-mono text-[13px] tabular-nums")}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

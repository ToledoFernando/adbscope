import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Circle,
  RefreshCcw,
  Settings2,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeviceStore } from "@/features/devices/store";
import { useCapturePathsStore } from "@/features/Settings/capturePathsStore";
import { cn } from "@/lib/utils";
import {
  buildRecordingPath,
  chooseRecordingPath,
  setScreenMirrorRect,
  setScreenMirrorVisible,
  startScreenMirror,
  stopScreenMirror,
} from "../api";
import ScreenOptions from "./ScreenOptions";

interface ScreenViewerProps {
  deviceId: string;
}

const AUDIO_KEY = "adbview.screen.audio";

function loadAudioEnabled(): boolean {
  return localStorage.getItem(AUDIO_KEY) === "1";
}

// The mirrored screen is a native scrcpy window embedded via Win32
// SetParent (see internal/infrastructure/scrcpy), not a canvas we draw
// to. This div just reserves screen space and reports its rect so Go can
// keep the native window positioned on top of it. Because it's a real
// native window and not part of the page's compositing, nothing in React
// can render visually on top of it — controls belong beside it, not over it.
export function ScreenViewer({ deviceId }: ScreenViewerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"starting" | "running" | "error">(
    "starting",
  );
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(loadAudioEnabled);
  const [restartKey, setRestartKey] = useState(0);
  // Recording, like audio, is a launch-time scrcpy flag — starting or
  // stopping it means tearing down and restarting the mirror session
  // (recordingPath in the effect deps below). Never persisted: a fresh
  // mount always starts un-armed, so a new device or app restart can't
  // silently resume recording into a file the user forgot about.
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const recordingsDir = useCapturePathsStore((s) => s.recordingsDir);
  const deviceOnline = useDeviceStore((s) =>
    s.devices.some((d) => d.ID === deviceId && d.State === "online"),
  );

  // Audio is a launch-time flag for scrcpy, not something it can toggle on
  // a running session — audioEnabled/restartKey in the effect deps means
  // either one tears down and restarts the mirror.
  useEffect(() => {
    let cancelled = false;
    setStatus("starting");
    setError(null);

    startScreenMirror(
      deviceId,
      audioEnabled,
      recordingEnabled ? (recordingPath ?? "") : "",
    )
      .then(() => !cancelled && setStatus("running"))
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(String(err));
        toast.error(String(err));
      });

    return () => {
      cancelled = true;
      stopScreenMirror(deviceId).catch(() => {});
    };
  }, [deviceId, audioEnabled, recordingEnabled, recordingPath, restartKey]);

  // The device list (kept in sync by useDeviceEvents) is the source of
  // truth for whether this device is still reachable. If it drops out
  // while we're mid-session, the mirror session was already stopped
  // centrally (see useDeviceEvents' device.disconnected handler) — this
  // just reflects that in the UI instead of leaving a frozen/blank native
  // window with no explanation.
  useEffect(() => {
    if (status !== "running" || deviceOnline) return;
    setStatus("error");
    setError(t("screenViewer.disconnected"));
  }, [status, deviceOnline, t]);

  function handleReconnect() {
    // Also disarms recording rather than restarting into the same path:
    // scrcpy's --record behavior on an existing file is ambiguous
    // (overwrite vs. reject), so a manual reconnect requires explicitly
    // re-arming recording (screenViewer's default filename is
    // timestamped anyway, so re-arming naturally picks a fresh file).
    setRecordingEnabled(false);
    setRecordingPath(null);
    setRestartKey((k) => k + 1);
  }

  function handleToggleAudio() {
    const next = !audioEnabled;
    localStorage.setItem(AUDIO_KEY, next ? "1" : "0");
    setAudioEnabled(next);
  }

  async function handleToggleRecording() {
    if (recordingEnabled) {
      setRecordingEnabled(false);
      setRecordingPath(null);
      toast.success(
        t("screenViewer.recordingStopped", { path: recordingPath ?? "" }),
      );
      return;
    }

    try {
      // A configured default folder (Settings / ScreenOptions) skips the
      // save dialog entirely — recording starts immediately into a
      // generated, timestamped filename there.
      const path = recordingsDir
        ? await buildRecordingPath(deviceId, recordingsDir)
        : await chooseRecordingPath(deviceId, t("screenViewer.chooseRecordingPath"));
      if (!path) return; // user cancelled the save dialog
      setRecordingPath(path);
      setRecordingEnabled(true);
      toast.success(t("screenViewer.recordingStarted"));
    } catch (err) {
      toast.error(String(err));
    }
  }

  useEffect(() => {
    if (status !== "running") return;
    const el = containerRef.current;
    if (!el) return;

    const dpr = window.devicePixelRatio || 1;

    function report() {
      const rect = el!.getBoundingClientRect();
      setScreenMirrorRect(
        deviceId,
        Math.round(rect.x * dpr),
        Math.round(rect.y * dpr),
        Math.round(rect.width * dpr),
        Math.round(rect.height * dpr),
      ).catch(() => {});
    }

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener("resize", report);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", report);
    };
  }, [status, deviceId]);

  // The mirror is a real native window (see the note above) — it always
  // renders above web content, so a Dialog/DropdownMenu/Select opened
  // anywhere in the app would otherwise visibly show through it. Radix's
  // scroll-lock (via react-remove-scroll) sets data-scroll-locked on
  // <body> for exactly the overlays that need this — modal dialogs and
  // menus — and leaves it off for non-modal ones like Tooltip, which is
  // also the behavior we want (no flicker on every hover).
  useEffect(() => {
    if (status !== "running") return;

    function syncVisibility() {
      const coveredByOverlay = document.body.hasAttribute("data-scroll-locked");
      setScreenMirrorVisible(deviceId, !coveredByOverlay).catch(() => {});
    }

    syncVisibility();
    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });

    return () => {
      observer.disconnect();
      setScreenMirrorVisible(deviceId, true).catch(() => {});
    };
  }, [status, deviceId]);

  return (
    <div className="flex flex-1 py-8 flex-col gap-2 overflow-hidden p-6">
      {/* {status === 'starting' && <p className="font-mono text-xs text-ink-muted">{t('screenViewer.starting')}</p>} */}
      {status === "error" && (
        <p className="font-mono text-xs text-state-fault">
          {error ?? t("screenViewer.error")}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="flex-1 flex-col w-full flex h-full">
          {status === "starting" && (
            <div className="bg-white dark:bg-gray-800 animate-pulse rounded-lg flex-1 w-full block h-full" />
          )}
          <div
            ref={containerRef}
            style={{ display: status === "running" ? "block" : "none" }}
            className="flex-1 col-span-1 -z-10 rounded-md border border-hairline-strong bg-panel-sunken"
          />
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 rounded-full",
                status === "running"
                  ? "bg-state-online animate-led-pulse"
                  : status === "error"
                    ? "bg-state-fault"
                    : "bg-state-warning",
              )}
              aria-hidden
            />
            <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-ink-muted uppercase">
              {t("screenViewer.monitorLabel")}
            </span>
            {recordingEnabled && (
              <span className="flex items-center gap-1.5 pl-2">
                <span
                  className="size-1.5 animate-led-pulse rounded-full bg-state-fault text-state-fault"
                  aria-hidden
                />
                <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-state-fault">
                  {t("screenViewer.recIndicator")}
                </span>
              </span>
            )}
          </div>
        </div>
        <ScreenOptions
          handleToggleAudio={handleToggleAudio}
          handleReconnect={handleReconnect}
          handleToggleRecording={handleToggleRecording}
          audioEnabled={audioEnabled}
          status={status}
          recordingEnabled={recordingEnabled}
        />
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DirectoryPathField } from "@/features/Settings/components/DirectoryPathField";
import { useCapturePathsStore } from "@/features/Settings/capturePathsStore";
import { cn } from "@/lib/utils";
import { Circle, RefreshCcw, Square, Volume2, VolumeX } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface Props {
  recordingEnabled: boolean;
  status: string;
  audioEnabled: boolean;
  handleToggleAudio: () => void;
  handleReconnect: () => void;
  handleToggleRecording: () => void;
}

function ScreenOptions({
  recordingEnabled,
  status,
  audioEnabled,
  handleReconnect,
  handleToggleAudio,
  handleToggleRecording,
}: Props) {
  const { t } = useTranslation();
  const recordingsDir = useCapturePathsStore((s) => s.recordingsDir);
  const setRecordingsDir = useCapturePathsStore((s) => s.setRecordingsDir);
  const screenshotsDir = useCapturePathsStore((s) => s.screenshotsDir);
  const setScreenshotsDir = useCapturePathsStore((s) => s.setScreenshotsDir);

  return (
    <div className="col-span-1">
      <div className="flex max-w-lg mx-auto flex-col gap-4 p-4">
        <Button disabled={recordingEnabled} onClick={handleReconnect} variant="secondary" size="lg">
          <RefreshCcw />
          <p>{t("screenViewer.reconnect")}</p>
        </Button>
        <Button disabled={recordingEnabled} onClick={handleToggleAudio} variant="secondary" size="lg">
          {audioEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          <p>
            {audioEnabled
              ? t("screenViewer.audioOn")
              : t("screenViewer.audioOff")}
          </p>
        </Button>

        <Button onClick={handleToggleRecording} variant="secondary" size="lg">
          {recordingEnabled ? (
            <Square className="h-4 w-4 fill-current text-state-fault" />
          ) : (
            <Circle className="h-4 w-4 fill-current text-state-fault" />
          )}
          <p>
            {recordingEnabled
              ? t("screenViewer.stopRecording")
              : t("screenViewer.record")}
          </p>
        </Button>

        <Separator />

        <DirectoryPathField
          label={t("settings.recordingsFolder")}
          value={recordingsDir}
          onChange={setRecordingsDir}
          dialogTitle={t("settings.recordingsFolder")}
        />
        <DirectoryPathField
          label={t("settings.screenshotsFolder")}
          value={screenshotsDir}
          onChange={setScreenshotsDir}
          dialogTitle={t("settings.screenshotsFolder")}
        />
      </div>
    </div>
  );
}

export default ScreenOptions;

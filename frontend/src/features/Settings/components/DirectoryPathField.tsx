import { FolderOpen, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { chooseDirectory } from "../api";

interface DirectoryPathFieldProps {
  label: string;
  value: string;
  onChange: (dir: string) => void;
  dialogTitle: string;
}

// A labeled default-folder setting: shows the configured path (or "ask
// every time" when unset), a native folder picker, and a clear button to
// go back to asking. Shared between ScreenOptions (screen-module quick
// settings) and the global Settings dialog — both bind to the same
// capturePathsStore, so editing either place stays in sync.
export function DirectoryPathField({
  label,
  value,
  onChange,
  dialogTitle,
}: DirectoryPathFieldProps) {
  const { t } = useTranslation();

  async function handleChoose() {
    const dir = await chooseDirectory(dialogTitle);
    if (dir) onChange(dir);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          className="min-w-0 flex-1 truncate rounded-sm border border-hairline bg-input px-2.5 py-1.5 font-mono text-xs text-ink-faint"
          title={value || undefined}
        >
          {value || t("settings.askEveryTime")}
        </span>
        <Button variant="outline" size="sm" onClick={handleChoose}>
          <FolderOpen className="h-3.5 w-3.5" />
          {t("settings.chooseFolder")}
        </Button>
        {value && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange("")}
            aria-label={t("settings.clearFolder")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

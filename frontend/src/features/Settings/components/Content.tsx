import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useThemeStore, type Theme } from "../store";

const THEME_OPTIONS: { value: Theme; icon: typeof Monitor }[] = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

function Content() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("settings.title")}</DialogTitle>
      </DialogHeader>

      <div className="min-w-xl pt-2">
        <div className="flex items-center justify-between">
          <p>{t("settings.language")}</p>

          <Select
            value={i18n.resolvedLanguage}
            onValueChange={(value) => i18n.changeLanguage(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        <p className="mb-2 text-sm text-muted-foreground">{t("settings.theme")}</p>
        <div className="grid grid-cols-3 gap-4">
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent",
                theme === value ? "border-primary bg-accent" : "border-border",
              )}
            >
              {theme === value && (
                <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
              )}
              <Icon className="h-5 w-5" />
              {t(`settings.themeOptions.${value}`)}
            </button>
          ))}
        </div>

        <Separator className="my-4" />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button>{t("common.close")}</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export default Content;

import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function DeviceListEmpty() {
  const { t } = useTranslation();

  const usbSteps = t("connectHelp.usb.steps", { returnObjects: true }) as string[];
  const wifiSteps = t("connectHelp.wifi.steps", { returnObjects: true }) as string[];

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <svg
        viewBox="0 0 24 24"
        className="size-20 opacity-50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            d="M3 3L21 21M12 18H12.01M6 6V17.8C6 18.9201 6 19.4802 6.21799 19.908C6.40973 20.2843 6.71569 20.5903 7.09202 20.782C7.51984 21 8.0799 21 9.2 21H15C15.9319 21 16.3978 21 16.7654 20.8478C17.2554 20.6448 17.6448 20.2554 17.8478 19.7654C18 19.3978 18 18.9319 18 18M8.6499 3H14.8C15.9201 3 16.4802 3 16.908 3.21799C17.2843 3.40973 17.5903 3.71569 17.782 4.09202C18 4.51984 18 5.0799 18 6.2V12.3501"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>{" "}
        </g>
      </svg>

      <p className="px-3 text-center text-muted-foreground">
        {t("deviceList.empty")}
      </p>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-3.5 w-3.5" />
            {t("connectHelp.trigger")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("connectHelp.title")}</DialogTitle>
            <DialogDescription>{t("connectHelp.description")}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="usb">
            <TabsList className="w-full">
              <TabsTrigger value="usb" className="flex-1">
                {t("connectDialog.tabUsb")}
              </TabsTrigger>
              <TabsTrigger value="wifi" className="flex-1">
                {t("connectDialog.tabWifi")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="usb">
              <InstructionSteps steps={usbSteps} />
            </TabsContent>

            <TabsContent value="wifi" className="flex flex-col gap-3">
              <InstructionSteps steps={wifiSteps} />
              <Separator />
              <p className="text-xs text-ink-faint">{t("connectHelp.wifi.note")}</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstructionSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-hairline bg-panel-raised font-mono text-[10px] font-medium text-ink-muted">
            {i + 1}
          </span>
          <span className="pt-px">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default DeviceListEmpty;

import React from "react";
import { useTranslation } from "react-i18next";

function NotDeviceSelected() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-4 flex-1 items-center justify-center text-sm text-muted-foreground">
      <svg
        viewBox="0 0 24 24"
        className="size-32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            d="M16 17L16 15C16 12.7909 14.2091 11 12 11L7 11"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>{" "}
          <path
            d="M10 8L7 11L10 14"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>{" "}
        </g>
      </svg>

      <p className="text-lg">{t("workspace.selectDevice")}</p>
    </div>
  );
}

export default NotDeviceSelected;

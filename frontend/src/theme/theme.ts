import { ColorSchemeName } from "react-native";
import { Urgency } from "../types";

export const colors = {
  transparent: "transparent",
  ink: "#111827",
  slate: "#475569",
  mist: "#F8FAFC",
  line: "#E2E8F0",
  white: "#FFFFFF",
  night: "#0B1120",
  panel: "#111827",
  panelLine: "#243044",
  blue: "#2563EB",
  green: "#10B981",
  amber: "#F59E0B",
  orange: "#F97316",
  red: "#EF4444"
};

export function makeTheme(scheme: ColorSchemeName) {
  const dark = scheme === "dark";
  return {
    dark,
    background: dark ? colors.night : colors.mist,
    card: dark ? colors.panel : colors.white,
    text: dark ? "#F8FAFC" : colors.ink,
    muted: dark ? "#CBD5E1" : colors.slate,
    border: dark ? colors.panelLine : colors.line,
    input: dark ? "#172033" : "#FFFFFF",
    primary: colors.blue
  };
}

export function urgencyColor(urgency: Urgency) {
  switch (urgency) {
    case "low":
      return colors.green;
    case "moderate":
      return colors.amber;
    case "high":
      return colors.orange;
    case "critical":
      return colors.red;
  }
}

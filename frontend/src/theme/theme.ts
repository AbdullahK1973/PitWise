import { ColorSchemeName } from "react-native";
import { Urgency } from "../types";

export const colors = {
  transparent: "transparent",
  ink: "#F5FFF8",
  slate: "#9EB2AB",
  mist: "#10161F",
  line: "#35413F",
  white: "#FFFFFF",
  night: "#081018",
  panel: "#142029",
  panelLine: "#30403F",
  blue: "#67E8F9",
  green: "#8AF5BD",
  amber: "#FACC6B",
  orange: "#FF9F4A",
  red: "#FF6B6B",
  accent: "#FFB15C",
  glow: "#8AF5BD",
  code: "#B7F7D1"
};

export function makeTheme(scheme: ColorSchemeName) {
  const dark = true;
  return {
    dark,
    background: colors.night,
    card: "#142029CC",
    text: colors.ink,
    muted: colors.slate,
    border: colors.panelLine,
    input: "#101A22CC",
    primary: colors.green,
    accent: colors.accent,
    code: colors.code,
    danger: colors.red,
    shadow: "#000000",
    fontDisplay: "Space Grotesk, System",
    fontMono: "JetBrains Mono, monospace"
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

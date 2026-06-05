import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { makeTheme } from "../theme/theme";

export function useTheme() {
  const scheme = useColorScheme();
  return useMemo(() => makeTheme(scheme), [scheme]);
}

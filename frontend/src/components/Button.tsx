import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled }: Props) {
  const theme = useTheme();
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : isGhost ? "transparent" : "#182630CC",
          borderColor: isPrimary ? `${theme.primary}99` : isGhost ? `${theme.primary}44` : theme.border,
          opacity: disabled ? 0.55 : pressed ? 0.82 : 1
        }
      ]}
    >
      {isPrimary ? <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.primary }]} /> : null}
      <Text style={[styles.label, { color: isPrimary ? "#071017" : isGhost ? theme.primary : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    overflow: "hidden",
    shadowColor: "#8AF5BD",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  label: {
    fontSize: 15,
    fontWeight: "800"
  },
  glow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -10,
    height: 18,
    opacity: 0.35,
    borderRadius: 999
  }
});

import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : variant === "secondary" ? theme.input : "transparent",
          borderColor: isPrimary ? theme.primary : theme.border,
          opacity: disabled ? 0.55 : pressed ? 0.82 : 1
        }
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? "#FFFFFF" : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  label: {
    fontSize: 16,
    fontWeight: "700"
  }
});

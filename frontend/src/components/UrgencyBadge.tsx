import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { urgencyColor } from "../theme/theme";
import { Urgency } from "../types";

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const color = urgencyColor(urgency);
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}18` }]}>
      <Text style={[styles.text, { color }]}>{urgency.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  }
});

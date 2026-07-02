import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

const codeDrops = ["P0300", "P0171", "P0420", "B1000", "C0035", "U0100", "P0128", "P0455", "P0011", "P0442"];
const gridLines = Array.from({ length: 9 });

export function BackgroundField() {
  const theme = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <View style={styles.grid}>
        {gridLines.map((_, index) => (
          <View key={`v-${index}`} style={[styles.verticalLine, { left: `${index * 12.5}%`, backgroundColor: theme.primary }]} />
        ))}
        {gridLines.map((_, index) => (
          <View key={`h-${index}`} style={[styles.horizontalLine, { top: `${index * 12.5}%`, backgroundColor: theme.primary }]} />
        ))}
      </View>
      <View style={[styles.radialWash, styles.washLeft, { borderColor: `${theme.primary}22` }]} />
      <View style={[styles.radialWash, styles.washRight, { borderColor: `${theme.accent}22` }]} />
      <View style={styles.codeLayer}>
        {codeDrops.map((code, index) => (
          <Text
            key={code}
            style={[
              styles.codeDrop,
              {
                color: theme.primary,
                left: `${5 + ((index * 11) % 88)}%`,
                top: `${8 + ((index * 17) % 82)}%`,
                opacity: 0.1 + (index % 3) * 0.03
              }
            ]}
          >
            {code}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.28
  },
  horizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.28
  },
  radialWash: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 72,
    opacity: 0.75
  },
  washLeft: {
    top: -150,
    left: -150
  },
  washRight: {
    right: -180,
    bottom: 80
  },
  codeLayer: {
    ...StyleSheet.absoluteFillObject
  },
  codeDrop: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2
  }
});

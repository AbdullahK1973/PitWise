import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { AppScreen } from "../types";

type Tab = { screen: AppScreen; label: string };
const tabs: Tab[] = [
  { screen: "home", label: "Home" },
  { screen: "history", label: "History" },
  { screen: "settings", label: "Settings" }
];

export function BottomTabs({ active, onNavigate }: { active: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
    <View style={[styles.bar, { backgroundColor: "#101A22EE", borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const selected = active === tab.screen;
        return (
          <Pressable
            key={tab.screen}
            onPress={() => onNavigate(tab.screen)}
            style={[
              styles.tab,
              {
                backgroundColor: selected ? `${theme.primary}18` : "transparent",
                borderColor: selected ? `${theme.primary}55` : "transparent"
              }
            ]}
          >
            <Text style={[styles.label, { color: selected ? theme.primary : theme.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    alignItems: "center"
  },
  bar: {
    width: "100%",
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: "row",
    padding: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 999
  },
  label: {
    fontWeight: "900",
    fontSize: 13
  }
});

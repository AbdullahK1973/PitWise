import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { AppScreen } from "../types";

type Tab = { screen: AppScreen; label: string };
const tabs: Tab[] = [
  { screen: "home", label: "Home" },
  { screen: "history", label: "History" }
];

export function BottomTabs({ active, onNavigate }: { active: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {tabs.map((tab) => {
        const selected = active === tab.screen;
        return (
          <Pressable key={tab.screen} onPress={() => onNavigate(tab.screen)} style={styles.tab}>
            <Text style={[styles.label, { color: selected ? theme.primary : theme.muted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    flexDirection: "row",
    paddingVertical: 10
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8
  },
  label: {
    fontWeight: "800"
  }
});

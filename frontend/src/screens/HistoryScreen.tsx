import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";
import { UrgencyBadge } from "../components/UrgencyBadge";
import { useTheme } from "../hooks/useTheme";
import { Scan } from "../types";

export function HistoryScreen({ scans, onRefresh, onSelect }: { scans: Scan[]; onRefresh: () => Promise<void>; onSelect: (scan: Scan) => void }) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  return (
    <FlatList
      data={scans}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={<SectionHeader title="Scan History" subtitle="Every manual lookup is saved so you can compare notes before the shop visit." />}
      ListEmptyComponent={<Text style={[styles.empty, { color: theme.muted }]}>No scans yet.</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)}>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.code, { color: theme.text }]}>{item.code}</Text>
                <Text style={[styles.date, { color: theme.muted }]}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              <UrgencyBadge urgency={item.urgency} />
            </View>
            <Text numberOfLines={3} style={[styles.summary, { color: theme.muted }]}>{item.summary}</Text>
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 110
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10
  },
  code: {
    fontSize: 24,
    fontWeight: "900"
  },
  date: {
    marginTop: 3,
    fontSize: 13
  },
  summary: {
    fontSize: 15,
    lineHeight: 22
  },
  empty: {
    fontSize: 15
  }
});

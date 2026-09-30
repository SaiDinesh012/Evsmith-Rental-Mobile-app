import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Text, View, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../api";
import { Button } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [s, setS] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/dashboard");
      setS(r.data.stats || {});
    } catch (e: any) {
      console.log("Error loading dashboard stats:", e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const tiles = [
    ["Total Bikes", s.totalBikes || 0, "#0F172A"],
    ["Available", s.available || 0, "#16A34A"],
    ["Rented", s.rented || 0, "#D97706"],
    ["Maintenance", s.maintenance || 0, "#EF4444"],
    ["Users", s.totalUsers || 0, "#2563EB"],
    ["Rentals", s.totalRentals || 0, "#7C3AED"],
    ["Pending Payments", s.pendingPayments || 0, "#D97706"],
    ["Overdue", s.overdueRentals || 0, "#EF4444"]
  ];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={localStyles.screen}>
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>EVSmith Admin</Text>
        <Text style={localStyles.headerSubtitle}>Fleet & rental operations overview</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          localStyles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        <Button
          title="Manage App Banners (CMS)"
          onPress={() => navigation.navigate("AdminCMS")}
          style={{ marginBottom: 18 }}
        />

        {/* Dashboard Grid */}
        <View style={localStyles.grid}>
          {tiles.map(([label, val, color]) => (
            <View key={String(label)} style={localStyles.tileCard}>
              <Text style={localStyles.tileLabel}>{label}</Text>
              <Text style={[localStyles.tileValue, { color: color as string }]}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Revenue Card */}
        <View style={localStyles.revCard}>
          <Text style={localStyles.revLabel}>Total Revenue</Text>
          <Text style={localStyles.revVal}>₹{(s.totalRevenue || 0).toLocaleString()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.navy },
  headerSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "600" },
  content: { padding: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16
  },
  tileCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  tileLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  tileValue: { fontSize: 26, fontWeight: "900", marginTop: 6 },
  revCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  revLabel: { fontSize: 14, color: "#64748B", fontWeight: "700" },
  revVal: { fontSize: 32, fontWeight: "900", color: COLORS.green, marginTop: 6 }
});

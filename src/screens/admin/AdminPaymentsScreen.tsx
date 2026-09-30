import React, { useEffect, useState } from "react";
import {
  Alert, ScrollView, Text, View, StyleSheet,
  RefreshControl, Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { Button } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/admin/payments");
      setItems(r.data.payments || []);
    } catch (e: any) {
      console.log("Error loading payments:", e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const update = async (id: string, status: string) => {
    try {
      await api.put(`/admin/payments/${id}`, { status });
      load();
      Alert.alert("Success", `Payment marked as ${status}`);
    } catch {
      Alert.alert("Error", "Update failed");
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Payments & Verification</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        <Text style={s.subHeading}>Transaction Logs ({items.length})</Text>

        {items.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="wallet-outline" size={48} color="#94A3B8" />
            <Text style={s.emptyText}>No payments submitted yet.</Text>
          </View>
        ) : (
          items.map((p) => {
            const isApproved = p.status === "APPROVED";
            const isPending = p.status === "PENDING";

            return (
              <View key={p.id} style={s.card}>
                <View style={s.topRow}>
                  <View>
                    <Text style={s.amount}>₹{p.amount}</Text>
                    <Text style={s.rentalId}>Booking: {p.rentalId}</Text>
                  </View>
                  <View style={[
                    s.statusBadge,
                    isApproved ? s.badgeAppr : isPending ? s.badgePend : s.badgeRej
                  ]}>
                    <Text style={[
                      s.statusText,
                      isApproved ? s.textAppr : isPending ? s.textPend : s.textRej
                    ]}>
                      {p.status}
                    </Text>
                  </View>
                </View>

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Rider / Contact:</Text>
                  <Text style={s.infoVal}>{p.user?.name || "Rider"} ({p.user?.mobile || "-"})</Text>
                </View>

                {p.bike && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Scooter:</Text>
                    <Text style={s.infoVal}>{p.bike.model} • {p.bike.registrationNumber}</Text>
                  </View>
                )}

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Payment Method:</Text>
                  <Text style={s.infoVal}>{p.method || "UPI"}</Text>
                </View>

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Transaction ID / UTR:</Text>
                  <Text style={s.infoVal}>{p.transactionId || "-"}</Text>
                </View>

                {(p.screenshotUrl || p.screenshot) && (
                  <View style={s.proofRow}>
                    <Text style={s.infoLabel}>Screenshot Attached:</Text>
                    <Image source={{ uri: p.screenshotUrl || p.screenshot }} style={s.proofImg} resizeMode="contain" />
                  </View>
                )}

                {isPending && (
                  <View style={s.actions}>
                    <View style={{ flex: 1 }}>
                      <Button title="Approve" onPress={() => update(p.id, "APPROVED")} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button title="Reject" outline onPress={() => update(p.id, "REJECTED")} />
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.navy },
  content: { padding: 20 },
  subHeading: { fontSize: 16, fontWeight: "800", color: "#64748B", marginBottom: 14 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10
  },
  amount: { fontSize: 20, fontWeight: "900", color: COLORS.green },
  rentalId: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeAppr: { backgroundColor: "#DCFCE7" },
  textAppr: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  badgePend: { backgroundColor: "#FEF3C7" },
  textPend: { color: "#D97706", fontSize: 11, fontWeight: "800" },
  badgeRej: { backgroundColor: "#FEE2E2" },
  textRej: { color: "#EF4444", fontSize: 11, fontWeight: "800" },
  statusText: { fontSize: 11, fontWeight: "800" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  infoLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  infoVal: { fontSize: 13, color: COLORS.navy, fontWeight: "700" },
  proofRow: { marginTop: 8 },
  proofImg: { width: "100%", height: 140, borderRadius: 10, marginTop: 6, backgroundColor: "#F1F5F9" },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#94A3B8", marginTop: 12, fontSize: 14, fontWeight: "600" }
});

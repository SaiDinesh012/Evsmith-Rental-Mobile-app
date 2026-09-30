import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView, Text, View, StyleSheet, RefreshControl,
  ActivityIndicator, Pressable
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { COLORS } from "../../theme";

export default function PaymentsHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get("/payments");
      setPayments(res.data.payments || []);
    } catch (e: any) {
      console.log("Error loading user payments:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    const unsub = navigation.addListener("focus", fetchPayments);
    return unsub;
  }, [navigation, fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Payment History</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        <Text style={s.subHeading}>Transaction Logs ({payments.length})</Text>

        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={s.mutedText}>Loading your transactions...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="card-outline" size={44} color="#94A3B8" />
            </View>
            <Text style={s.emptyTitle}>No Transactions Yet</Text>
            <Text style={s.emptySubtitle}>All your rental deposits and payments will appear here.</Text>
          </View>
        ) : (
          payments.map((p) => {
            const isApproved = p.status === "APPROVED";
            const isPending = p.status === "PENDING";

            return (
              <View key={p.id} style={s.card}>
                <View style={s.topRow}>
                  <View>
                    <Text style={s.amount}>₹{p.amount?.toLocaleString()}</Text>
                    <Text style={s.bookingId}>Booking: {p.rentalId}</Text>
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

                {p.bike && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Vehicle:</Text>
                    <Text style={s.infoVal}>{p.bike.model} ({p.bike.registrationNumber})</Text>
                  </View>
                )}

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Method:</Text>
                  <Text style={s.infoVal}>{p.method || "UPI / QR"}</Text>
                </View>

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Transaction ID / UTR:</Text>
                  <Text style={s.infoVal}>{p.transactionId || "-"}</Text>
                </View>

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Date & Time:</Text>
                  <Text style={s.infoVal}>{formatDate(p.createdAt)}</Text>
                </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  content: { padding: 20 },
  subHeading: { fontSize: 16, fontWeight: "800", color: "#64748B", marginBottom: 14 },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  mutedText: { marginTop: 12, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "#64748B", textAlign: "center", paddingHorizontal: 30 },
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
  bookingId: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "800" },
  badgeAppr: { backgroundColor: "#DCFCE7" },
  textAppr: { color: "#166534" },
  badgePend: { backgroundColor: "#FEF3C7" },
  textPend: { color: "#B45309" },
  badgeRej: { backgroundColor: "#FEE2E2" },
  textRej: { color: "#991B1B" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  infoLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  infoVal: { fontSize: 13, color: COLORS.navy, fontWeight: "700" }
});

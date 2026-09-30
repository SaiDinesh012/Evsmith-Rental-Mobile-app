import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView, Text, View, Image, Pressable, StyleSheet,
  RefreshControl, Alert, Linking, ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../api";
import { COLORS } from "../../theme";

type TabType = "active" | "history";

export default function ActiveRentalScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("active");

  const fetchRentals = useCallback(async () => {
    try {
      const [rentalsRes, bikesRes] = await Promise.all([
        api.get("/rentals"),
        api.get("/bikes").catch(() => ({ data: { bikes: [] } }))
      ]);
      const bikesList = bikesRes.data?.bikes || [];
      const bikesMap = new Map(bikesList.map((b: any) => [b.id, b]));
      const list = (rentalsRes.data?.rentals || []).map((r: any) => ({
        ...r,
        bike: r.bike && typeof r.bike === "object" ? r.bike : bikesMap.get(r.bikeId)
      }));
      setRentals(list);
    } catch (e: any) {
      console.log("Error fetching rentals:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
    const unsub = navigation.addListener("focus", fetchRentals);
    return unsub;
  }, [navigation, fetchRentals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRentals();
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const calculateTimeLeft = (returnIso: string) => {
    if (!returnIso) return "0 Hours";
    const diff = new Date(returnIso).getTime() - new Date().getTime();
    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const ovHours = Math.floor(overdueMs / (1000 * 60 * 60));
      return `Overdue by ${ovHours > 24 ? `${Math.floor(ovHours / 24)}d ${ovHours % 24}h` : `${ovHours}h`}`;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) {
      return `${days} Day${days > 1 ? "s" : ""} ${hours} Hour${hours > 1 ? "s" : ""}`;
    }
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours} Hour${hours > 1 ? "s" : ""} ${minutes} Min${minutes > 1 ? "s" : ""}`;
  };

  const activeRentals = rentals.filter((r) =>
    ["ACTIVE", "RESERVED", "OVERDUE"].includes(r.status)
  );

  const historyRentals = rentals.filter((r) =>
    ["COMPLETED", "CANCELLED"].includes(r.status)
  );

  const handleSupport = () => {
    Alert.alert(
      "EVSmith Support",
      "Need assistance with your ongoing rental?\n\n• Helpline: +91 95153 62625\n• WhatsApp Support Available",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call Support", onPress: () => Linking.openURL("tel:9515362625") }
      ]
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home")} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>My Rentals</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Segmented Tabs: Active | History */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          <Pressable
            style={[s.tabBtn, activeTab === "active" && s.tabBtnActive]}
            onPress={() => setActiveTab("active")}
          >
            <Text style={[s.tabText, activeTab === "active" && s.tabTextActive]}>
              Active {activeRentals.length > 0 ? `(${activeRentals.length})` : ""}
            </Text>
          </Pressable>

          <Pressable
            style={[s.tabBtn, activeTab === "history" && s.tabBtnActive]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[s.tabText, activeTab === "history" && s.tabTextActive]}>
              History {historyRentals.length > 0 ? `(${historyRentals.length})` : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={s.mutedText}>Loading your rentals...</Text>
          </View>
        ) : activeTab === "active" ? (
          /* ACTIVE TAB CONTENT */
          activeRentals.length > 0 ? (
            activeRentals.map((rental) => {
              const bike = rental.bike;
              const isOverdue = rental.status === "OVERDUE" || new Date(rental.expectedReturnAt).getTime() < Date.now();
              const timeLeft = calculateTimeLeft(rental.expectedReturnAt);
              const statusLabel = rental.status === "ACTIVE" ? "Ongoing" : rental.status === "RESERVED" ? "Reserved" : "Overdue";

              return (
                <View key={rental.id} style={s.rentalCard}>
                  {/* Card Header: Bike Image + Info */}
                  <View style={s.cardTopRow}>
                    <View style={s.imageBox}>
                      <Image
                        source={bike?.image ? { uri: bike.image } : require("../../../assets/ev-smith.jpeg")}
                        style={s.bikeImage}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={s.bikeInfo}>
                      <Text style={s.bikeModel}>{bike?.model || `EV Scooter (${rental.bikeId})`}</Text>
                      <Text style={s.bikeReg}>{bike?.registrationNumber || rental.bikeId}</Text>
                      <View style={[s.badge, isOverdue ? s.badgeOverdue : s.badgeOngoing]}>
                        <Text style={[s.badgeText, isOverdue ? s.badgeTextOverdue : s.badgeTextOngoing]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Dates & Time Left */}
                  <View style={s.detailsBlock}>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Started</Text>
                      <Text style={s.detailValue}>{formatDate(rental.startAt)}</Text>
                    </View>

                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Expected Return</Text>
                      <Text style={s.detailValue}>{formatDate(rental.expectedReturnAt)}</Text>
                    </View>

                    {rental.startKm !== undefined && (
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Start Odometer</Text>
                        <Text style={s.detailValue}>{rental.startKm} km</Text>
                      </View>
                    )}

                    <View style={[s.detailRow, { marginTop: 6 }]}>
                      <Text style={s.detailLabel}>Time Left</Text>
                      <Text style={[s.timeLeftValue, isOverdue && { color: "#EF4444" }]}>
                        {timeLeft}
                      </Text>
                    </View>

                    {isOverdue && rental.extraCharge > 0 && (
                      <View style={[s.detailRow, { marginTop: 4 }]}>
                        <Text style={[s.detailLabel, { color: "#EF4444", fontWeight: "700" }]}>Overdue Penalty</Text>
                        <Text style={[s.detailValue, { color: "#EF4444", fontWeight: "900" }]}>
                          +₹{rental.extraCharge} ({rental.extraHours}h extra)
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={s.buttonGroup}>
                    <Pressable
                      style={s.btnViewDetails}
                      onPress={() => navigation.navigate("RentalDetails", { rentalId: rental.id })}
                    >
                      <Text style={s.btnViewDetailsText}>View Details</Text>
                    </Pressable>

                    <Pressable style={s.btnSupport} onPress={handleSupport}>
                      <Text style={s.btnSupportText}>Contact Support</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="moped-outline" size={44} color="#94A3B8" />
              </View>
              <Text style={s.emptyTitle}>No Active Rental</Text>
              <Text style={s.emptySubtitle}>You don't have any ongoing rentals right now. Book your ride in seconds!</Text>
              <Pressable style={s.browseBtn} onPress={() => navigation.navigate("Bikes")}>
                <Text style={s.browseBtnText}>Browse Available Bikes</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
              </Pressable>
            </View>
          )
        ) : (
          /* HISTORY TAB CONTENT */
          historyRentals.length > 0 ? (
            historyRentals.map((rental) => {
              const bike = rental.bike;
              const total = rental.totalCharges || (rental.rentalAmount + (rental.extraCharge || 0));

              return (
                <View key={rental.id} style={s.rentalCard}>
                  <View style={s.cardTopRow}>
                    <View style={s.imageBox}>
                      <Image
                        source={bike?.image ? { uri: bike.image } : require("../../../assets/ev-smith.jpeg")}
                        style={s.bikeImage}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={s.bikeInfo}>
                      <Text style={s.bikeModel}>{bike?.model || `EV Scooter (${rental.bikeId})`}</Text>
                      <Text style={s.bikeReg}>{bike?.registrationNumber || rental.bikeId}</Text>
                      <View style={[s.badge, { backgroundColor: "#F1F5F9" }]}>
                        <Text style={[s.badgeText, { color: "#475569" }]}>Completed</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.detailsBlock}>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Trip Started</Text>
                      <Text style={s.detailValue}>{formatDate(rental.startAt)}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Text style={s.detailLabel}>Returned On</Text>
                      <Text style={s.detailValue}>{formatDate(rental.actualReturnAt || rental.expectedReturnAt)}</Text>
                    </View>
                    <View style={[s.detailRow, { marginTop: 6 }]}>
                      <Text style={s.detailLabel}>Total Paid</Text>
                      <Text style={[s.detailValue, { fontWeight: "900", color: COLORS.navy }]}>₹{total}</Text>
                    </View>
                  </View>

                  <Pressable
                    style={[s.btnViewDetails, { marginTop: 12 }]}
                    onPress={() => navigation.navigate("RentalDetails", { rentalId: rental.id })}
                  >
                    <Text style={s.btnViewDetailsText}>View Trip Details</Text>
                  </Pressable>
                </View>
              );
            })
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={42} color="#94A3B8" />
              </View>
              <Text style={s.emptyTitle}>No Rental History</Text>
              <Text style={s.emptySubtitle}>Completed and past trips will be shown here.</Text>
            </View>
          )
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
    backgroundColor: COLORS.white
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  tabWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    padding: 4
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20
  },
  tabBtnActive: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  tabText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: COLORS.white, fontWeight: "800" },
  content: { padding: 20 },
  rentalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  cardTopRow: { flexDirection: "row", alignItems: "center" },
  imageBox: {
    width: 86,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  bikeImage: { width: "100%", height: "100%" },
  bikeInfo: { flex: 1, marginLeft: 14 },
  bikeModel: { fontSize: 17, fontWeight: "900", color: COLORS.navy },
  bikeReg: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6
  },
  badgeOngoing: { backgroundColor: "#DCFCE7" },
  badgeTextOngoing: { color: "#16A34A", fontSize: 12, fontWeight: "800" },
  badgeOverdue: { backgroundColor: "#FEE2E2" },
  badgeTextOverdue: { color: "#EF4444", fontSize: 12, fontWeight: "800" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  detailsBlock: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  detailLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "700", color: COLORS.navy },
  timeLeftValue: { fontSize: 15, fontWeight: "900", color: COLORS.green },
  buttonGroup: { marginTop: 14, gap: 10 },
  btnViewDetails: {
    borderWidth: 1.5,
    borderColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: COLORS.white
  },
  btnViewDetailsText: { color: COLORS.green, fontSize: 14, fontWeight: "800" },
  btnSupport: {
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: COLORS.white
  },
  btnSupportText: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  mutedText: { marginTop: 12, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  browseBtn: {
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14
  },
  browseBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" }
});

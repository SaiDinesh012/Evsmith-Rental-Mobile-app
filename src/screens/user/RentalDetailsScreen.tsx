import React, { useEffect, useState } from "react";
import {
  ScrollView, Text, View, Image, Pressable, StyleSheet,
  Alert, ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { COLORS } from "../../theme";

export default function RentalDetailsScreen({ route, navigation }: any) {
  const { rentalId } = route.params;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/rentals/${rentalId}`);
      let bikeObj = res.data.bike;
      if ((!bikeObj || typeof bikeObj !== "object") && res.data.rental?.bikeId) {
        const bRes = await api.get(`/bikes/${res.data.rental.bikeId}`).catch(() => null);
        if (bRes?.data?.bike) bikeObj = bRes.data.bike;
      }
      setData({ ...res.data, bike: bikeObj || res.data.bike });
    } catch (e: any) {
      console.log("Error loading rental details:", e.message);
      Alert.alert("Error", "Could not load rental details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [rentalId]);

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

  const handleEndRental = () => {
    Alert.alert(
      "End Rental & Return Bike",
      "Are you sure you want to end this rental and return the bike? Our hub executive will inspect the vehicle odometer and battery condition.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Return",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await api.post(`/rentals/${rentalId}/return-request`);
              Alert.alert(
                "Return Initiated",
                res.data.message || "Return request submitted! Please visit our hub for handover inspection."
              );
              fetchDetails();
            } catch (err: any) {
              Alert.alert("Return Failed", err?.response?.data?.message || "Please try again or contact support.");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelReservation = () => {
    Alert.alert(
      "Cancel Reservation?",
      "Are you sure you want to cancel this booking? The scooter will be released for other riders.",
      [
        { text: "No, Keep", style: "cancel" },
        {
          text: "Yes, Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await api.post(`/rentals/${rentalId}/cancel`);
              Alert.alert("Booking Cancelled", res.data.message || "Your booking has been cancelled.");
              fetchDetails();
            } catch (err: any) {
              Alert.alert("Cancellation Failed", err?.response?.data?.message || "Could not cancel booking.");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !data) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
          </Pressable>
          <Text style={s.headerTitle}>Rental Details</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={s.mutedText}>Loading rental details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { rental, bike } = data;
  const isOngoing = ["ACTIVE", "RESERVED", "OVERDUE"].includes(rental.status);
  const isOverdue = rental.status === "OVERDUE" || (isOngoing && new Date(rental.expectedReturnAt).getTime() < Date.now());
  const statusLabel = rental.status === "ACTIVE" ? "Ongoing" : rental.status === "RESERVED" ? "Reserved" : rental.status === "COMPLETED" ? "Completed" : "Overdue";
  const totalPaid = rental.rentalAmount + rental.securityDeposit;

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Rental Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}>
        {/* Vehicle Card */}
        <View style={s.vehicleCard}>
          <View style={s.imageBox}>
            <Image
              source={bike?.image ? { uri: bike.image } : require("../../../assets/ev-smith.jpeg")}
              style={s.bikeImage}
              resizeMode="cover"
            />
          </View>
          <View style={s.vehicleInfo}>
            <Text style={s.bikeModel}>{bike?.model || `EV Scooter (${rental.bikeId})`}</Text>
            <Text style={s.bikeReg}>{bike?.registrationNumber || rental.bikeId}</Text>
            <View style={[s.badge, isOverdue ? s.badgeOverdue : isOngoing ? s.badgeOngoing : s.badgeCompleted]}>
              <Text style={[s.badgeText, isOverdue ? s.badgeTextOverdue : isOngoing ? s.badgeTextOngoing : s.badgeTextCompleted]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={s.detailsCard}>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Booking ID</Text>
            <Text style={s.detailValue}>{rental.id}</Text>
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Start Date</Text>
            <Text style={s.detailValue}>{formatDate(rental.startAt)}</Text>
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Expected Return</Text>
            <Text style={s.detailValue}>{formatDate(rental.expectedReturnAt)}</Text>
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Rental Amount</Text>
            <Text style={s.detailValue}>₹{rental.rentalAmount.toLocaleString()}</Text>
          </View>

          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Security Deposit</Text>
            <Text style={s.detailValue}>₹{rental.securityDeposit.toLocaleString()}</Text>
          </View>

          {rental.startKm !== undefined && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Starting Odometer</Text>
              <Text style={s.detailValue}>{rental.startKm} km</Text>
            </View>
          )}

          {rental.endKm !== undefined && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Return Odometer</Text>
              <Text style={s.detailValue}>{rental.endKm} km</Text>
            </View>
          )}

          {rental.distanceKm !== undefined && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Distance Ridden</Text>
              <Text style={[s.detailValue, { color: COLORS.green, fontWeight: "800" }]}>
                {rental.distanceKm} km
              </Text>
            </View>
          )}

          <View style={s.divider} />

          <View style={s.detailRow}>
            <Text style={s.totalLabel}>Total Paid</Text>
            <Text style={s.totalValue}>₹{totalPaid.toLocaleString()}</Text>
          </View>

          {/* If returned: show settlement details */}
          {rental.actualReturnAt && (
            <View style={s.settlementBlock}>
              <View style={s.divider} />
              <Text style={s.settlementTitle}>Return Settlement Details</Text>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Actual Return</Text>
                <Text style={s.detailValue}>{formatDate(rental.actualReturnAt)}</Text>
              </View>
              {rental.extraHours > 0 && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Extra Hours ({rental.extraHours}h)</Text>
                  <Text style={s.detailValue}>₹{rental.extraCharge}</Text>
                </View>
              )}
              {rental.damageCharge > 0 && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Damage / Repair Charge</Text>
                  <Text style={s.detailValue}>₹{rental.damageCharge}</Text>
                </View>
              )}
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Final Charges</Text>
                <Text style={s.detailValue}>₹{rental.totalCharges || rental.rentalAmount}</Text>
              </View>
              {rental.balance !== undefined && (
                <View style={s.detailRow}>
                  <Text style={[s.totalLabel, { color: COLORS.green }]}>
                    {rental.balance <= 0 ? "Deposit Refund" : "Amount Due"}
                  </Text>
                  <Text style={[s.totalValue, { color: rental.balance <= 0 ? COLORS.green : "#EF4444" }]}>
                    ₹{Math.abs(rental.balance).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* View Signed Agreement Button */}
        <Pressable
          style={s.btnAgreement}
          onPress={() => navigation.navigate("ViewAgreement", { rental })}
        >
          <Ionicons name="document-text-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
          <Text style={s.btnAgreementText}>View Signed Agreement</Text>
        </Pressable>

        {/* Cancel Booking for RESERVED */}
        {rental.status === "RESERVED" && (
          <View style={{ marginTop: 16 }}>
            <Pressable
              style={[s.btnCancelBooking, submitting && { opacity: 0.6 }]}
              onPress={handleCancelReservation}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={s.btnCancelBookingText}>Cancel Booking</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* End Rental / Return Action Button for ACTIVE / OVERDUE */}
        {isOngoing && rental.status !== "RESERVED" && (
          <View style={{ marginTop: 16 }}>
            {rental.returnRequested ? (
              <View style={s.returnPendingBanner}>
                <Ionicons name="time" size={20} color="#D97706" />
                <Text style={s.returnPendingText}>Return Request Submitted (Under Hub Inspection)</Text>
              </View>
            ) : (
              <Pressable
                style={[s.btnEndRental, submitting && { opacity: 0.6 }]}
                onPress={handleEndRental}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={s.btnEndRentalText}>End Rental (Return Bike)</Text>
                )}
              </Pressable>
            )}
          </View>
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
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
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
  imageBox: {
    width: 90,
    height: 76,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  bikeImage: { width: "100%", height: "100%" },
  vehicleInfo: { flex: 1, marginLeft: 16 },
  bikeModel: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  bikeReg: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8
  },
  badgeOngoing: { backgroundColor: "#DCFCE7" },
  badgeTextOngoing: { color: "#16A34A", fontSize: 12, fontWeight: "800" },
  badgeOverdue: { backgroundColor: "#FEE2E2" },
  badgeTextOverdue: { color: "#EF4444", fontSize: 12, fontWeight: "800" },
  badgeCompleted: { backgroundColor: "#F1F5F9" },
  badgeTextCompleted: { color: "#475569", fontSize: 12, fontWeight: "800" },
  badgeText: { fontSize: 12, fontWeight: "800" },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  detailLabel: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  detailValue: { fontSize: 14, fontWeight: "800", color: COLORS.navy },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: "900", color: COLORS.navy },
  totalValue: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  settlementBlock: { marginTop: 6 },
  settlementTitle: { fontSize: 14, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  btnAgreement: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    paddingVertical: 14
  },
  btnAgreementText: { fontSize: 14, fontWeight: "800", color: COLORS.navy },
  btnEndRental: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  btnEndRentalText: { color: "#EF4444", fontSize: 15, fontWeight: "800" },
  returnPendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 14,
    borderRadius: 14,
    gap: 10
  },
  returnPendingText: { color: "#B45309", fontSize: 13, fontWeight: "700", flex: 1 },
  btnCancelBooking: {
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center"
  },
  btnCancelBookingText: { color: "#64748B", fontSize: 15, fontWeight: "800" },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  mutedText: { marginTop: 12, color: "#94A3B8", fontSize: 14, fontWeight: "600" }
});

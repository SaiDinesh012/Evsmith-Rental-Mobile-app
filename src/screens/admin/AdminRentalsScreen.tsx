import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  Switch
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { Button, Input } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminRentalsScreen() {
  const insets = useSafeAreaInsets();
  const [rentals, setRentals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Handover Modal State
  const [handoverTarget, setHandoverTarget] = useState<any>(null);
  const [startOdo, setStartOdo] = useState("0");
  const [startBat, setStartBat] = useState("100");
  const [helmetChecked, setHelmetChecked] = useState(true);
  const [chargerChecked, setChargerChecked] = useState(true);

  // Return Settlement Modal State
  const [returnTarget, setReturnTarget] = useState<any>(null);
  const [endOdo, setEndOdo] = useState("0");
  const [returnBat, setReturnBat] = useState("50");
  const [returnHelmetChecked, setReturnHelmetChecked] = useState(true);
  const [returnChargerChecked, setReturnChargerChecked] = useState(true);
  const [equipmentCharge, setEquipmentCharge] = useState("0");
  const [damageCharge, setDamageCharge] = useState("0");
  const [trafficFine, setTrafficFine] = useState("0");
  const [markMaintenance, setMarkMaintenance] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/rentals");
      setRentals(r.data.rentals || []);
    } catch (e: any) {
      console.log("Error loading rentals:", e.message);
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

  // Open Handover Modal
  const openHandover = (r: any) => {
    setHandoverTarget(r);
    // Pre-fill with the bike's last recorded/return odometer reading
    const bikeLastKm = String(r.bike?.odometer ?? 0);
    setStartOdo(bikeLastKm);
    setStartBat(String(r.bike?.battery ?? 100));
    setHelmetChecked(true);
    setChargerChecked(true);
  };

  // Submit Handover
  const handleConfirmHandover = async () => {
    if (!startOdo || isNaN(Number(startOdo))) {
      Alert.alert("Invalid Input", "Please enter a valid Starting Odometer reading.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/rentals/${handoverTarget.id}/handover`, {
        odometer: Number(startOdo),
        battery: Number(startBat),
        helmet: helmetChecked,
        charger: chargerChecked,
        tyres: "GOOD",
        brakes: "GOOD",
        electricals: "WORKING"
      });

      Alert.alert(
        "Handover Completed",
        `Bike handed over to ${handoverTarget.user?.name || "rider"}!\nStarting Odometer: ${startOdo} km.\nRental is now ACTIVE.`
      );
      setHandoverTarget(null);
      load();
    } catch (e: any) {
      Alert.alert("Handover Error", e?.response?.data?.message || "Handover failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Return Settlement Modal
  const openReturn = (r: any) => {
    setReturnTarget(r);
    setEndOdo(""); // Blank for admin to enter actual vehicle reading
    setReturnBat(String(r.bike?.battery || ""));
    setReturnHelmetChecked(true);
    setReturnChargerChecked(true);
    setEquipmentCharge("0");
    setDamageCharge("0");
    setTrafficFine("0");
    setMarkMaintenance(false);
  };

  const toggleReturnHelmet = (val: boolean) => {
    setReturnHelmetChecked(val);
    const helmetFee = val ? 0 : 800;
    const chargerFee = returnChargerChecked ? 0 : 2500;
    setEquipmentCharge(String(helmetFee + chargerFee));
  };

  const toggleReturnCharger = (val: boolean) => {
    setReturnChargerChecked(val);
    const helmetFee = returnHelmetChecked ? 0 : 800;
    const chargerFee = val ? 0 : 2500;
    setEquipmentCharge(String(helmetFee + chargerFee));
  };

  // Submit Return Settlement
  const handleConfirmReturn = async () => {
    const startKm = Number(returnTarget.startKm ?? returnTarget.handover?.odometer ?? returnTarget.bike?.odometer ?? 0);
    const endKm = Number(endOdo);

    if (!endOdo.trim() || isNaN(endKm) || endKm < startKm) {
      Alert.alert(
        "Invalid Odometer",
        `Please enter the ending odometer reading. It cannot be less than starting odometer (${startKm} km).`
      );
      return;
    }

    const distance = endKm - startKm;

    setSubmitting(true);
    try {
      const res = await api.post(`/admin/rentals/${returnTarget.id}/return`, {
        odometer: endKm,
        battery: Number(returnBat),
        helmetReturned: returnHelmetChecked,
        chargerReturned: returnChargerChecked,
        equipmentCharge: Number(equipmentCharge),
        damageCharge: Number(damageCharge),
        trafficFine: Number(trafficFine),
        markMaintenance,
        tyres: "GOOD",
        brakes: "GOOD",
        electricals: "WORKING"
      });

      const rent = res.data.rental;
      Alert.alert(
        "Return Settled & Fleet Updated",
        `Rental ${rent.id} completed!\n• Distance Ridden: ${distance} km\n• Final Fleet Odometer: ${endKm} km (matched for next user)\n• Total Charges: ₹${rent.totalCharges}\n• Balance Settlement: ₹${rent.balance}`
      );
      setReturnTarget(null);
      load();
    } catch (e: any) {
      Alert.alert("Settlement Error", e?.response?.data?.message || "Return settlement failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Reservation
  const handleCancelReservation = (r: any) => {
    Alert.alert(
      "Cancel Reservation?",
      `Are you sure you want to cancel booking ${r.id}? The vehicle (${r.bike?.model || r.bikeId}) will be immediately returned to the AVAILABLE fleet.`,
      [
        { text: "No, Keep", style: "cancel" },
        {
          text: "Yes, Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`/rentals/${r.id}/cancel`);
              Alert.alert("Reservation Cancelled", "Booking cancelled. Vehicle is now available for other riders.");
              load();
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

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Rentals & Handover Hub</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        <Text style={s.pageHeading}>All Rentals ({rentals.length})</Text>

        {rentals.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
            <Text style={s.emptyText}>No rentals found.</Text>
          </View>
        ) : (
          rentals.map((r) => {
            const isOngoing = ["ACTIVE", "OVERDUE"].includes(r.status);
            const isOverdue = r.status === "OVERDUE";
            const isReserved = r.status === "RESERVED";
            const isCompleted = r.status === "COMPLETED";
            const isCancelled = r.status === "CANCELLED";

            const sKm = r.startKm ?? r.handover?.odometer ?? r.bike?.odometer ?? 0;
            const eKm = r.endKm ?? r.returnInspection?.odometer;
            const dist = r.distanceKm ?? (eKm ? eKm - sKm : null);

            return (
              <View key={r.id} style={[s.card, isOverdue && { borderColor: "#FCA5A5", borderWidth: 1.5 }]}>
                {/* Top Row with ID & Status */}
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.bookingId}>{r.id}</Text>
                    <Text style={s.bikeId}>Vehicle: {r.bike?.model || r.bikeId} ({r.bike?.registrationNumber || "Reg No."})</Text>
                  </View>
                  <View style={[
                    s.statusBadge,
                    isOverdue ? { backgroundColor: "#FEE2E2" } : isOngoing ? s.badgeOngoing : isReserved ? s.badgeReserved : isCancelled ? { backgroundColor: "#F1F5F9" } : s.badgeCompleted
                  ]}>
                    <Text style={[
                      s.statusText,
                      isOverdue ? { color: "#DC2626" } : isOngoing ? s.textOngoing : isReserved ? s.textReserved : isCancelled ? { color: "#64748B" } : s.textCompleted
                    ]}>
                      {r.status}
                    </Text>
                  </View>
                </View>

                {/* Overdue Warning Pill */}
                {isOverdue && (
                  <View style={{ backgroundColor: "#FEF2F2", padding: 10, borderRadius: 10, marginBottom: 12, flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "700", flex: 1 }}>
                      Trip Overdue! {r.extraHours ? `+${r.extraHours} extra hrs (penalty: ₹${r.extraCharge})` : "Past expected return time"}
                    </Text>
                  </View>
                )}

                {/* Rider Info Row */}
                <View style={s.riderRow}>
                  <Ionicons name="person-circle" size={18} color="#0284C7" />
                  <Text style={s.riderNameText}>
                    {r.user?.name || "EV Rider"} • 📞 {r.user?.mobile || "9515362625"}
                  </Text>
                </View>

                {/* Odometer Tracking Box */}
                <View style={s.odoChainBox}>
                  <View style={s.odoCol}>
                    <Text style={s.odoLabel}>Start Km</Text>
                    <Text style={s.odoVal}>
                      {isReserved ? `${sKm} km (baseline)` : `${sKm} km`}
                    </Text>
                  </View>

                  <Ionicons name="arrow-forward" size={16} color="#94A3B8" />

                  <View style={s.odoCol}>
                    <Text style={s.odoLabel}>Return Km</Text>
                    <Text style={s.odoVal}>
                      {eKm !== undefined ? `${eKm} km` : isOngoing ? "In Trip" : "-"}
                    </Text>
                  </View>

                  {dist !== null && (
                    <View style={s.distPill}>
                      <Text style={s.distPillText}>+{dist} km</Text>
                    </View>
                  )}
                </View>

                {/* Dates & Amounts */}
                <View style={s.row}>
                  <Text style={s.label}>Start Time:</Text>
                  <Text style={s.val}>{formatDate(r.startAt)}</Text>
                </View>

                <View style={s.row}>
                  <Text style={s.label}>Expected Return:</Text>
                  <Text style={s.val}>{formatDate(r.expectedReturnAt)}</Text>
                </View>

                <View style={s.row}>
                  <Text style={s.label}>Rental Amount:</Text>
                  <Text style={s.val}>₹{r.rentalAmount}</Text>
                </View>

                <View style={s.row}>
                  <Text style={s.label}>Security Deposit:</Text>
                  <Text style={s.val}>₹{r.securityDeposit}</Text>
                </View>

                {isCompleted && (
                  <View style={s.completedInfo}>
                    <Text style={s.completedText}>
                      Settled Total: ₹{r.totalCharges || r.rentalAmount} • Net Balance: ₹{Math.abs(r.balance ?? 0)} {r.balance <= 0 ? "(Deposit Refund Due)" : "(Amount Due)"}
                    </Text>
                    {r.settlementStatus === "SETTLED" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#16A34A" }}>
                          Settled: {r.settlementDetails?.type === "REFUND_DISBURSED" ? "Refund Disbursed" : "Balance Received"} via {r.settlementDetails?.method || "UPI"} ({r.settlementDetails?.transactionRef || "Hub"})
                        </Text>
                      </View>
                    ) : (
                      <View style={{ marginTop: 8 }}>
                        <Button
                          title={r.balance <= 0 ? `Record Refund Disbursed (₹${Math.abs(r.balance || 0)})` : `Record Balance Collected (₹${r.balance})`}
                          outline
                          onPress={() => {
                            Alert.alert(
                              r.balance <= 0 ? "Disburse Deposit Refund" : "Collect Outstanding Balance",
                              `Confirm recording ${(r.balance <= 0 ? "deposit refund of ₹" + Math.abs(r.balance || 0) : "balance collection of ₹" + r.balance)} to ${r.user?.name || "rider"}?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Confirm via UPI",
                                  onPress: async () => {
                                    try {
                                      await api.post(`/admin/rentals/${r.id}/settle-balance`, {
                                        method: "UPI",
                                        transactionRef: `UPI-${Date.now().toString().slice(-6)}`
                                      });
                                      Alert.alert("Settlement Recorded", "Deposit settlement updated and customer notified.");
                                      load();
                                    } catch (err: any) {
                                      Alert.alert("Error", err?.response?.data?.message || "Settlement failed");
                                    }
                                  }
                                },
                                {
                                  text: "Confirm via Cash",
                                  onPress: async () => {
                                    try {
                                      await api.post(`/admin/rentals/${r.id}/settle-balance`, {
                                        method: "CASH",
                                        transactionRef: "Hub Cash Counter"
                                      });
                                      Alert.alert("Settlement Recorded", "Deposit settlement updated.");
                                      load();
                                    } catch (err: any) {
                                      Alert.alert("Error", err?.response?.data?.message || "Settlement failed");
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Handover Action for RESERVED */}
                {isReserved && (
                  <View style={[s.actionRow, { gap: 8 }]}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Inspect & Handover"
                        onPress={() => openHandover(r)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Cancel Booking"
                        outline
                        onPress={() => handleCancelReservation(r)}
                      />
                    </View>
                  </View>
                )}

                {/* Return Action for ACTIVE or OVERDUE */}
                {isOngoing && (
                  <View style={s.actionRow}>
                    <Button
                      title={isOverdue ? "Settle Overdue Return" : "Complete Return & Settle"}
                      outline
                      onPress={() => openReturn(r)}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 1. Handover Modal */}
      {handoverTarget && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setHandoverTarget(null)}>
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Vehicle Handover Inspection</Text>
                  <Text style={s.modalSubtitle}>{handoverTarget.id} • {handoverTarget.bike?.model}</Text>
                </View>
                <Pressable onPress={() => setHandoverTarget(null)}>
                  <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Rider Info Card */}
                <View style={s.modalRiderBox}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.navy }}>
                      Rider: {handoverTarget.user?.name || "EV Rider"}
                    </Text>
                    <View style={{
                      backgroundColor: handoverTarget.user?.kycStatus === "VERIFIED" ? "#DCFCE7" : "#FEF3C7",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: handoverTarget.user?.kycStatus === "VERIFIED" ? "#16A34A" : "#D97706"
                      }}>
                        KYC: {handoverTarget.user?.kycStatus || "PENDING"}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    Contact: {handoverTarget.user?.mobile || "9515362625"}
                  </Text>
                </View>

                {/* Starting Odometer Input with Sync Notice */}
                <View style={s.odoNoticeBox}>
                  <Ionicons name="information-circle" size={16} color="#0284C7" />
                  <Text style={s.odoNoticeText}>
                    Starting odometer pre-filled from scooter's last return reading ({startOdo} km).
                  </Text>
                </View>

                <Input
                  label="Starting Odometer (Km) *"
                  value={startOdo}
                  onChangeText={setStartOdo}
                  keyboardType="number-pad"
                  placeholder="e.g. 9328"
                />

                <Input
                  label="Handover Battery Level (%) *"
                  value={startBat}
                  onChangeText={setStartBat}
                  keyboardType="number-pad"
                  placeholder="e.g. 95"
                />

                {/* Handover Checklist */}
                <Text style={s.checklistTitle}>Handover Equipment Checklist</Text>

                <View style={s.checkRow}>
                  <Text style={s.checkLabel}>Clean Helmet Handed Over</Text>
                  <Switch
                    value={helmetChecked}
                    onValueChange={setHelmetChecked}
                    trackColor={{ false: "#CBD5E1", true: COLORS.green }}
                  />
                </View>

                <View style={s.checkRow}>
                  <Text style={s.checkLabel}>Fast Charger & Cable Provided</Text>
                  <Switch
                    value={chargerChecked}
                    onValueChange={setChargerChecked}
                    trackColor={{ false: "#CBD5E1", true: COLORS.green }}
                  />
                </View>

                <View style={{ marginTop: 16 }}>
                  <Button
                    title={submitting ? "Handing Over..." : "Confirm Handover & Activate"}
                    onPress={handleConfirmHandover}
                    disabled={submitting}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. Return Settlement Modal */}
      {returnTarget && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setReturnTarget(null)}>
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Return Inspection & Settlement</Text>
                  <Text style={s.modalSubtitle}>{returnTarget.id} • {returnTarget.bike?.model}</Text>
                </View>
                <Pressable onPress={() => setReturnTarget(null)}>
                  <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Starting Odometer Reference */}
                <View style={s.odoNoticeBox}>
                  <Ionicons name="speedometer-outline" size={16} color="#0284C7" />
                  <Text style={s.odoNoticeText}>
                    Handover Starting Odometer: <Text style={{ fontWeight: "900" }}>{returnTarget.startKm ?? returnTarget.handover?.odometer ?? 0} km</Text>
                  </Text>
                </View>

                <Input
                  label="Ending Odometer Reading (Km) *"
                  value={endOdo}
                  onChangeText={setEndOdo}
                  keyboardType="number-pad"
                  placeholder="e.g. 9450"
                />

                {/* Real-time distance preview */}
                {Number(endOdo) >= Number(returnTarget.startKm ?? returnTarget.handover?.odometer ?? 0) && (
                  <View style={s.distCalcBox}>
                    <Text style={s.distCalcText}>
                      Trip Distance: <Text style={{ fontWeight: "900", color: "#16A34A" }}>
                        {Number(endOdo) - Number(returnTarget.startKm ?? returnTarget.handover?.odometer ?? 0)} km
                      </Text> driven by rider.
                    </Text>
                  </View>
                )}

                <Input
                  label="Return Battery Level (%) *"
                  value={returnBat}
                  onChangeText={setReturnBat}
                  keyboardType="number-pad"
                  placeholder="e.g. 40"
                />

                {/* Equipment Return Checklist */}
                <Text style={s.checklistTitle}>Equipment Return Checklist</Text>

                <View style={s.checkRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={s.checkLabel}>Helmet Returned & Inspected</Text>
                    {!returnHelmetChecked && (
                      <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700" }}>Missing helmet replacement (₹800) applied</Text>
                    )}
                  </View>
                  <Switch
                    value={returnHelmetChecked}
                    onValueChange={toggleReturnHelmet}
                    trackColor={{ false: "#CBD5E1", true: COLORS.green }}
                  />
                </View>

                <View style={s.checkRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={s.checkLabel}>Fast Charger & Cable Returned</Text>
                    {!returnChargerChecked && (
                      <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700" }}>Missing charger replacement (₹2,500) applied</Text>
                    )}
                  </View>
                  <Switch
                    value={returnChargerChecked}
                    onValueChange={toggleReturnCharger}
                    trackColor={{ false: "#CBD5E1", true: COLORS.green }}
                  />
                </View>

                <Input
                  label="Missing / Damaged Equipment Charge (₹)"
                  value={equipmentCharge}
                  onChangeText={setEquipmentCharge}
                  keyboardType="number-pad"
                  placeholder="0"
                />

                <Input
                  label="Vehicle Damage / Repair Charge (₹)"
                  value={damageCharge}
                  onChangeText={setDamageCharge}
                  keyboardType="number-pad"
                  placeholder="0"
                />

                <Input
                  label="Traffic Fines / Challan (₹)"
                  value={trafficFine}
                  onChangeText={setTrafficFine}
                  keyboardType="number-pad"
                  placeholder="0"
                />

                <View style={s.checkRow}>
                  <Text style={s.checkLabel}>Mark Scooter for Maintenance</Text>
                  <Switch
                    value={markMaintenance}
                    onValueChange={setMarkMaintenance}
                    trackColor={{ false: "#CBD5E1", true: "#EF4444" }}
                  />
                </View>

                <View style={{ marginTop: 16 }}>
                  <Button
                    title={submitting ? "Settling..." : "Confirm Return & Update Fleet KM"}
                    onPress={handleConfirmReturn}
                    disabled={submitting}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  content: { padding: 16 },
  pageHeading: { fontSize: 16, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10
  },
  bookingId: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  bikeId: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeOngoing: { backgroundColor: "#DCFCE7" },
  badgeReserved: { backgroundColor: "#FEF3C7" },
  badgeCompleted: { backgroundColor: "#F1F5F9" },
  statusText: { fontSize: 11, fontWeight: "800" },
  textOngoing: { color: "#16A34A" },
  textReserved: { color: "#D97706" },
  textCompleted: { color: "#64748B" },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10
  },
  riderNameText: { fontSize: 12, fontWeight: "700", color: "#0369A1" },
  odoChainBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  odoCol: { flex: 1 },
  odoLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  odoVal: { fontSize: 12, fontWeight: "800", color: COLORS.navy, marginTop: 1 },
  distPill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  distPillText: { fontSize: 11, fontWeight: "800", color: "#16A34A" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  label: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  val: { fontSize: 12, fontWeight: "700", color: COLORS.navy },
  completedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  completedText: { fontSize: 12, color: COLORS.green, fontWeight: "800" },
  actionRow: { marginTop: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { marginTop: 10, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  modalTitle: { fontSize: 17, fontWeight: "900", color: COLORS.navy },
  modalSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: "600" },
  modalRiderBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  odoNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD"
  },
  odoNoticeText: { fontSize: 12, color: "#0369A1", flex: 1, lineHeight: 16 },
  checklistTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navy,
    marginTop: 6,
    marginBottom: 8
  },
  checkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  checkLabel: { fontSize: 13, color: COLORS.navy, fontWeight: "600" },
  distCalcBox: {
    backgroundColor: "#DCFCE7",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  distCalcText: { fontSize: 12, color: "#166534", fontWeight: "700" }
});

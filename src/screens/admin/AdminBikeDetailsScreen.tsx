import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  View,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../api";
import { Bike } from "../../types";
import { Button, Input } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminBikeDetailsScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { bikeId } = route.params;

  const [b, setB] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Active Renter & History
  const [activeRental, setActiveRental] = useState<any>(null);
  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [totalDistanceDriven, setTotalDistanceDriven] = useState(0);

  // Editable Form Fields
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [rentalPerDay, setRentalPerDay] = useState("300");
  const [extraHourRate, setExtraHourRate] = useState("40");
  const [battery, setBattery] = useState("100");
  const [odometer, setOdometer] = useState("0");
  const [rangeKm, setRangeKm] = useState("100");
  const [topSpeed, setTopSpeed] = useState("115");
  const [totalRentals, setTotalRentals] = useState("0");
  const [totalRevenue, setTotalRevenue] = useState("0");
  const [extraHourRevenue, setExtraHourRevenue] = useState("0");

  // Local image selected for upload
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const fetchBike = async () => {
    try {
      const res = await api.get(`/bikes/${bikeId}`);
      const bike: Bike = res.data.bike;
      if (bike) {
        setB(bike);
        setModel(bike.model || "");
        setRegistrationNumber(bike.registrationNumber || "");
        setChassisNumber(bike.chassisNumber || "");
        setStatus(bike.status || "AVAILABLE");
        setRentalPerDay(String(bike.rentalPerDay ?? 300));
        setExtraHourRate(String(bike.extraHourRate ?? 40));
        setBattery(String(bike.battery ?? 100));
        setOdometer(String(bike.odometer ?? 0));
        setRangeKm(String(bike.rangeKm ?? 100));
        setTopSpeed(String(bike.topSpeed ?? 115));
        setTotalRentals(String(bike.totalRentals ?? 0));
        setTotalRevenue(String(bike.totalRevenue ?? 0));
        setExtraHourRevenue(String(bike.extraHourRevenue ?? 0));

        // Income & Rental Data
        setActiveRental(res.data.activeRental || null);
        setRentalHistory(res.data.rentalHistory || []);
        setWeeklyRevenue(res.data.weeklyRevenue || 0);
        setMonthlyRevenue(res.data.monthlyRevenue || 0);
        setTotalDistanceDriven(res.data.totalDistanceDriven || 0);
      }
    } catch (e: any) {
      Alert.alert("Error", "Could not load bike details: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBike();
  }, [bikeId]);

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Photo library access is needed to select a scooter photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setLocalImageUri(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err.message);
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed to capture a photo of the scooter.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setLocalImageUri(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err.message);
    }
  };

  const handleSaveAll = async () => {
    if (!model.trim() || !registrationNumber.trim()) {
      Alert.alert("Required Fields", "Model name and Registration number are required.");
      return;
    }

    setSaving(true);
    try {
      if (localImageUri) {
        // Send multipart form-data to upload photo to Cloudinary
        const fd = new FormData();
        fd.append("model", model.trim());
        fd.append("registrationNumber", registrationNumber.trim());
        fd.append("chassisNumber", chassisNumber.trim());
        fd.append("status", status);
        fd.append("rentalPerDay", rentalPerDay);
        fd.append("extraHourRate", extraHourRate);
        fd.append("battery", battery);
        fd.append("odometer", odometer);
        fd.append("rangeKm", rangeKm);
        fd.append("topSpeed", topSpeed);
        fd.append("totalRentals", totalRentals);
        fd.append("totalRevenue", totalRevenue);
        fd.append("extraHourRevenue", extraHourRevenue);

        const filename = localImageUri.split("/").pop() || "bike.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        fd.append("image", { uri: localImageUri, name: filename, type } as any);

        const r = await api.put(`/admin/bikes/${bikeId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setB(r.data.bike);
        setLocalImageUri(null);
      } else {
        // Direct JSON update
        const r = await api.put(`/admin/bikes/${bikeId}`, {
          model: model.trim(),
          registrationNumber: registrationNumber.trim(),
          chassisNumber: chassisNumber.trim(),
          status,
          rentalPerDay: Number(rentalPerDay),
          extraHourRate: Number(extraHourRate),
          battery: Number(battery),
          odometer: Number(odometer),
          rangeKm: Number(rangeKm),
          topSpeed: Number(topSpeed),
          totalRentals: Number(totalRentals),
          totalRevenue: Number(totalRevenue),
          extraHourRevenue: Number(extraHourRevenue)
        });
        setB(r.data.bike);
      }

      Alert.alert("Success", "Bike details updated successfully!");
    } catch (err: any) {
      console.error("Save error:", err.message);
      Alert.alert("Update Failed", err?.response?.data?.message || "Could not save bike changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Bike",
      `Are you sure you want to permanently remove ${model} (${registrationNumber}) from your fleet?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Vehicle",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/admin/bikes/${bikeId}`);
              Alert.alert("Deleted", "Bike successfully removed from fleet.");
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message || "Could not delete bike.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading || !b) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
          </Pressable>
          <Text style={s.headerTitle}>Bike Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={s.mutedText}>Loading vehicle details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDisplayImage = localImageUri || b.image;
  const STATUSES = [
    { key: "AVAILABLE", label: "AVAILABLE", color: "#16A34A", bg: "#DCFCE7", icon: "checkmark-circle" },
    { key: "RENTED", label: "RENTED", color: "#D97706", bg: "#FEF3C7", icon: "key" },
    { key: "MAINTENANCE", label: "MAINTENANCE", color: "#EF4444", bg: "#FEE2E2", icon: "construct" }
  ];

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.headerTitle}>Bike Details & Fleet Log</Text>
          <Text style={s.headerSubtitle}>{b.model} • {b.registrationNumber}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 50 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Section */}
          <View style={s.photoSection}>
            <View style={s.photoFrame}>
              <Image
                source={currentDisplayImage ? { uri: currentDisplayImage } : require("../../../assets/ev-smith.jpeg")}
                style={s.photo}
                resizeMode="cover"
              />

              {localImageUri && (
                <View style={s.newPhotoBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                  <Text style={s.newPhotoBadgeText}>New photo ready to save</Text>
                </View>
              )}
            </View>

            {/* Direct Gallery & Camera Action Buttons */}
            <View style={s.uploadBtnRow}>
              <Pressable style={s.uploadBtn} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={18} color={COLORS.navy} />
                <Text style={s.uploadBtnText}>Upload from Gallery</Text>
              </Pressable>

              <Pressable style={s.uploadBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={18} color={COLORS.navy} />
                <Text style={s.uploadBtnText}>Take Photo</Text>
              </Pressable>
            </View>

            {localImageUri && (
              <Pressable style={s.revertBtn} onPress={() => setLocalImageUri(null)}>
                <Text style={s.revertBtnText}>Reset to Original Photo</Text>
              </Pressable>
            )}
          </View>

          {/* 1. Weekly, Monthly & Lifetime Revenue Summary Card */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="trending-up" size={20} color={COLORS.green} />
              <Text style={s.cardTitle}>Income & Revenue Breakdown</Text>
            </View>

            <View style={s.revenueGrid}>
              <View style={s.revenueCol}>
                <Text style={s.revenueLabel}>This Week (7 Days)</Text>
                <Text style={[s.revenueValue, { color: COLORS.green }]}>
                  ₹{Number(weeklyRevenue || 0).toLocaleString()}
                </Text>
              </View>

              <View style={s.revenueCol}>
                <Text style={s.revenueLabel}>This Month (30 Days)</Text>
                <Text style={[s.revenueValue, { color: "#2563EB" }]}>
                  ₹{Number(monthlyRevenue || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={[s.revenueGrid, { marginTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 }]}>
              <View style={s.revenueCol}>
                <Text style={s.revenueLabel}>Lifetime Revenue</Text>
                <Text style={s.revenueValue}>₹{Number(totalRevenue || 0).toLocaleString()}</Text>
              </View>

              <View style={s.revenueCol}>
                <Text style={s.revenueLabel}>Distance Driven by Users</Text>
                <Text style={s.revenueValue}>
                  {Number(totalDistanceDriven || 0).toLocaleString()} km
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Current Active Renter Card (Who has taken the bike) */}
          {activeRental && (
            <View style={[s.card, { borderColor: "#FCD34D", backgroundColor: "#FFFBEB" }]}>
              <View style={s.cardHeaderRow}>
                <Ionicons name="person" size={18} color="#D97706" />
                <Text style={[s.cardTitle, { color: "#92400E" }]}>Currently Taken By</Text>
                <View style={[s.statusBadgeSmall, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#D97706" }}>ACTIVE RIDER</Text>
                </View>
              </View>

              <View style={s.activeRiderBox}>
                <View style={s.riderAvatar}>
                  <Text style={s.riderAvatarText}>
                    {activeRental.user?.name ? activeRental.user.name.charAt(0).toUpperCase() : "R"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.riderName}>{activeRental.user?.name || "Rider"}</Text>
                  {activeRental.user?.mobile && (
                    <Text style={s.riderPhone}>📞 {activeRental.user.mobile}</Text>
                  )}
                  {activeRental.user?.email && (
                    <Text style={s.riderEmail}>✉️ {activeRental.user.email}</Text>
                  )}
                </View>
              </View>

              <View style={s.riderTripDetails}>
                <View style={s.tripRow}>
                  <Text style={s.tripLabel}>Rental Period:</Text>
                  <Text style={s.tripVal}>{formatDate(activeRental.startAt)} → {formatDate(activeRental.expectedReturnAt)}</Text>
                </View>
                <View style={s.tripRow}>
                  <Text style={s.tripLabel}>Starting Odometer:</Text>
                  <Text style={[s.tripVal, { fontWeight: "900", color: COLORS.navy }]}>
                    {activeRental.startKm !== undefined ? `${activeRental.startKm} km` : "Pending Handover"}
                  </Text>
                </View>
                <View style={s.tripRow}>
                  <Text style={s.tripLabel}>Starting Battery:</Text>
                  <Text style={s.tripVal}>
                    {activeRental.startBattery !== undefined ? `${activeRental.startBattery}%` : "-"}
                  </Text>
                </View>
                <View style={s.tripRow}>
                  <Text style={s.tripLabel}>Rental Amount:</Text>
                  <Text style={s.tripVal}>₹{activeRental.rentalAmount} + Deposit: ₹{activeRental.securityDeposit}</Text>
                </View>
              </View>

              {activeRental.user?.mobile && (
                <Pressable
                  style={s.callBtn}
                  onPress={() => Linking.openURL(`tel:${activeRental.user.mobile}`)}
                >
                  <Ionicons name="call" size={16} color={COLORS.white} />
                  <Text style={s.callBtnText}>Call Rider ({activeRental.user.mobile})</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* 3. Rider & Rental History Log (Each bike who has taken & kms) */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="receipt" size={18} color={COLORS.navy} />
              <Text style={s.cardTitle}>
                Rider History ({rentalHistory.length} Past Rentals)
              </Text>
            </View>

            {rentalHistory.length === 0 ? (
              <View style={{ paddingVertical: 12, alignItems: "center" }}>
                <Ionicons name="time-outline" size={32} color="#CBD5E1" />
                <Text style={s.mutedHistoryText}>
                  No completed rentals recorded yet for this bike.
                </Text>
                <Text style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 }}>
                  When riders return this scooter, their starting km, return km, and distance will appear here dynamically.
                </Text>
              </View>
            ) : (
              rentalHistory.map((rh, idx) => {
                const sKm = rh.startKm;
                const eKm = rh.endKm;
                const dist = rh.distanceKm !== undefined ? rh.distanceKm : (sKm !== undefined && eKm !== undefined ? eKm - sKm : null);

                return (
                  <View key={rh.id || idx} style={s.historyCard}>
                    <View style={s.historyTop}>
                      <View>
                        <Text style={s.historyRiderName}>
                          👤 {rh.user?.name || "Rider"} {rh.user?.mobile ? `• ${rh.user.mobile}` : ""}
                        </Text>
                        <Text style={s.historyDates}>
                          {formatDate(rh.startAt)} → {formatDate(rh.actualReturnAt || rh.expectedReturnAt)}
                        </Text>
                      </View>
                      <View style={s.historyAmtBadge}>
                        <Text style={s.historyAmtText}>₹{rh.totalCharges || rh.rentalAmount}</Text>
                      </View>
                    </View>

                    {/* Odometer Match & Progression Row */}
                    <View style={s.kmProgressionRow}>
                      <View style={s.kmBox}>
                        <Text style={s.kmLabel}>Handover Start</Text>
                        <Text style={s.kmVal}>{sKm !== undefined ? `${sKm} km` : "-"}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                      <View style={s.kmBox}>
                        <Text style={s.kmLabel}>Returned At</Text>
                        <Text style={s.kmVal}>{eKm !== undefined ? `${eKm} km` : "-"}</Text>
                      </View>
                      {dist !== null && (
                        <View style={s.distPill}>
                          <Text style={s.distPillText}>+{dist} km</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* 4. Vehicle Status Selector */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="pulse" size={18} color={COLORS.green} />
              <Text style={s.cardTitle}>Vehicle Status</Text>
            </View>

            <View style={s.statusRow}>
              {STATUSES.map((st) => {
                const isSelected = status === st.key;
                return (
                  <Pressable
                    key={st.key}
                    style={[
                      s.statusBtn,
                      isSelected && {
                        backgroundColor: st.bg,
                        borderColor: st.color,
                        borderWidth: 1.5
                      }
                    ]}
                    onPress={() => setStatus(st.key)}
                  >
                    <Ionicons
                      name={st.icon as any}
                      size={15}
                      color={isSelected ? st.color : "#94A3B8"}
                    />
                    <Text
                      style={[
                        s.statusBtnText,
                        isSelected && { color: st.color, fontWeight: "900" }
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Basic Identity Details */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="information-circle" size={18} color={COLORS.navy} />
              <Text style={s.cardTitle}>Vehicle Identity</Text>
            </View>

            <Input
              label="Model Name *"
              value={model}
              onChangeText={setModel}
              placeholder="e.g. Ola S1 Pro"
            />

            <Input
              label="Registration Plate Number *"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              placeholder="e.g. TS 09 AB 1234"
              autoCapitalize="characters"
            />

            <Input
              label="Chassis / VIN Number (Optional)"
              value={chassisNumber}
              onChangeText={setChassisNumber}
              placeholder="e.g. ME4JF1728..."
              autoCapitalize="characters"
            />
          </View>

          {/* 6. Pricing & Rental Rates */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="pricetag" size={18} color={COLORS.navy} />
              <Text style={s.cardTitle}>Pricing & Rates</Text>
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Daily Rate (₹/day)"
                  value={rentalPerDay}
                  onChangeText={setRentalPerDay}
                  keyboardType="number-pad"
                  placeholder="300"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Extra Hour Rate (₹/hr)"
                  value={extraHourRate}
                  onChangeText={setExtraHourRate}
                  keyboardType="number-pad"
                  placeholder="40"
                />
              </View>
            </View>
          </View>

          {/* 7. Telemetry & Odometer (Continuous Fleet Match) */}
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Ionicons name="speedometer" size={18} color={COLORS.navy} />
              <Text style={s.cardTitle}>Vehicle Telemetry & Odometer</Text>
            </View>

            {/* Note on Odometer Matching */}
            <View style={s.odometerInfoBox}>
              <Ionicons name="sync" size={16} color="#0284C7" />
              <Text style={s.odometerInfoText}>
                Last Return Odometer: <Text style={{ fontWeight: "900" }}>{odometer} km</Text>. When a new user rents this bike, their starting odometer will automatically match this reading.
              </Text>
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Current Odometer (km)"
                  value={odometer}
                  onChangeText={setOdometer}
                  keyboardType="number-pad"
                  placeholder="9328"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Battery Level (%)"
                  value={battery}
                  onChangeText={setBattery}
                  keyboardType="number-pad"
                  placeholder="92"
                />
              </View>
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Driving Range (km)"
                  value={rangeKm}
                  onChangeText={setRangeKm}
                  keyboardType="number-pad"
                  placeholder="135"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Top Speed (km/h)"
                  value={topSpeed}
                  onChangeText={setTopSpeed}
                  keyboardType="number-pad"
                  placeholder="115"
                />
              </View>
            </View>
          </View>

          {/* 8. Save Changes Button */}
          <View style={{ marginTop: 12 }}>
            <Button
              title={saving ? "Saving Changes..." : "Save All Changes"}
              onPress={handleSaveAll}
              disabled={saving}
            />
          </View>

          {/* 9. Delete Bike Action */}
          <View style={{ marginTop: 12 }}>
            <Button
              title={deleting ? "Removing Vehicle..." : "Remove Bike from Fleet"}
              outline
              onPress={handleDelete}
              disabled={deleting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500"
  },
  content: {
    padding: 16
  },
  photoSection: {
    marginBottom: 16
  },
  photoFrame: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  photo: {
    width: "100%",
    height: 200,
    backgroundColor: "#F1F5F9"
  },
  newPhotoBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4
  },
  newPhotoBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800"
  },
  uploadBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  uploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.navy
  },
  revertBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  revertBtnText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "700"
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.navy,
    flex: 1
  },
  revenueGrid: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  revenueCol: {
    flex: 1
  },
  revenueLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600"
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy,
    marginTop: 3
  },
  activeRiderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center"
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#92400E"
  },
  riderName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.navy
  },
  riderPhone: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 2
  },
  riderEmail: {
    fontSize: 11,
    color: "#64748B"
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  riderTripDetails: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    gap: 6
  },
  tripRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  tripLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600"
  },
  tripVal: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.navy
  },
  callBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  callBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800"
  },
  historyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  historyRiderName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.navy
  },
  historyDates: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  historyAmtBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  historyAmtText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A"
  },
  kmProgressionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8
  },
  kmBox: {
    flex: 1
  },
  kmLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600"
  },
  kmVal: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.navy
  },
  distPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  distPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB"
  },
  mutedHistoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 8
  },
  odometerInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD"
  },
  odometerInfoText: {
    fontSize: 12,
    color: "#0369A1",
    flex: 1,
    lineHeight: 16
  },
  statusRow: {
    flexDirection: "row",
    gap: 8
  },
  statusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 5
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B"
  },
  twoCol: {
    flexDirection: "row",
    gap: 12
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80
  },
  mutedText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600"
  }
});

import React, { useEffect, useState } from "react";
import {
  ScrollView, Text, View, Image, Pressable, StyleSheet,
  Modal, Alert, ActivityIndicator, RefreshControl
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../api";
import { Bike } from "../../types";
import { Button, Input } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminBikesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Adding Bike
  const [model, setModel] = useState("");
  const [regNo, setRegNo] = useState("");
  const [rentalPerDay, setRentalPerDay] = useState("300");
  const [extraHourRate, setExtraHourRate] = useState("40");
  const [battery, setBattery] = useState("100");
  const [rangeKm, setRangeKm] = useState("100");
  const [topSpeed, setTopSpeed] = useState("115");
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await api.get("/bikes");
      setBikes(r.data.bikes || []);
    } catch (e: any) {
      console.log("Error loading bikes:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Photo library access is needed to select scooter photo.");
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
        Alert.alert("Permission Required", "Camera access is needed to take a scooter photo.");
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

  const handleAddBike = async () => {
    if (!model.trim() || !regNo.trim()) {
      Alert.alert("Missing Fields", "Please enter Model and Registration Number.");
      return;
    }

    setSubmitting(true);
    try {
      if (localImageUri) {
        // Upload photo directly to Cloudinary via backend multipart form-data
        const fd = new FormData();
        fd.append("model", model.trim());
        fd.append("registrationNumber", regNo.trim());
        fd.append("rentalPerDay", rentalPerDay);
        fd.append("extraHourRate", extraHourRate);
        fd.append("battery", battery);
        fd.append("rangeKm", rangeKm);
        fd.append("topSpeed", topSpeed);

        const filename = localImageUri.split("/").pop() || "bike.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        fd.append("image", { uri: localImageUri, name: filename, type } as any);

        await api.post("/admin/bikes", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/admin/bikes", {
          model: model.trim(),
          registrationNumber: regNo.trim(),
          rentalPerDay: Number(rentalPerDay),
          extraHourRate: Number(extraHourRate),
          battery: Number(battery),
          rangeKm: Number(rangeKm),
          topSpeed: Number(topSpeed),
          image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"
        });
      }

      Alert.alert("Success", `${model} added to fleet!`);
      // Reset form
      setModel("");
      setRegNo("");
      setLocalImageUri(null);
      setModalVisible(false);
      load();
    } catch (err: any) {
      console.error("Add bike error:", err.message);
      Alert.alert("Error", err?.response?.data?.message || "Could not add bike.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {/* Top Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Bike Management</Text>
          <Text style={s.headerSubtitle}>Manage EV fleet & add vehicles</Text>
        </View>

        {/* Add New Bike Button */}
        <Pressable style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={s.addBtnText}>Add Bike</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 50 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        <Text style={s.fleetCount}>Fleet ({bikes.length} Scooters)</Text>

        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={s.mutedText}>Loading fleet...</Text>
          </View>
        ) : bikes.length === 0 ? (
          <View style={s.centerBox}>
            <Ionicons name="bicycle-outline" size={48} color="#94A3B8" />
            <Text style={s.mutedText}>No bikes in fleet. Add your first bike!</Text>
          </View>
        ) : (
          bikes.map((b) => {
            const isAvailable = b.status === "AVAILABLE";
            const isRented = b.status === "RENTED" || b.status === "RESERVED";

            return (
              <View key={b.id} style={s.bikeCard}>
                <View style={s.cardTopRow}>
                  <View style={s.bikeImageBox}>
                    <Image
                      source={b.image ? { uri: b.image } : require("../../../assets/ev-smith.jpeg")}
                      style={s.bikeImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={s.bikeInfo}>
                    <Text style={s.modelText}>{b.model}</Text>
                    <Text style={s.regText}>{b.registrationNumber}</Text>

                    <View style={[
                      s.statusPill,
                      isAvailable ? s.pillAvail : isRented ? s.pillRented : s.pillMaint
                    ]}>
                      <Text style={[
                        s.statusText,
                        isAvailable ? s.textAvail : isRented ? s.textRented : s.textMaint
                      ]}>
                        {b.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Specs Row */}
                <View style={s.specsRow}>
                  <View style={s.specItem}>
                    <Text style={s.specLabel}>Battery</Text>
                    <Text style={s.specVal}>{b.battery}%</Text>
                  </View>
                  <View style={s.specItem}>
                    <Text style={s.specLabel}>Odometer</Text>
                    <Text style={s.specVal}>{b.odometer} km</Text>
                  </View>
                  <View style={s.specItem}>
                    <Text style={s.specLabel}>Rent/Day</Text>
                    <Text style={[s.specVal, { color: COLORS.green }]}>₹{b.rentalPerDay}</Text>
                  </View>
                  <View style={s.specItem}>
                    <Text style={s.specLabel}>Revenue</Text>
                    <Text style={s.specVal}>₹{b.totalRevenue}</Text>
                  </View>
                </View>

                <Pressable
                  style={s.viewBtn}
                  onPress={() => navigation.navigate("AdminBikeDetails", { bikeId: b.id })}
                >
                  <Text style={s.viewBtnText}>View & Edit Bike</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add New Bike Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add New Bike to Fleet</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Image Picker Section */}
              <Text style={s.inputLabel}>Upload Bike Photo</Text>
              <View style={s.uploadBtnRow}>
                <Pressable style={s.pickBtn} onPress={pickFromGallery}>
                  <Ionicons name="images-outline" size={18} color={COLORS.navy} />
                  <Text style={s.pickBtnText}>From Gallery</Text>
                </Pressable>

                <Pressable style={s.pickBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.navy} />
                  <Text style={s.pickBtnText}>Take Photo</Text>
                </Pressable>
              </View>

              {localImageUri && (
                <View style={s.previewContainer}>
                  <Image source={{ uri: localImageUri }} style={s.previewImg} />
                  <Pressable style={s.removeImgBtn} onPress={() => setLocalImageUri(null)}>
                    <Ionicons name="close" size={14} color={COLORS.white} />
                  </Pressable>
                </View>
              )}

              <Input
                label="Model Name *"
                value={model}
                onChangeText={setModel}
                placeholder="e.g. Ola S1 Pro, Ather 450X"
              />

              <Input
                label="Registration Plate Number *"
                value={regNo}
                onChangeText={setRegNo}
                placeholder="e.g. TS 09 AB 1234"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Daily Rate (₹)"
                    value={rentalPerDay}
                    onChangeText={setRentalPerDay}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Extra Hour Rate (₹)"
                    value={extraHourRate}
                    onChangeText={setExtraHourRate}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Battery (%)"
                    value={battery}
                    onChangeText={setBattery}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Range (km)"
                    value={rangeKm}
                    onChangeText={setRangeKm}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Input
                label="Top Speed (km/h)"
                value={topSpeed}
                onChangeText={setTopSpeed}
                keyboardType="number-pad"
              />

              <View style={{ marginTop: 14 }}>
                <Button
                  title={submitting ? "Uploading & Adding..." : "Add Bike to Fleet"}
                  onPress={handleAddBike}
                  disabled={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.navy },
  headerSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.green,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  content: { padding: 20 },
  fleetCount: { fontSize: 16, fontWeight: "800", color: "#64748B", marginBottom: 14 },
  bikeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  cardTopRow: { flexDirection: "row", alignItems: "center" },
  bikeImageBox: {
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
  modelText: { fontSize: 17, fontWeight: "900", color: COLORS.navy },
  regText: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6
  },
  pillAvail: { backgroundColor: "#DCFCE7" },
  textAvail: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  pillRented: { backgroundColor: "#FEF3C7" },
  textRented: { color: "#D97706", fontSize: 11, fontWeight: "800" },
  pillMaint: { backgroundColor: "#FEE2E2" },
  textMaint: { color: "#EF4444", fontSize: 11, fontWeight: "800" },
  statusText: { fontSize: 11, fontWeight: "800" },
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  specItem: { alignItems: "center" },
  specLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  specVal: { fontSize: 13, fontWeight: "800", color: COLORS.navy, marginTop: 2 },
  viewBtn: {
    marginTop: 14,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  viewBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  centerBox: { alignItems: "center", paddingVertical: 60 },
  mutedText: { color: "#94A3B8", marginTop: 10, fontSize: 14, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  inputLabel: { fontSize: 13, fontWeight: "700", color: COLORS.navy, marginBottom: 8 },
  uploadBtnRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#F8FAFC"
  },
  pickBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.navy },
  previewContainer: { position: "relative" },
  previewImg: { width: 50, height: 50, borderRadius: 10 },
  removeImgBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});

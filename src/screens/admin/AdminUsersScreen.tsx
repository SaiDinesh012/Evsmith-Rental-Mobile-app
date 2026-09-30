import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView, Text, Image, View, StyleSheet, RefreshControl,
  Pressable, Modal, Alert, ActivityIndicator, TextInput
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { Button } from "../../components/UI";
import { COLORS } from "../../theme";

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [updatingKyc, setUpdatingKyc] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/admin/users");
      setUsers(r.data.users || []);
    } catch (e: any) {
      console.log("Error loading users:", e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleUpdateKyc = async (status: "VERIFIED" | "REJECTED") => {
    if (!selectedUser) return;
    if (status === "REJECTED" && !rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }

    setUpdatingKyc(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/kyc`, {
        kycStatus: status,
        rejectionReason: status === "REJECTED" ? rejectReason : undefined
      });

      Alert.alert(
        "KYC Updated",
        `User ${selectedUser.name} has been marked as ${status}. Notification sent to user.`
      );
      setSelectedUser(null);
      setShowRejectInput(false);
      setRejectReason("");
      load();
    } catch (e: any) {
      Alert.alert("Update Error", e?.response?.data?.message || "Failed to update KYC status");
    } finally {
      setUpdatingKyc(false);
    }
  };

  const openUserReview = (u: any) => {
    setSelectedUser(u);
    setShowRejectInput(false);
    setRejectReason("");
  };

  const totalVerified = users.filter(u => u.kycStatus === "VERIFIED").length;
  const pendingKyc = users.filter(u => ["PENDING", "SUBMITTED"].includes(u.kycStatus)).length;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Riders & KYC Management</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        {/* KPI Strip */}
        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Total Riders</Text>
            <Text style={[s.kpiVal, { color: COLORS.navy }]}>{users.length}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Verified</Text>
            <Text style={[s.kpiVal, { color: COLORS.green }]}>{totalVerified}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Pending Review</Text>
            <Text style={[s.kpiVal, { color: "#D97706" }]}>{pendingKyc}</Text>
          </View>
        </View>

        <Text style={s.subHeading}>All Registered Customers ({users.length})</Text>

        {users.map((u) => {
          const isVerified = u.kycStatus === "VERIFIED";
          const isSubmitted = u.kycStatus === "SUBMITTED";
          const isRejected = u.kycStatus === "REJECTED";

          const initials = (u.name || "R")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          return (
            <Pressable key={u.id} style={s.card} onPress={() => openUserReview(u)}>
              {u.avatar ? (
                <Image source={{ uri: u.avatar }} style={s.avatar} />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.initialsText}>{initials}</Text>
                </View>
              )}

              <View style={s.userInfo}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={s.userName}>{u.name}</Text>
                  {isSubmitted && (
                    <View style={s.reviewDot} />
                  )}
                </View>
                <Text style={s.userEmail}>{u.email}</Text>
                <Text style={s.userMobile}>📞 {u.mobile || "-"}</Text>
              </View>

              <View style={s.statusCol}>
                <View style={[
                  s.kycBadge,
                  isVerified ? s.kycVerified : isSubmitted ? s.kycSubmitted : isRejected ? s.kycRejected : s.kycPending
                ]}>
                  <Text style={[
                    s.kycText,
                    isVerified ? s.textVerified : isSubmitted ? s.textSubmitted : isRejected ? s.textRejected : s.textPending
                  ]}>
                    {u.kycStatus || "PENDING"}
                  </Text>
                </View>
                <Text style={s.tapToReview}>Tap to review</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* KYC Document Review Modal */}
      {selectedUser && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setSelectedUser(null)}>
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>Rider Verification (KYC)</Text>
                  <Text style={s.modalSubtitle}>{selectedUser.name} • {selectedUser.mobile}</Text>
                </View>
                <Pressable onPress={() => setSelectedUser(null)} hitSlop={10}>
                  <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                {/* User Info Details */}
                <View style={s.infoBox}>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>User ID:</Text>
                    <Text style={s.infoVal}>{selectedUser.id}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>Email:</Text>
                    <Text style={s.infoVal}>{selectedUser.email}</Text>
                  </View>
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>KYC Status:</Text>
                    <Text style={[s.infoVal, { fontWeight: "900", color: selectedUser.kycStatus === "VERIFIED" ? COLORS.green : "#D97706" }]}>
                      {selectedUser.kycStatus || "PENDING"}
                    </Text>
                  </View>
                  {selectedUser.documentType && (
                    <View style={s.infoRow}>
                      <Text style={s.infoLabel}>Doc Type & Number:</Text>
                      <Text style={s.infoVal}>{selectedUser.documentType} ({selectedUser.documentNumber || "-"})</Text>
                    </View>
                  )}
                </View>

                {/* Uploaded Documents */}
                <Text style={s.docHeading}>Identity & License Documents</Text>

                {/* Identity Document */}
                <View style={s.docCard}>
                  <Text style={s.docLabel}>Identity Document (Aadhaar / Passport):</Text>
                  {selectedUser.identityDocumentUrl ? (
                    <Image source={{ uri: selectedUser.identityDocumentUrl }} style={s.docImg} resizeMode="contain" />
                  ) : (
                    <View style={s.noDocBox}>
                      <Ionicons name="document-outline" size={32} color="#94A3B8" />
                      <Text style={s.noDocText}>No Identity Document Uploaded</Text>
                    </View>
                  )}
                </View>

                {/* Driving Licence */}
                <View style={s.docCard}>
                  <Text style={s.docLabel}>Driving Licence (Mandatory for EV Rental):</Text>
                  {selectedUser.drivingLicenceUrl ? (
                    <Image source={{ uri: selectedUser.drivingLicenceUrl }} style={s.docImg} resizeMode="contain" />
                  ) : (
                    <View style={s.noDocBox}>
                      <Ionicons name="card-outline" size={32} color="#94A3B8" />
                      <Text style={s.noDocText}>No Driving Licence Uploaded</Text>
                    </View>
                  )}
                </View>

                {/* Rejection input */}
                {showRejectInput && (
                  <View style={s.rejectBox}>
                    <Text style={s.rejectLabel}>Reason for Rejection:</Text>
                    <TextInput
                      style={s.rejectInput}
                      placeholder="e.g. Licence expired or photo blurred..."
                      value={rejectReason}
                      onChangeText={setRejectReason}
                    />
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={s.actionRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={updatingKyc ? "Verifying..." : "Approve & Verify KYC"}
                    onPress={() => handleUpdateKyc("VERIFIED")}
                    disabled={updatingKyc}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Reject KYC"
                    outline
                    onPress={() => handleUpdateKyc("REJECTED")}
                    disabled={updatingKyc}
                  />
                </View>
              </View>
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
  content: { padding: 20 },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center"
  },
  kpiLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  kpiVal: { fontSize: 20, fontWeight: "900", marginTop: 4 },
  subHeading: { fontSize: 16, fontWeight: "800", color: "#64748B", marginBottom: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F5F9",
    marginRight: 14
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2E8F0"
  },
  initialsText: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "900", color: COLORS.navy },
  reviewDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D97706", marginLeft: 6 },
  userEmail: { fontSize: 12, color: "#64748B", marginTop: 2 },
  userMobile: { fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: "600" },
  statusCol: { alignItems: "flex-end" },
  kycBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4
  },
  kycVerified: { backgroundColor: "#DCFCE7" },
  textVerified: { color: "#16A34A", fontSize: 11, fontWeight: "800" },
  kycSubmitted: { backgroundColor: "#FEF3C7" },
  textSubmitted: { color: "#D97706", fontSize: 11, fontWeight: "800" },
  kycPending: { backgroundColor: "#F1F5F9" },
  textPending: { color: "#64748B", fontSize: 11, fontWeight: "800" },
  kycRejected: { backgroundColor: "#FEE2E2" },
  textRejected: { color: "#DC2626", fontSize: 11, fontWeight: "800" },
  kycText: { fontSize: 11, fontWeight: "800" },
  tapToReview: { fontSize: 11, color: COLORS.green, fontWeight: "700" },

  // Modal Styles
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
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  modalSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  infoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  infoLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  infoVal: { fontSize: 12, color: COLORS.navy, fontWeight: "700" },
  docHeading: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 10 },
  docCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  docLabel: { fontSize: 12, fontWeight: "700", color: COLORS.navy, marginBottom: 8 },
  docImg: { width: "100%", height: 160, borderRadius: 10 },
  noDocBox: { height: 90, justifyContent: "center", alignItems: "center" },
  noDocText: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  rejectBox: { marginTop: 10, marginBottom: 10 },
  rejectLabel: { fontSize: 12, fontWeight: "700", color: "#EF4444", marginBottom: 6 },
  rejectInput: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    color: COLORS.navy,
    fontSize: 13
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  }
});

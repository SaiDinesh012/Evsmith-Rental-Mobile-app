import React, { useEffect, useState } from "react";
import {
  Alert, ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, Image
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../api";
import { Button, Input } from "../../components/UI";
import { COLORS } from "../../theme";

type CMSTab = "banners" | "agreement";

export default function AdminCMSScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<CMSTab>("banners");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Banners State
  const [banners, setBanners] = useState<any[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showManualUrl, setShowManualUrl] = useState<Record<number, boolean>>({});

  // Agreement State
  const [agreement, setAgreement] = useState<any>({
    title: "",
    subtitle: "",
    lessorName: "",
    lessorAddress: "",
    supportHelpline: "",
    clauses: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [banRes, agrRes] = await Promise.all([
        api.get("/banners").catch(() => ({ data: { banners: [] } })),
        api.get("/cms/agreement").catch(() => ({ data: { agreement: null } }))
      ]);
      setBanners(banRes.data.banners || []);
      if (agrRes.data.agreement) {
        setAgreement(agrRes.data.agreement);
      }
    } catch (e: any) {
      console.error("Error loading CMS:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Banners
  const saveBanners = async () => {
    setSaving(true);
    try {
      await api.put("/admin/banners", { banners });
      Alert.alert("Success", "App banners updated successfully!");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to update banners");
    } finally {
      setSaving(false);
    }
  };

  // Save Agreement
  const saveAgreement = async () => {
    setSaving(true);
    try {
      await api.put("/admin/cms/agreement", agreement);
      Alert.alert("Agreement Updated", "Legal terms & conditions updated! All future rentals and agreements will reflect these changes immediately.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to update agreement");
    } finally {
      setSaving(false);
    }
  };

  const updateBanner = (index: number, field: string, value: string) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  const pickBannerImage = async (index: number, useCamera: boolean = false) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission Required", "Camera access is needed to capture a banner photo.");
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission Required", "Photo library access is needed to select a banner image.");
          return;
        }
      }

      const res = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.85
          });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setUploadingIndex(index);

        const banner = banners[index];
        const fd = new FormData();
        const filename = asset.uri.split("/").pop() || "banner.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        fd.append("image", { uri: asset.uri, name: filename, type } as any);

        const bannerId = banner?.id || (banner?.type === "MAIN" ? "banner_main" : "banner_secondary");
        const uploadRes = await api.post(`/admin/banners/${bannerId}/upload`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        const newUrl = uploadRes.data.imageUrl || uploadRes.data.url;
        updateBanner(index, "imageUrl", newUrl);
        Alert.alert("Banner Uploaded!", "New banner photo uploaded and applied successfully.");
      }
    } catch (err: any) {
      console.error("Banner upload error:", err);
      Alert.alert("Upload Failed", err?.response?.data?.message || err.message || "Failed to upload banner photo");
    } finally {
      setUploadingIndex(null);
    }
  };

  const toggleManualUrl = (index: number) => {
    setShowManualUrl(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const updateClause = (index: number, field: string, value: string) => {
    const updatedClauses = [...(agreement.clauses || [])];
    updatedClauses[index] = { ...updatedClauses[index], [field]: value };
    setAgreement({ ...agreement, clauses: updatedClauses });
  };

  const addClause = () => {
    const newClause = {
      id: `c_${Date.now()}`,
      heading: `Clause ${(agreement.clauses?.length || 0) + 1}`,
      text: ""
    };
    setAgreement({
      ...agreement,
      clauses: [...(agreement.clauses || []), newClause]
    });
  };

  const removeClause = (index: number) => {
    const updated = [...(agreement.clauses || [])];
    updated.splice(index, 1);
    setAgreement({ ...agreement, clauses: updated });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Content Management (CMS)</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabWrapper}>
        <View style={s.tabContainer}>
          <Pressable
            style={[s.tabBtn, activeTab === "banners" && s.tabBtnActive]}
            onPress={() => setActiveTab("banners")}
          >
            <Ionicons name="images-outline" size={16} color={activeTab === "banners" ? COLORS.white : "#64748B"} style={{ marginRight: 6 }} />
            <Text style={[s.tabText, activeTab === "banners" && s.tabTextActive]}>App Banners</Text>
          </Pressable>

          <Pressable
            style={[s.tabBtn, activeTab === "agreement" && s.tabBtnActive]}
            onPress={() => setActiveTab("agreement")}
          >
            <Ionicons name="document-text-outline" size={16} color={activeTab === "agreement" ? COLORS.white : "#64748B"} style={{ marginRight: 6 }} />
            <Text style={[s.tabText, activeTab === "agreement" && s.tabTextActive]}>Rental Agreement</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}>
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={s.mutedText}>Loading CMS configuration...</Text>
          </View>
        ) : activeTab === "banners" ? (
          /* BANNERS TAB */
          <View>
            <Text style={s.sectionTitle}>Manage App Promotional Banners</Text>
            <Text style={s.sectionSubtitle}>Update headline text and banner images displayed on customer home screens.</Text>

            {banners.map((banner, i) => (
              <View key={banner.id || i} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardBadge}>{banner.type} BANNER</Text>
                  <Text style={s.cardSubBadge}>{banner.type === "MAIN" ? "Top Home Hero" : "Mid Feed Promo"}</Text>
                </View>

                {/* Banner Image Preview */}
                <View style={s.bannerPreviewContainer}>
                  {banner.imageUrl ? (
                    <Image source={{ uri: banner.imageUrl }} style={s.bannerPreviewImg} resizeMode="cover" />
                  ) : (
                    <View style={s.bannerPlaceholder}>
                      <Ionicons name="images-outline" size={36} color="#94A3B8" />
                      <Text style={s.bannerPlaceholderText}>No banner image selected</Text>
                    </View>
                  )}

                  {uploadingIndex === i && (
                    <View style={s.uploadingOverlay}>
                      <ActivityIndicator size="large" color={COLORS.white} />
                      <Text style={s.uploadingText}>Uploading to Cloud...</Text>
                    </View>
                  )}
                </View>

                {/* Manual Upload Buttons */}
                <View style={s.uploadActionRow}>
                  <Pressable
                    style={[s.btnUpload, uploadingIndex === i && { opacity: 0.6 }]}
                    onPress={() => pickBannerImage(i, false)}
                    disabled={uploadingIndex === i}
                  >
                    <Ionicons name="images-outline" size={17} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={s.btnUploadText}>Upload from Gallery</Text>
                  </Pressable>

                  <Pressable
                    style={[s.btnCamera, uploadingIndex === i && { opacity: 0.6 }]}
                    onPress={() => pickBannerImage(i, true)}
                    disabled={uploadingIndex === i}
                  >
                    <Ionicons name="camera-outline" size={17} color={COLORS.navy} style={{ marginRight: 6 }} />
                    <Text style={s.btnCameraText}>Camera</Text>
                  </Pressable>
                </View>

                <Input
                  label="Headline Title"
                  value={banner.title}
                  onChangeText={(v: string) => updateBanner(i, "title", v)}
                  placeholder="e.g. Ride Green Ride Smart"
                />

                {banner.type === "MAIN" && (
                  <Input
                    label="Subtitle Tagline"
                    value={banner.subtitle || ""}
                    onChangeText={(v: string) => updateBanner(i, "subtitle", v)}
                    placeholder="e.g. Affordable | Safe | Reliable"
                  />
                )}

                {/* Optional Manual URL Input Toggle */}
                <Pressable onPress={() => toggleManualUrl(i)} style={s.toggleUrlLink}>
                  <Ionicons name={showManualUrl[i] ? "chevron-up" : "link-outline"} size={14} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={s.toggleUrlLinkText}>
                    {showManualUrl[i] ? "Hide Custom Image URL" : "Edit Image URL directly"}
                  </Text>
                </Pressable>

                {showManualUrl[i] && (
                  <Input
                    label="Image URL"
                    value={banner.imageUrl}
                    onChangeText={(v: string) => updateBanner(i, "imageUrl", v)}
                    placeholder="https://..."
                  />
                )}
              </View>
            ))}

            <Button
              title={saving ? "Saving Banners..." : "Save Banner Changes"}
              onPress={saveBanners}
              disabled={saving}
            />
          </View>
        ) : (
          /* AGREEMENT & POLICY CMS TAB */
          <View>
            <Text style={s.sectionTitle}>Rental Agreement & Terms CMS</Text>
            <Text style={s.sectionSubtitle}>
              Any changes made here instantly update the digital agreement signed by riders before booking.
            </Text>

            {/* General Entity Information */}
            <View style={s.card}>
              <Text style={s.cardHeading}>Company & Agreement Header</Text>
              <Input
                label="Agreement Title"
                value={agreement.title || ""}
                onChangeText={(v: string) => setAgreement({ ...agreement, title: v })}
              />
              <Input
                label="Tagline / Subtitle"
                value={agreement.subtitle || ""}
                onChangeText={(v: string) => setAgreement({ ...agreement, subtitle: v })}
              />
              <Input
                label="Lessor Name (Owner / Company)"
                value={agreement.lessorName || ""}
                onChangeText={(v: string) => setAgreement({ ...agreement, lessorName: v })}
              />
              <Input
                label="Registered Hub Address"
                value={agreement.lessorAddress || ""}
                onChangeText={(v: string) => setAgreement({ ...agreement, lessorAddress: v })}
              />
              <Input
                label="Support Helpline"
                value={agreement.supportHelpline || ""}
                onChangeText={(v: string) => setAgreement({ ...agreement, supportHelpline: v })}
                keyboardType="phone-pad"
              />
            </View>

            {/* Dynamic Clauses List */}
            <View style={{ marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={s.cardHeading}>Contract Clauses ({agreement.clauses?.length || 0})</Text>
                <Pressable style={s.btnAddClause} onPress={addClause}>
                  <Ionicons name="add-circle" size={18} color={COLORS.green} style={{ marginRight: 4 }} />
                  <Text style={s.btnAddClauseText}>Add Clause</Text>
                </Pressable>
              </View>

              {(agreement.clauses || []).map((clause: any, index: number) => (
                <View key={clause.id || index} style={s.clauseCard}>
                  <View style={s.clauseHeader}>
                    <Text style={s.clauseIndex}>Section {index + 1}</Text>
                    <Pressable onPress={() => removeClause(index)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </Pressable>
                  </View>

                  <Input
                    label="Clause Heading"
                    value={clause.heading || ""}
                    onChangeText={(v: string) => updateClause(index, "heading", v)}
                    placeholder="e.g. 1. Customer Declaration"
                  />

                  <Input
                    label="Clause Terms & Conditions"
                    value={clause.text || ""}
                    onChangeText={(v: string) => updateClause(index, "text", v)}
                    multiline
                    numberOfLines={4}
                    placeholder="Describe obligations, penalties, or rules..."
                  />
                </View>
              ))}
            </View>

            <View style={{ marginTop: 16 }}>
              <Button
                title={saving ? "Saving Agreement..." : "Publish Agreement Terms"}
                onPress={saveAgreement}
                disabled={saving}
              />
            </View>
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
  tabWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  tabBtnActive: { backgroundColor: COLORS.green },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: COLORS.white, fontWeight: "800" },
  content: { padding: 20 },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  mutedText: { marginTop: 12, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#64748B", marginBottom: 16, lineHeight: 18 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  cardBadge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  cardHeading: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  btnAddClause: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  btnAddClauseText: { fontSize: 13, fontWeight: "800", color: COLORS.green },
  clauseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  clauseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  clauseIndex: { fontSize: 13, fontWeight: "800", color: "#64748B" },
  cardSubBadge: { fontSize: 11, fontWeight: "700", color: "#64748B" },
  bannerPreviewContainer: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  bannerPreviewImg: {
    width: "100%",
    height: "100%"
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  bannerPlaceholderText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 6
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center"
  },
  uploadingText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8
  },
  uploadActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  btnUpload: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  btnUploadText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800"
  },
  btnCamera: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  btnCameraText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "800"
  },
  toggleUrlLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -2,
    marginBottom: 10
  },
  toggleUrlLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textDecorationLine: "underline"
  }
});

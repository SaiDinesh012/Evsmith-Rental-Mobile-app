import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api, clearAuth } from "../../api";
import { Button, Input, styles } from "../../components/UI";
import { COLORS } from "../../theme";

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [u, setU] = useState<any>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/me").then(r => setU(r.data.user)).catch(console.error);
  }, []);

  const pickImage = async (useCamera = false) => {
    try {
      let res;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Camera access is required to take a profile photo.");
          return;
        }
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Gallery access is required to upload a profile photo.");
          return;
        }
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
        });
      }

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setUploading(true);
        const fd = new FormData();
        fd.append("avatar", {
          uri: asset.uri,
          name: "avatar.jpg",
          type: "image/jpeg"
        } as any);

        const uploadRes = await api.post("/me/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setU(uploadRes.data.user);
        Alert.alert("Photo Updated", "Your profile photo has been updated successfully!");
      }
    } catch (e: any) {
      Alert.alert("Upload Error", e?.response?.data?.message || "Could not upload profile photo.");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      "Profile Photo",
      "Choose how you want to update your profile photo:",
      [
        { text: "Take Photo (Camera)", onPress: () => pickImage(true) },
        { text: "Choose from Gallery", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const save = async () => {
    try {
      const r = await api.put("/me", u);
      setU(r.data.user);
      Alert.alert("Success", "Profile saved successfully!");
    } catch {
      Alert.alert("Error", "Could not save profile");
    }
  };

  const logout = async () => {
    await clearAuth();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const userInitials = (u?.name || "R")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}>
        <Text style={styles.h1}>My Profile</Text>

        <View style={localStyles.profileHeader}>
          <Pressable onPress={handlePhotoOptions} style={{ position: "relative" }}>
            {u?.avatar ? (
              <Image 
                source={{ uri: u.avatar }} 
                style={localStyles.avatarLarge} 
              />
            ) : (
              <View style={[localStyles.avatarLarge, localStyles.avatarFallback]}>
                <Text style={localStyles.initialsText}>{userInitials}</Text>
              </View>
            )}
            <View style={localStyles.cameraPill}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </Pressable>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.h1, { fontSize: 20, color: COLORS.navy }]}>{u?.name || "Rider"}</Text>
            <Text style={styles.muted}>{u?.email || u?.mobile}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <View style={[
                localStyles.kycBadge, 
                { backgroundColor: u?.kycStatus === "VERIFIED" ? "#DCFCE7" : "#FEF3C7" }
              ]}>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: "800", 
                  color: u?.kycStatus === "VERIFIED" ? COLORS.green : "#D97706" 
                }}>
                  KYC: {u?.kycStatus || "PENDING"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Input label="Full Name" value={u?.name || ""} onChangeText={(v: string) => setU({ ...u, name: v })} />
        <Input label="Mobile" value={u?.mobile || ""} onChangeText={(v: string) => setU({ ...u, mobile: v })} keyboardType="phone-pad" />
        <Input label="Emergency Contact Name" value={u?.emergencyName || ""} onChangeText={(v: string) => setU({ ...u, emergencyName: v })} />
        <Input label="Emergency Contact Mobile" value={u?.emergencyMobile || ""} onChangeText={(v: string) => setU({ ...u, emergencyMobile: v })} keyboardType="phone-pad" />

        <View style={{ marginTop: 20, gap: 12 }}>
          <Button title="Save Changes" onPress={save} />
          <Button title="Logout" outline onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginTop: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    borderWidth: 3,
    borderColor: COLORS.green
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2E8F0"
  },
  initialsText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.navy
  },
  cameraPill: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.green,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white
  },
  kycBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  }
});

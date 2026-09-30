import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, ImageBackground, Image, StyleSheet, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../api";
import { styles } from "../../components/UI";
import { COLORS } from "../../theme";

export default function HomeScreen({ navigation }: any) {
  const [banners, setBanners] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const loadData = () => {
    api.get("/banners").then(r => setBanners(r.data.banners)).catch(console.error);
    api.get("/me").then(r => setUser(r.data.user)).catch(console.error);
  };

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener("focus", loadData);
    return unsub;
  }, [navigation]);

  const mainBanner = banners.find(b => b.type === "MAIN");
  const secondaryBanner = banners.find(b => b.type === "SECONDARY");

  const initials = (user?.name || "R")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSupport = () => {
    Alert.alert(
      "EVSmith Support",
      "Get in touch with customer care:\n\n• Helpline: +91 95153 62625\n• Available 8:00 AM - 10:00 PM",
      [
        { text: "Close", style: "cancel" },
        { text: "Call Now", onPress: () => Linking.openURL("tel:9515362625") }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={localStyles.headerRow}>
          <Pressable 
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => navigation.navigate("Profile")}
          >
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={localStyles.avatar} 
              />
            ) : (
              <View style={[localStyles.avatar, localStyles.avatarFallback]}>
                <Text style={localStyles.initialsText}>{initials}</Text>
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={localStyles.greeting}>Hello,</Text>
              <Text style={localStyles.name}>{user?.name || "Rider"}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.navy} />
          </Pressable>
        </View>

        {/* Main Banner */}
        {mainBanner && (
          <ImageBackground 
            source={{ uri: mainBanner.imageUrl }} 
            style={localStyles.mainBanner}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={localStyles.bannerOverlay}>
              <Text style={localStyles.mainBannerTitle}>{mainBanner.title}</Text>
              {mainBanner.subtitle && <Text style={localStyles.mainBannerSubtitle}>{mainBanner.subtitle}</Text>}
            </View>
          </ImageBackground>
        )}

        {/* Action Menu */}
        <View style={localStyles.menuGrid}>
          <Pressable style={localStyles.menuItem} onPress={() => navigation.navigate("Bikes")}>
            <View style={localStyles.iconCircle}>
              <MaterialCommunityIcons name="moped" size={28} color={COLORS.navy} />
            </View>
            <Text style={localStyles.menuText}>Browse{"\n"}Bikes</Text>
          </Pressable>
          <Pressable style={localStyles.menuItem} onPress={() => navigation.navigate("Rentals")}>
            <View style={localStyles.iconCircle}>
              <Ionicons name="receipt-outline" size={26} color={COLORS.navy} />
            </View>
            <Text style={localStyles.menuText}>My{"\n"}Rentals</Text>
          </Pressable>
          <Pressable style={localStyles.menuItem} onPress={() => navigation.navigate("PaymentsHistory")}>
            <View style={localStyles.iconCircle}>
              <Ionicons name="card-outline" size={26} color={COLORS.navy} />
            </View>
            <Text style={localStyles.menuText}>Payment{"\n"}History</Text>
          </Pressable>
          <Pressable style={localStyles.menuItem} onPress={handleSupport}>
            <View style={localStyles.iconCircle}>
              <Ionicons name="headset-outline" size={26} color={COLORS.navy} />
            </View>
            <Text style={localStyles.menuText}>24/7{"\n"}Support</Text>
          </Pressable>
        </View>

        {/* Secondary Banner */}
        {secondaryBanner && (
          <ImageBackground 
            source={{ uri: secondaryBanner.imageUrl }} 
            style={localStyles.secondaryBanner}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={localStyles.bannerOverlay}>
              <Text style={localStyles.secondaryBannerTitle}>{secondaryBanner.title}</Text>
            </View>
          </ImageBackground>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0"
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2E8F0"
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy
  },
  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500"
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy
  },
  mainBanner: {
    width: "100%",
    height: 200,
    marginBottom: 24,
    justifyContent: "flex-end"
  },
  secondaryBanner: {
    width: "100%",
    height: 120,
    marginTop: 10,
    justifyContent: "flex-end"
  },
  bannerOverlay: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  mainBannerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    marginBottom: 4,
    lineHeight: 32
  },
  mainBannerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "white"
  },
  secondaryBannerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
    width: "60%"
  },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 8
  },
  menuItem: {
    alignItems: "center",
    width: "22%"
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  menuText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.navy,
    textAlign: "center",
    lineHeight: 16
  }
});

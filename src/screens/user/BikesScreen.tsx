import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../api"; 
import { Bike } from "../../types"; 
import { COLORS } from "../../theme";

export default function BikesScreen({ navigation }: any) {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    api.get("/bikes").then(r => setBikes(r.data.bikes));
  }, []);

  const filteredBikes = bikes.filter(b => {
    if (activeTab === "Available") return b.status === "AVAILABLE";
    if (activeTab === "Nearby") return b.status === "AVAILABLE"; // Just a mock for nearby
    return true; // "All"
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={localStyles.screen}>
      <View style={localStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={localStyles.headerTitle}>Available Bikes</Text>
        <Ionicons name="filter-outline" size={24} color={COLORS.navy} />
      </View>

      <View style={localStyles.locationRow}>
        <Ionicons name="location-outline" size={16} color={COLORS.green} />
        <Text style={localStyles.locationText}>Hyderabad, Telangana</Text>
      </View>

      <View style={localStyles.tabs}>
        {["All", "Available", "Nearby"].map(t => (
          <Pressable 
            key={t} 
            style={[localStyles.tab, activeTab === t && localStyles.activeTab]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[localStyles.tabText, activeTab === t && localStyles.activeTabText]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={localStyles.content}>
        {filteredBikes.map(b => (
          <Pressable key={b.id} onPress={() => navigation.navigate("BikeDetails", { bikeId: b.id })}>
            <View style={localStyles.card}>
            <Image source={{ uri: b.image || "https://dummyimage.com/300x300/f3f4f6/a8a29e.jpg&text=Bike" }} style={localStyles.bikeImg} resizeMode="contain" />
            <View style={localStyles.cardRight}>
              <View style={localStyles.cardHeaderRow}>
                <View>
                  <Text style={localStyles.bikeName}>{b.model}</Text>
                  <Text style={localStyles.bikeReg}>{b.registrationNumber}</Text>
                </View>
                <Ionicons name="heart-outline" size={20} color="#94A3B8" />
              </View>
              
              <View style={localStyles.specs}>
                <View style={localStyles.specRow}>
                  <Ionicons name="battery-charging-outline" size={16} color={COLORS.green} />
                  <Text style={localStyles.specText}>Battery</Text>
                  <Text style={localStyles.specValue}>{b.battery}%</Text>
                </View>
                <View style={localStyles.specRow}>
                  <Ionicons name="speedometer-outline" size={16} color={COLORS.green} />
                  <Text style={localStyles.specText}>Range</Text>
                  <Text style={localStyles.specValue}>{b.rangeKm} km</Text>
                </View>
              </View>

              <View style={localStyles.cardFooter}>
                <Text style={localStyles.priceText}>
                  <Text style={localStyles.priceAmount}>₹{b.rentalPerDay}</Text> / day
                </Text>
                <Pressable 
                  style={[localStyles.rentBtn, b.status !== "AVAILABLE" && { backgroundColor: "#CBD5E1" }]}
                  disabled={b.status !== "AVAILABLE"}
                  onPress={() => navigation.navigate("BikeDetails", { bikeId: b.id })}
                >
                  <Text style={localStyles.rentBtnText}>Rent</Text>
                </Pressable>
              </View>
            </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  locationRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  locationText: { fontSize: 13, color: "#64748B", marginLeft: 4, fontWeight: "500" },
  tabs: { flexDirection: "row", justifyContent: "space-evenly", paddingHorizontal: 16, marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "#F1F5F9" },
  activeTab: { backgroundColor: COLORS.green },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  activeTabText: { color: COLORS.white },
  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  bikeImg: { width: 100, height: 100, marginRight: 16 },
  cardRight: { flex: 1 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bikeName: { fontSize: 15, fontWeight: "900", color: COLORS.navy },
  bikeReg: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  specs: { marginTop: 10 },
  specRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  specText: { fontSize: 12, color: "#64748B", marginLeft: 6, flex: 1 },
  specValue: { fontSize: 12, fontWeight: "700", color: COLORS.navy },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  priceAmount: { fontSize: 16, fontWeight: "900", color: COLORS.navy },
  priceText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  rentBtn: { backgroundColor: COLORS.green, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12 },
  rentBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 12 }
});

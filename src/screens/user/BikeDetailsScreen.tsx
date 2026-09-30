import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "../../api"; 
import { Bike } from "../../types"; 
import { COLORS } from "../../theme";

export default function BikeDetailsScreen({ route, navigation }: any) {
  const [bike, setBike] = useState<Bike>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    api.get(`/bikes/${route.params.bikeId}`).then(r => setBike(r.data.bike));
  }, []);

  if (!bike) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={localStyles.screen}>
      <View style={localStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Ionicons name="heart-outline" size={26} color={COLORS.navy} />
      </View>

      <ScrollView contentContainerStyle={localStyles.content}>
        <Image 
          source={{ uri: bike.image || "https://dummyimage.com/600x600/f3f4f6/a8a29e.jpg&text=Bike" }} 
          style={localStyles.mainImage} 
          resizeMode="contain" 
        />

        <View style={localStyles.titleRow}>
          <View>
            <Text style={localStyles.title}>{bike.model}</Text>
            <Text style={localStyles.subtitle}>{bike.registrationNumber}</Text>
          </View>
          <View style={[localStyles.badge, bike.status !== "AVAILABLE" && { backgroundColor: "#F1F5F9" }]}>
            <Text style={[localStyles.badgeText, bike.status !== "AVAILABLE" && { color: "#64748B" }]}>
              {bike.status === "AVAILABLE" ? "Available" : bike.status}
            </Text>
          </View>
        </View>

        <View style={localStyles.divider} />

        <View style={localStyles.statsRow}>
          <View style={localStyles.stat}>
            <View style={localStyles.statIconRow}>
              <Ionicons name="speedometer-outline" size={16} color={COLORS.green} />
              <Text style={localStyles.statLabel}>Range</Text>
            </View>
            <Text style={localStyles.statValue}>{bike.rangeKm} km</Text>
          </View>
          <View style={localStyles.stat}>
            <View style={localStyles.statIconRow}>
              <Ionicons name="battery-charging-outline" size={16} color={COLORS.green} />
              <Text style={localStyles.statLabel}>Battery</Text>
            </View>
            <Text style={localStyles.statValue}>{bike.battery}%</Text>
          </View>
          <View style={localStyles.stat}>
            <View style={localStyles.statIconRow}>
              <MaterialCommunityIcons name="speedometer" size={16} color={COLORS.green} />
              <Text style={localStyles.statLabel}>Top Speed</Text>
            </View>
            <Text style={localStyles.statValue}>{bike.topSpeed} km/h</Text>
          </View>
        </View>

        <View style={localStyles.divider} />

        <Text style={localStyles.priceSectionTitle}>Rental Price</Text>
        <View style={localStyles.priceRow}>
          <Text style={localStyles.priceAmount}>₹ {bike.rentalPerDay}</Text>
          <Text style={localStyles.priceDesc}> / day</Text>
        </View>
        <View style={localStyles.priceRow}>
          <Text style={localStyles.priceAmount}>₹ {bike.extraHourRate}</Text>
          <Text style={localStyles.priceDesc}> / extra hour</Text>
        </View>

        {bike.status !== "AVAILABLE" && (
          <View style={{ backgroundColor: "#FEF2F2", padding: 14, borderRadius: 12, marginTop: 20, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="information-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "700", flex: 1 }}>
              This scooter is currently {bike.status === "RENTED" ? "on an active rental trip" : bike.status === "RESERVED" ? "reserved by another rider" : "undergoing maintenance"}. Please choose another vehicle.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[localStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable 
          style={[localStyles.btn, bike.status !== "AVAILABLE" && { backgroundColor: "#94A3B8" }]}
          disabled={bike.status !== "AVAILABLE"}
          onPress={() => navigation.navigate("RentalPeriod", { bike })}
        >
          <Text style={localStyles.btnText}>
            {bike.status === "AVAILABLE" ? "Select This Bike" : `Unavailable (${bike.status})`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  content: { padding: 24, paddingBottom: 40 },
  mainImage: { width: "100%", height: 240, marginBottom: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.navy },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 4 },
  badge: { backgroundColor: "#DCFCE7", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  badgeText: { color: "#166534", fontWeight: "700", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center" },
  statIconRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  statLabel: { fontSize: 12, color: "#64748B", marginLeft: 4 },
  statValue: { fontSize: 14, fontWeight: "800", color: COLORS.navy },
  priceSectionTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  priceAmount: { fontSize: 18, fontWeight: "900", color: COLORS.green },
  priceDesc: { fontSize: 16, fontWeight: "600", color: COLORS.navy },
  bottomBar: { padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  btn: { backgroundColor: COLORS.green, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" }
});

import React from "react";
import { ScrollView, Text, View, Pressable, Image, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";

export default function BookingConfirmationScreen({ route, navigation }: any) {
  const { rental } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={s.screen}>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>

        {/* Success Icon */}
        <View style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Ionicons name="checkmark" size={52} color={COLORS.white} />
          </View>
          {/* Confetti dots */}
          {["#34D399","#60A5FA","#FBBF24","#F87171","#A78BFA"].map((c, i) => (
            <View key={i} style={[s.dot, { backgroundColor: c, top: Math.random() * 60, left: 20 + i * 55 }]} />
          ))}
        </View>

        <Text style={s.title}>Booking Confirmed!</Text>
        <Text style={s.subtitle}>
          Your bike is reserved. Please visit our location for verification and bike handover.
        </Text>

        {/* Details Card */}
        <View style={s.card}>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Booking ID</Text>
            <Text style={s.detailValue}>{rental.id}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Bike</Text>
            <Text style={s.detailValue}>{rental.bikeId}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Start</Text>
            <Text style={s.detailValue}>
              {new Date(rental.startAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
            </Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Return</Text>
            <Text style={s.detailValue}>
              {new Date(rental.expectedReturnAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
            </Text>
          </View>
        </View>

        {/* View Agreement Button — shows the signed agreement with signature */}
        <Pressable
          style={s.viewAgreementBtn}
          onPress={() => navigation.navigate("ViewAgreement", { rental })}
        >
          <Ionicons name="document-text-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
          <Text style={s.viewAgreementText}>View Agreement</Text>
        </Pressable>

        {/* Go to Home */}
        <Pressable
          style={s.homeBtn}
          onPress={() => navigation.navigate("User")}
        >
          <Text style={s.homeBtnText}>Go to Home</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, alignItems: "center" },
  iconWrap: { position: "relative", alignItems: "center", marginTop: 40, marginBottom: 24 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.green,
    alignItems: "center", justifyContent: "center",
    elevation: 6, shadowColor: COLORS.green, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }
  },
  dot: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.navy, textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  card: {
    width: "100%", backgroundColor: "#F8FAFC",
    borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: "#E2E8F0"
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  detailLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "800", color: COLORS.navy, flex: 1, textAlign: "right" },
  viewAgreementBtn: {
    width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center",
    paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.navy,
    backgroundColor: COLORS.white, marginBottom: 12
  },
  viewAgreementText: { fontSize: 15, fontWeight: "800", color: COLORS.navy },
  homeBtn: {
    width: "100%", backgroundColor: COLORS.green,
    paddingVertical: 16, borderRadius: 16, alignItems: "center"
  },
  homeBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "800" }
});

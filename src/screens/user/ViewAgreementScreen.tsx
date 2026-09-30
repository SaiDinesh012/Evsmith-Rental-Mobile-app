import React from "react";
import { ScrollView, Text, View, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";

export default function ViewAgreementScreen({ route, navigation }: any) {
  const { rental } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Rental Agreement</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>

        <View style={s.doc}>
          <Text style={s.title}>{rental.agreementSnapshot?.title || "EV SCOOTER RENTAL AGREEMENT"}</Text>
          <Text style={s.subtitle}>{rental.agreementSnapshot?.subtitle || "EVSMITH - RIDE ELECTRIC. RIDE SMART."}</Text>

          <Text style={s.h2}>1. ENTITY DETAILS</Text>
          <Text style={s.text}><Text style={s.bold}>Lessor (Owner):</Text> {rental.agreementSnapshot?.lessorName || "evsmith Mobility Solutions"}</Text>
          {rental.agreementSnapshot?.lessorAddress && (
            <Text style={s.text}><Text style={s.bold}>Hub Location:</Text> {rental.agreementSnapshot.lessorAddress}</Text>
          )}
          <Text style={s.text}><Text style={s.bold}>Lessee (Customer):</Text> {rental.user?.name || "As per customer profile"}</Text>

          <Text style={s.h2}>2. VEHICLE & RENTAL SPECIFICATIONS</Text>
          <Text style={s.text}><Text style={s.bold}>Booking ID:</Text> {rental.id}</Text>
          <Text style={s.text}><Text style={s.bold}>Vehicle ID:</Text> {rental.bike?.model || rental.bikeId} ({rental.bike?.registrationNumber || "Reg No."})</Text>
          <Text style={s.text}><Text style={s.bold}>Start Date:</Text> {new Date(rental.startAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Text>
          <Text style={s.text}><Text style={s.bold}>End Date:</Text> {new Date(rental.expectedReturnAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Text>
          <Text style={s.text}><Text style={s.bold}>Rental Amount:</Text> ₹{rental.rentalAmount}</Text>
          <Text style={s.text}><Text style={s.bold}>Security Deposit:</Text> ₹{rental.securityDeposit}</Text>

          <Text style={s.h2}>TERMS & CONDITIONS</Text>
          {(rental.agreementSnapshot?.clauses || [
            { heading: "Customer Declaration", text: "I possess a valid Driving Licence, am medically fit to ride, will obey all traffic rules, will not ride under influence, will wear a helmet, and take responsibility for any traffic fines." },
            { heading: "Customer Responsibilities", text: "Return the scooter in same condition, inform owner immediately of accidents, do not tamper with GPS or battery, and keep battery charged." },
            { heading: "Accident Clause", text: "Immediate intimation to owner within 1 hour. Do not admit liability without authorization. Damage responsibility determined based on policy & facts." },
            { heading: "Traffic Challans & Theft", text: "Customer pays all challans. In case of theft, immediate police complaint & GPS tracking activation is mandatory." },
            { heading: "Prohibited Uses", text: "Racing, stunts, illegal activities, carrying hazardous materials, commercial delivery, riding outside permitted limits." }
          ]).map((c: any, idx: number) => (
            <Text key={c.id || idx} style={s.text}>
              <Text style={s.bold}>{c.heading}:</Text> {c.text}
            </Text>
          ))}
        </View>

        {/* Signed Signature Section */}
        <View style={s.signatureSection}>
          <Text style={s.signatureTitle}>Customer Digital Signature</Text>
          <Text style={s.signatureSubtitle}>Signed and accepted by the customer</Text>

          {rental.customerSignature ? (
            <View style={s.signatureBox}>
              <Image
                source={{ uri: rental.customerSignature }}
                style={s.signatureImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={[s.signatureBox, { justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
              <Text style={{ color: "#94A3B8", marginTop: 8 }}>No signature found</Text>
            </View>
          )}

          <View style={s.signedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
            <Text style={s.signedText}>Agreement Signed & Accepted</Text>
          </View>
          <Text style={s.signedDate}>
            Signed on: {new Date(rental.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  content: { padding: 16 },
  doc: { backgroundColor: COLORS.white, padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 18, fontWeight: "900", textAlign: "center", color: COLORS.navy, marginBottom: 4 },
  subtitle: { fontSize: 11, fontWeight: "bold", textAlign: "center", color: COLORS.green, marginBottom: 16 },
  h2: { fontSize: 14, fontWeight: "900", color: COLORS.navy, marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 4 },
  text: { fontSize: 13, color: "#4A5568", marginBottom: 8, lineHeight: 20 },
  bold: { fontWeight: "800", color: COLORS.navy },
  signatureSection: { backgroundColor: COLORS.white, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  signatureTitle: { fontSize: 16, fontWeight: "900", color: COLORS.navy, marginBottom: 4 },
  signatureSubtitle: { fontSize: 12, color: "#94A3B8", marginBottom: 16 },
  signatureBox: {
    height: 160, borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, overflow: "hidden", backgroundColor: "#F8FAFC",
    marginBottom: 16
  },
  signatureImage: { width: "100%", height: "100%" },
  signedBadge: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  signedText: { fontSize: 13, fontWeight: "700", color: COLORS.green, marginLeft: 6 },
  signedDate: { fontSize: 12, color: "#94A3B8" }
});

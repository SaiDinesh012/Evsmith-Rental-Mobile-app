import React, { useState } from "react";
import { Alert, ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { COLORS } from "../../theme";

export default function PaymentScreen({ route, navigation }: any) {
  const { rental, total } = route.params;
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<any>();
  const [tx, setTx] = useState("");

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (!r.canceled) setFile(r.assets[0]);
  };

  const pay = async () => {
    try {
      const fd = new FormData();
      fd.append("rentalId", rental.id);
      fd.append("amount", String(total));
      fd.append("method", "QR");
      fd.append("transactionId", tx);
      if (file) fd.append("screenshot", { uri: file.uri, name: file.name || "payment.jpg", type: file.mimeType || "image/jpeg" } as any);
      
      await api.post("/payments", fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigation.replace("BookingConfirmation", { rental });
    } catch (e: any) {
      Alert.alert("Payment failed", e?.response?.data?.message || "Try again");
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={localStyles.screen}>
      <View style={localStyles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={localStyles.headerTitle}>Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={[localStyles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}>
        
        <Text style={localStyles.title}>Scan QR to Pay</Text>
        <Text style={localStyles.subtitle}>Pay ₹{total} to confirm your booking</Text>

        <View style={localStyles.qrCard}>
          <QRCode value={`upi://pay?pa=evsmith@upi&pn=EVSmith&am=${total}&cu=INR`} size={200} />
          <View style={localStyles.upiRow}>
            <Text style={localStyles.upiText}>UPI ID: evsmith@upi</Text>
            <Ionicons name="copy-outline" size={18} color={COLORS.navy} />
          </View>
        </View>

        <View style={localStyles.actionContainer}>
          <Pressable style={localStyles.btnPrimary} onPress={pay}>
            <Text style={localStyles.btnPrimaryText}>I've Paid</Text>
          </Pressable>
          <Pressable style={localStyles.btnOutline} onPress={pick}>
            <Text style={localStyles.btnOutlineText}>Upload Screenshot</Text>
          </Pressable>
          {file && <Text style={localStyles.fileName}>{file.name}</Text>}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy },
  content: { padding: 24, alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.navy, marginTop: 10 },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 8, marginBottom: 32 },
  qrCard: { 
    backgroundColor: COLORS.white, 
    padding: 32, 
    borderRadius: 24, 
    alignItems: "center",
    elevation: 4, 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 16, 
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 40
  },
  upiRow: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  upiText: { fontSize: 15, fontWeight: "700", color: COLORS.navy, marginRight: 8 },
  actionContainer: { width: "100%" },
  btnPrimary: { backgroundColor: COLORS.green, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 16 },
  btnPrimaryText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  btnOutline: { backgroundColor: COLORS.white, paddingVertical: 16, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.navy },
  btnOutlineText: { color: COLORS.navy, fontSize: 16, fontWeight: "800" },
  fileName: { textAlign: "center", marginTop: 8, fontSize: 12, color: "#64748B" }
});

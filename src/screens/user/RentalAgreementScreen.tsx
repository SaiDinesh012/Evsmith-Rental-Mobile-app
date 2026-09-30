import React, { useRef, useState, useEffect } from "react";
import { Alert, ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import SignatureCanvas from "react-native-signature-canvas";
import { api } from "../../api";
import { Button, Header, styles } from "../../components/UI";
import { COLORS } from "../../theme";

export default function RentalAgreementScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { bike, startAt, expectedReturnAt, securityDeposit, rentalAmount } = route.params;
  const ref = useRef<any>(null);
  const [signature, setSignature] = useState("");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [agreement, setAgreement] = useState<any>(null);
  const [loadingAgr, setLoadingAgr] = useState(true);

  useEffect(() => {
    api.get("/cms/agreement")
      .then(res => setAgreement(res.data.agreement))
      .catch(() => null)
      .finally(() => setLoadingAgr(false));
  }, []);

  const handleSignature = (sig: string) => {
    setSignature(sig);
  };

  const submitAgreement = async () => {
    if (!signature) {
      Alert.alert("Signature Required", "Please sign the agreement before proceeding.");
      return;
    }
    try {
      const r = await api.post("/rentals", {
        bikeId: bike.id,
        startAt,
        expectedReturnAt,
        securityDeposit: Number(securityDeposit),
        customerSignature: signature
      });
      navigation.navigate("Payment", { rental: r.data.rental, total: r.data.totalDueNow });
    } catch (e: any) {
      console.error("Booking error:", e.message || e);
      Alert.alert("Booking failed", e?.response?.data?.message || "Try again");
    }
  };

  const fallbackClauses = [
    { heading: "Customer Declaration", text: "I possess a valid Driving Licence, am medically fit to ride, will obey all traffic rules, will not ride under influence, will wear a helmet, and take responsibility for any traffic fines." },
    { heading: "Customer Responsibilities", text: "Return the scooter in same condition, inform owner immediately of accidents, do not tamper with GPS or battery, and keep vehicle safely parked." },
    { heading: "Accident Clause", text: "Immediate intimation to owner within 1 hour. Do not admit liability without authorization. Damage responsibility determined based on policy & facts." },
    { heading: "Traffic Challans & Theft", text: "Customer pays all traffic challans and fines. In case of vehicle theft, immediate police complaint and GPS tracking activation is mandatory." },
    { heading: "Prohibited Uses", text: "Racing, stunts, illegal activities, carrying hazardous materials, commercial courier overload, and riding outside permitted city limits." }
  ];

  const clausesToRender = agreement?.clauses?.length > 0 ? agreement.clauses : fallbackClauses;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <Header title="Rental Agreement" onBack={() => navigation.goBack()} />
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]} 
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        
        <View style={localStyles.doc}>
          <Text style={localStyles.title}>{agreement?.title || "EV SCOOTER RENTAL AGREEMENT"}</Text>
          <Text style={localStyles.subtitle}>{agreement?.subtitle || "EVSMITH - RIDE ELECTRIC. RIDE SMART."}</Text>
          
          <Text style={localStyles.h2}>1. ENTITY DETAILS</Text>
          <Text style={localStyles.text}><Text style={localStyles.bold}>Lessor (Owner):</Text> {agreement?.lessorName || "evsmith Mobility Solutions"}</Text>
          {agreement?.lessorAddress && (
            <Text style={localStyles.text}><Text style={localStyles.bold}>Hub Location:</Text> {agreement.lessorAddress}</Text>
          )}
          <Text style={localStyles.text}><Text style={localStyles.bold}>Lessee (Customer):</Text> (As per your profile)</Text>
          
          <Text style={localStyles.h2}>2. VEHICLE & RENTAL SPECIFICATIONS</Text>
          <Text style={localStyles.text}><Text style={localStyles.bold}>Vehicle:</Text> {bike.model} ({bike.registrationNumber})</Text>
          <Text style={localStyles.text}><Text style={localStyles.bold}>Start Date:</Text> {new Date(startAt).toLocaleString()}</Text>
          <Text style={localStyles.text}><Text style={localStyles.bold}>End Date:</Text> {new Date(expectedReturnAt).toLocaleString()}</Text>
          <Text style={localStyles.text}><Text style={localStyles.bold}>Security Deposit:</Text> ₹{securityDeposit}</Text>

          <Text style={localStyles.h2}>TERMS & CONDITIONS</Text>
          {clausesToRender.map((c: any, idx: number) => (
            <Text key={c.id || idx} style={localStyles.text}>
              <Text style={localStyles.bold}>{c.heading}:</Text> {c.text}
            </Text>
          ))}
        </View>

        <Text style={[styles.h2, { marginTop: 24, marginBottom: 8 }]}>Digital Signature</Text>
        <Text style={styles.muted}>Please sign below to accept the Rental Agreement and Terms & Conditions.</Text>
        
        <View style={localStyles.signatureContainer}>
          <SignatureCanvas
            ref={ref}
            onOK={handleSignature}
            onEmpty={() => setSignature("")}
            descriptionText="Sign Above"
            clearText="Clear"
            confirmText="Save"
            webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}` }
            onBegin={() => setScrollEnabled(false)}
            onEnd={() => {
              setScrollEnabled(true);
              ref.current?.readSignature();
            }}
          />
        </View>

        <View style={localStyles.controls}>
          <Button title="Clear Signature" outline onPress={() => { ref.current?.clearSignature(); setSignature(""); }} />
        </View>

        <View style={{ marginTop: 8, marginBottom: Math.max(insets.bottom, 16) }}>
          <Button title="Accept & Proceed to Payment" onPress={submitAgreement} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  doc: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    color: COLORS.navy
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.green,
    marginBottom: 16
  },
  h2: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.navy,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4
  },
  text: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 8,
    lineHeight: 20
  },
  bold: {
    fontWeight: "bold",
    color: COLORS.navy
  },
  signatureContainer: {
    height: 200,
    borderColor: COLORS.green,
    borderWidth: 2,
    borderRadius: 8,
    marginTop: 12,
    overflow: "hidden"
  },
  controls: {
    marginVertical: 16,
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});

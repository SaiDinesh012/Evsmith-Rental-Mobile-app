import React, { useState } from "react";
import {
  ScrollView, Text, View, Pressable, StyleSheet, Platform, Modal
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Bike } from "../../types";
import { COLORS } from "../../theme";

type PickerTarget = "start" | "end" | null;

export default function RentalPeriodScreen({ route, navigation }: any) {
  const bike: Bike = route.params.bike;
  const insets = useSafeAreaInsets();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });

  // State for iOS date picker modal
  const [iosPickerTarget, setIosPickerTarget] = useState<PickerTarget>(null);
  const [iosTempDate, setIosTempDate] = useState(new Date());

  const formatDate = (d: Date) =>
    d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

  const deposit = Number((bike as any).securityDeposit || 2000);
  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const totalDays = Math.ceil(Math.max(1, diffMs / 86400000));
  const rentalAmount = totalDays * bike.rentalPerDay;
  const isInvalid = endDate <= startDate;

  const durationText =
    days > 0 || hours > 0
      ? `${days > 0 ? `${days} Day${days > 1 ? "s" : ""}` : ""} ${hours > 0 ? `${hours} Hour${hours > 1 ? "s" : ""}` : ""}`.trim()
      : "0 Hours";

  // Native Android Date & Time Picker Flow
  const openAndroidPicker = (
    currentDate: Date,
    onSelect: (date: Date) => void,
    minimumDate?: Date
  ) => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: "date",
      display: "calendar",
      minimumDate: minimumDate || new Date(),
      onChange: (dateEvent, selectedDate) => {
        if (dateEvent.type === "set" && selectedDate) {
          const resultDate = new Date(selectedDate);
          resultDate.setHours(currentDate.getHours(), currentDate.getMinutes(), 0, 0);

          // Immediately prompt for native Material clock time
          DateTimePickerAndroid.open({
            value: resultDate,
            mode: "time",
            display: "clock",
            is24Hour: false,
            onChange: (timeEvent, timeDate) => {
              if (timeEvent.type === "set" && timeDate) {
                resultDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
              }
              onSelect(resultDate);
            }
          });
        }
      }
    });
  };

  const handlePickStart = () => {
    if (Platform.OS === "android") {
      openAndroidPicker(startDate, (newDate) => {
        setStartDate(newDate);
        if (endDate <= newDate) {
          const nextDay = new Date(newDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setEndDate(nextDay);
        }
      }, new Date());
    } else {
      setIosTempDate(startDate);
      setIosPickerTarget("start");
    }
  };

  const handlePickEnd = () => {
    if (Platform.OS === "android") {
      openAndroidPicker(endDate, (newDate) => {
        setEndDate(newDate);
      }, startDate);
    } else {
      setIosTempDate(endDate);
      setIosPickerTarget("end");
    }
  };

  const create = () => {
    if (isInvalid) return;
    navigation.navigate("RentalAgreement", {
      bike,
      startAt: startDate.toISOString(),
      expectedReturnAt: endDate.toISOString(),
      securityDeposit: deposit,
      rentalAmount
    });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Select Rental Period</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}>

        <Text style={s.label}>Start Date & Time</Text>
        <Pressable style={s.inputBox} onPress={handlePickStart}>
          <View style={{ flex: 1 }}>
            <Text style={s.inputText}>{formatDate(startDate)}</Text>
            <Text style={s.subText}>Tap to change start date & time</Text>
          </View>
          <View style={s.iconCircle}>
            <Ionicons name="calendar" size={20} color={COLORS.green} />
          </View>
        </Pressable>

        <Text style={s.label}>Expected Return Date & Time</Text>
        <Pressable style={s.inputBox} onPress={handlePickEnd}>
          <View style={{ flex: 1 }}>
            <Text style={s.inputText}>{formatDate(endDate)}</Text>
            <Text style={s.subText}>Tap to change return date & time</Text>
          </View>
          <View style={s.iconCircle}>
            <Ionicons name="calendar" size={20} color={COLORS.green} />
          </View>
        </Pressable>

        <Text style={s.label}>Rental Duration</Text>
        <View style={[s.inputBox, { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.inputText, { color: COLORS.green }]}>{durationText}</Text>
            <Text style={s.subText}>{totalDays} Day(s) calculated billing</Text>
          </View>
          <View style={[s.iconCircle, { backgroundColor: "#ECFDF5" }]}>
            <Ionicons name="time" size={20} color={COLORS.green} />
          </View>
        </View>

        {isInvalid && (
          <View style={s.errorBadge}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={s.errorText}>Return time must be after start time</Text>
          </View>
        )}

        <Text style={s.costTitle}>Cost Details</Text>

        <View style={s.costCard}>
          <View style={s.costRow}>
            <Text style={s.costLabel}>Daily Rate</Text>
            <Text style={s.costValue}>₹{bike.rentalPerDay}/day</Text>
          </View>
          <View style={s.costRow}>
            <Text style={s.costLabel}>Rental Amount ({totalDays} days)</Text>
            <Text style={s.costValue}>₹{rentalAmount.toLocaleString()}</Text>
          </View>
          <View style={s.costRow}>
            <Text style={s.costLabel}>Refundable Security Deposit</Text>
            <Text style={s.costValue}>₹{deposit.toLocaleString()}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.costRow}>
            <Text style={s.totalLabel}>Total Payable Now</Text>
            <Text style={s.totalValue}>₹{(rentalAmount + deposit).toLocaleString()}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar with Safe Area Inset Handling */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable
          style={[s.btn, isInvalid && { backgroundColor: "#CBD5E1" }]}
          onPress={create}
          disabled={isInvalid}
        >
          <Text style={s.btnText}>Proceed to Agreement</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
        </Pressable>
      </View>

      {/* iOS Modal Fallback */}
      {Platform.OS === "ios" && (
        <Modal
          visible={iosPickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setIosPickerTarget(null)}
        >
          <View style={s.iosOverlay}>
            <View style={s.iosSheet}>
              <View style={s.iosHeader}>
                <Pressable onPress={() => setIosPickerTarget(null)}>
                  <Text style={{ color: "#64748B", fontWeight: "600" }}>Cancel</Text>
                </Pressable>
                <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.navy }}>
                  {iosPickerTarget === "start" ? "Select Start Date & Time" : "Select Return Date & Time"}
                </Text>
                <Pressable
                  onPress={() => {
                    if (iosPickerTarget === "start") {
                      setStartDate(iosTempDate);
                      if (endDate <= iosTempDate) {
                        const next = new Date(iosTempDate);
                        next.setDate(next.getDate() + 1);
                        setEndDate(next);
                      }
                    } else {
                      setEndDate(iosTempDate);
                    }
                    setIosPickerTarget(null);
                  }}
                >
                  <Text style={{ color: COLORS.green, fontWeight: "800" }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosTempDate}
                mode="datetime"
                display="spinner"
                minimumDate={iosPickerTarget === "start" ? new Date() : startDate}
                onChange={(_, date) => date && setIosTempDate(date)}
              />
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
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: "800", color: COLORS.navy, marginBottom: 8, marginTop: 16 },
  inputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  inputText: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  subText: { fontSize: 12, color: "#94A3B8", marginTop: 4, fontWeight: "500" },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center"
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2"
  },
  errorText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },
  costTitle: { fontSize: 17, fontWeight: "900", color: COLORS.navy, marginTop: 28, marginBottom: 12 },
  costCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  costRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: "center" },
  costLabel: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  costValue: { fontSize: 14, fontWeight: "800", color: COLORS.navy },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: "900", color: COLORS.navy },
  totalValue: { fontSize: 18, fontWeight: "900", color: COLORS.green },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8
  },
  btn: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  iosOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  iosSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40
  },
  iosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  }
});

import React, { useState, useEffect, useRef } from "react";
import {
  Alert, ScrollView, Text, View, Image, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input, styles } from "../../components/UI";
import { api, saveAuth } from "../../api";
import { COLORS } from "../../theme";

export default function LoginScreen({ navigation, onLogin }: any) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("evsmith@gmail.com");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const submit = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      if (admin) {
        const r = await api.post("/auth/admin-login", { email, password });
        await saveAuth(r.data.token, "ADMIN");
        onLogin("ADMIN");
      } else {
        await api.post("/auth/request-otp", { email, mobile: email, identifier: email });
        navigation.navigate("OTP", { email, identifier: email });
      }
    } catch (e: any) {
      console.error("Login API Error:", e.message || e);
      Alert.alert("Login failed", e?.response?.data?.message || "Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            localStyles.content,
            { paddingBottom: keyboardVisible ? 260 : Math.max(insets.bottom, 20) + 30 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Brand — compact when keyboard is open */}
          <View style={[localStyles.brandSection, keyboardVisible && localStyles.brandSectionCompact]}>
            <View style={[localStyles.logoContainer, keyboardVisible && localStyles.logoContainerCompact]}>
              <Image
                source={require("../../../assets/ev-smith.jpeg")}
                style={localStyles.logoImage}
                resizeMode="cover"
              />
            </View>
            {!keyboardVisible && (
              <Text style={[styles.h2, localStyles.brandTitle]}>EV SCOOTER RENTAL SERVICE</Text>
            )}
          </View>

          <Text style={[styles.h1, keyboardVisible && { fontSize: 22 }]}>
            {admin ? "Admin Login" : "Welcome Back"}
          </Text>

          {!keyboardVisible && (
            <Text style={[styles.muted, { marginTop: 4, marginBottom: 16 }]}>
              {admin ? "Manage your EV fleet & operations" : "Enter Mobile Number / Email to continue"}
            </Text>
          )}

          <View style={{ marginTop: keyboardVisible ? 10 : 0 }}>
            <Input
              label={admin ? "Email" : "Mobile Number / Email"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType={admin ? "email-address" : "default"}
              placeholder={admin ? "admin@evsmith.in" : "evsmith@gmail.com"}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />

            {admin && (
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter admin password"
                onFocus={() => {
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
                }}
              />
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            <Button
              title={loading ? "Logging in..." : admin ? "Login as Admin" : "Send OTP"}
              onPress={submit}
              disabled={loading}
            />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button
              title={admin ? "Login as User" : "Login as Admin"}
              outline
              onPress={() => {
                const nextMode = !admin;
                setAdmin(nextMode);
                if (nextMode) {
                  setEmail("admin@evsmith.in");
                  setPassword("admin123");
                } else {
                  setEmail("evsmith@gmail.com");
                  setPassword("");
                }
              }}
            />
          </View>

          {!admin && !keyboardVisible && (
            <Text
              onPress={() => navigation.navigate("Register")}
              style={localStyles.registerLink}
            >
              New User? Register
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28
  },
  brandSectionCompact: {
    marginBottom: 12
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: COLORS.green,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  logoContainerCompact: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2
  },
  logoImage: {
    width: "100%",
    height: "100%"
  },
  brandTitle: {
    marginTop: 14,
    letterSpacing: 0.5
  },
  registerLink: {
    textAlign: "center",
    marginTop: 22,
    color: COLORS.green,
    fontWeight: "800",
    fontSize: 15
  }
});

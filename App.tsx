import React, {useEffect, useState} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Text, View, StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "./src/theme";
import LoginScreen from "./src/screens/auth/LoginScreen";
import OTPScreen from "./src/screens/auth/OTPScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import AddressScreen from "./src/screens/auth/AddressScreen";
import DocumentsScreen from "./src/screens/auth/DocumentsScreen";
import HomeScreen from "./src/screens/user/HomeScreen";
import BikesScreen from "./src/screens/user/BikesScreen";
import BikeDetailsScreen from "./src/screens/user/BikeDetailsScreen";
import RentalPeriodScreen from "./src/screens/user/RentalPeriodScreen";
import RentalAgreementScreen from "./src/screens/user/RentalAgreementScreen";
import PaymentScreen from "./src/screens/user/PaymentScreen";
import BookingConfirmationScreen from "./src/screens/user/BookingConfirmationScreen";
import ActiveRentalScreen from "./src/screens/user/ActiveRentalScreen";
import RentalDetailsScreen from "./src/screens/user/RentalDetailsScreen";
import ViewAgreementScreen from "./src/screens/user/ViewAgreementScreen";
import NotificationsScreen from "./src/screens/user/NotificationsScreen";
import ProfileScreen from "./src/screens/user/ProfileScreen";
import PaymentsHistoryScreen from "./src/screens/user/PaymentsHistoryScreen";
import AdminDashboardScreen from "./src/screens/admin/AdminDashboardScreen";
import AdminBikesScreen from "./src/screens/admin/AdminBikesScreen";
import AdminBikeDetailsScreen from "./src/screens/admin/AdminBikeDetailsScreen";
import AdminUsersScreen from "./src/screens/admin/AdminUsersScreen";
import AdminRentalsScreen from "./src/screens/admin/AdminRentalsScreen";
import AdminPaymentsScreen from "./src/screens/admin/AdminPaymentsScreen";
import AdminCMSScreen from "./src/screens/admin/AdminCMSScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function UserTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs.Navigator screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: COLORS.green,
    tabBarInactiveTintColor: "#8A99AD",
    tabBarStyle: {
      height: 64 + Math.max(insets.bottom, 16),
      paddingBottom: Math.max(insets.bottom, 16) + 6,
      paddingTop: 8,
      backgroundColor: COLORS.white,
      borderTopWidth: 0,
      elevation: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 }
    },
    tabBarLabelStyle: { fontWeight: "800", fontSize: 11, marginTop: 2 }
  }}>
    <Tabs.Screen name="Home" component={HomeScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
    }}/>
    <Tabs.Screen name="Bikes" component={BikesScreen} options={{
      tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "moped" : "moped-outline"} size={24} color={color} />
    }}/>
    <Tabs.Screen name="Rentals" component={ActiveRentalScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
    }}/>
    <Tabs.Screen name="Profile" component={ProfileScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
    }}/>
  </Tabs.Navigator>;
}
function AdminTabs() {
  const insets = useSafeAreaInsets();
  return <Tabs.Navigator screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: COLORS.green,
    tabBarInactiveTintColor: "#8A99AD",
    tabBarStyle: {
      height: 64 + Math.max(insets.bottom, 16),
      paddingBottom: Math.max(insets.bottom, 16) + 6,
      paddingTop: 8,
      backgroundColor: COLORS.white,
      borderTopWidth: 0,
      elevation: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 }
    },
    tabBarLabelStyle: { fontWeight: "800", fontSize: 11, marginTop: 2 }
  }}>
    <Tabs.Screen name="Dashboard" component={AdminDashboardScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
    }}/>
    <Tabs.Screen name="Bikes" component={AdminBikesScreen} options={{
      tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "moped" : "moped-outline"} size={24} color={color} />
    }}/>
    <Tabs.Screen name="Users" component={AdminUsersScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={22} color={color} />
    }}/>
    <Tabs.Screen name="Rentals" component={AdminRentalsScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
    }}/>
    <Tabs.Screen name="Payments" component={AdminPaymentsScreen} options={{
      tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "wallet" : "wallet-outline"} size={22} color={color} />
    }}/>
  </Tabs.Navigator>;
}

export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("role")
      .then((r) => {
        setRole(r);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  const initialRoute = role === "ADMIN" ? "Admin" : role === "USER" ? "User" : "Login";

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props: any) => <LoginScreen {...props} onLogin={(r: string) => setRole(r)} />}
          </Stack.Screen>
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Address" component={AddressScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />

          <Stack.Screen name="User" component={UserTabs} />
          <Stack.Screen name="BikeDetails" component={BikeDetailsScreen} />
          <Stack.Screen name="RentalPeriod" component={RentalPeriodScreen} />
          <Stack.Screen name="RentalAgreement" component={RentalAgreementScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
          <Stack.Screen name="RentalDetails" component={RentalDetailsScreen} />
          <Stack.Screen name="ViewAgreement" component={ViewAgreementScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="PaymentsHistory" component={PaymentsHistoryScreen} />

          <Stack.Screen name="Admin" component={AdminTabs} />
          <Stack.Screen name="AdminBikeDetails" component={AdminBikeDetailsScreen} />
          <Stack.Screen name="AdminCMS" component={AdminCMSScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}



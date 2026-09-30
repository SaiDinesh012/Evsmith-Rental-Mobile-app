import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView, Text, View, Pressable, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api";
import { COLORS } from "../../theme";

type FilterType = "All" | "Rentals" | "Payments" | "Offers";

export default function NotificationsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (e: any) {
      console.log("Error loading notifications:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return "";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    if (diffMin > 0) {
      return `${diffMin}m ago`;
    }
    return "Just now";
  };

  const getNotificationIconMeta = (item: any) => {
    const title = (item.title || "").toLowerCase();
    const type = (item.type || "").toUpperCase();

    if (title.includes("ends in") || title.includes("ending") || title.includes("hour")) {
      return {
        name: "time" as const,
        bgColor: "#FEF3C7",
        iconColor: "#D97706"
      };
    }
    if (title.includes("overdue") || type === "OVERDUE") {
      return {
        name: "warning" as const,
        bgColor: "#FEE2E2",
        iconColor: "#EF4444"
      };
    }
    if (type === "PAYMENT" || title.includes("payment")) {
      return {
        name: "checkmark-circle" as const,
        bgColor: "#CCFBF1",
        iconColor: "#0F766E"
      };
    }
    if (type === "OFFER" || title.includes("offer") || title.includes("cashback") || title.includes("discount")) {
      return {
        name: "gift" as const,
        bgColor: "#FEF3C7",
        iconColor: "#B45309"
      };
    }
    if (title.includes("welcome")) {
      return {
        name: "leaf" as const,
        bgColor: "#DCFCE7",
        iconColor: "#16A34A"
      };
    }
    // Default Booking / Rental
    return {
      name: "checkmark-circle" as const,
      bgColor: "#DCFCE7",
      iconColor: "#16A34A"
    };
  };

  // Dynamic filter matching
  const filteredItems = notifications.filter((item) => {
    if (selectedFilter === "All") return true;

    const type = (item.type || "").toUpperCase();
    const title = (item.title || "").toLowerCase();

    if (selectedFilter === "Rentals") {
      return type === "RENTAL" || title.includes("rental") || title.includes("bike") || title.includes("booking");
    }
    if (selectedFilter === "Payments") {
      return type === "PAYMENT" || title.includes("payment") || title.includes("paid") || title.includes("charges");
    }
    if (selectedFilter === "Offers") {
      return type === "OFFER" || title.includes("offer") || title.includes("welcome") || title.includes("discount");
    }
    return true;
  });

  const FILTERS: FilterType[] = ["All", "Rentals", "Payments", "Offers"];

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filter Tabs Pills */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTERS.map((f) => {
            const isActive = selectedFilter === f;
            return (
              <Pressable
                key={f}
                style={[s.filterPill, isActive && s.filterPillActive]}
                onPress={() => setSelectedFilter(f)}
              >
                <Text style={[s.filterText, isActive && s.filterTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={[s.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.green]} />}
      >
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={s.mutedText}>Loading notifications...</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          <View style={s.cardWrapper}>
            {filteredItems.map((item, index) => {
              const meta = getNotificationIconMeta(item);
              const isLast = index === filteredItems.length - 1;

              return (
                <View key={item.id || String(index)}>
                  <View style={s.notifItem}>
                    {/* Left Icon */}
                    <View style={[s.iconBox, { backgroundColor: meta.bgColor }]}>
                      <Ionicons name={meta.name} size={22} color={meta.iconColor} />
                    </View>

                    {/* Content */}
                    <View style={s.notifContent}>
                      <Text style={s.notifTitle}>{item.title}</Text>
                      <Text style={s.notifMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>

                    {/* Time */}
                    <Text style={s.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>

                  {!isLast && <View style={s.divider} />}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={44} color="#94A3B8" />
            </View>
            <Text style={s.emptyTitle}>No Notifications</Text>
            <Text style={s.emptySubtitle}>
              {selectedFilter === "All"
                ? "You have no new notifications right now."
                : `No notifications found under ${selectedFilter}.`}
            </Text>
          </View>
        )}
      </ScrollView>
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
  filterBar: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: "#F1F5F9"
  },
  filterPillActive: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  filterText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  filterTextActive: { color: COLORS.white, fontWeight: "800" },
  listContent: { padding: 20 },
  cardWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  notifContent: { flex: 1, marginLeft: 14, marginRight: 10 },
  notifTitle: { fontSize: 14, fontWeight: "800", color: COLORS.navy, marginBottom: 3 },
  notifMessage: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#94A3B8", fontWeight: "600", alignSelf: "flex-start", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 58 },
  centerBox: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  mutedText: { marginTop: 12, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: COLORS.navy, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20 }
});

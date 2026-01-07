import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PremiumScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.9}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Premium</Text>

          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <View style={styles.card}>
          <Text style={styles.h1}>Nâng cấp gói</Text>
          <Text style={styles.p}>
            Premium sẽ mở khoá: tạo playlist không giới hạn, tải xuống offline, chất lượng cao...
          </Text>

          <TouchableOpacity style={styles.btn} activeOpacity={0.9} onPress={() => {}}>
            <Text style={styles.btnText}>Mua gói Premium</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Bạn có thể bắt đăng nhập khi nhấn “Mua gói” (mình sẽ gắn auth guard ở bước tiếp theo).
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },

  card: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 14,
  },
  h1: { fontSize: 18, fontWeight: "900", color: "#111827" },
  p: { marginTop: 8, color: "#4b5563", lineHeight: 20 },

  btn: {
    marginTop: 14,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900" },

  note: { marginTop: 10, color: "#6b7280", fontSize: 12 },
});

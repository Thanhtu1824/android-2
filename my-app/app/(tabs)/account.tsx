import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";

type UserInfo = {
  email?: string;
};

export default function AccountTab() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setUser(null);
      setLoading(false);

      // Chưa đăng nhập -> đá về login và nhớ đường quay lại tab này
      router.replace({
        pathname: "/(auth)/login",
        params: { redirect: "/(tabs)/account" },
      } as any);
      return;
    }

    setUser({ email: session.user.email ?? "" });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const goMyPlaylists = useCallback(() => {
    // Bạn có thể điều hướng tới màn playlist list nếu có
    // Nếu chưa có màn list, có thể tạm đưa về Home (nơi đang show playlist)
    router.push("/(tabs)" as any);
    // hoặc: router.push("/(protected)/playlist" as any);
  }, []);

  const goFavorites = useCallback(() => {
    // Nếu bạn đã có route yêu thích thì trỏ đúng route đó
    // ví dụ: /(protected)/favorites
    router.push("/(protected)/favorites" as any);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace({
        pathname: "/(auth)/login",
        params: { redirect: "/(tabs)/account" },
      } as any);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Không thể đăng xuất");
    } finally {
      setLoggingOut(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Tài khoản</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Đang tải...</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Đang đăng nhập</Text>
              <Text style={styles.cardValue}>{user?.email ?? "—"}</Text>
            </View>

            <Text style={styles.section}>Chức năng</Text>

            <MenuItem title="Playlist của tôi" subtitle="Xem / quản lý playlist" onPress={goMyPlaylists} />
            <MenuItem title="Yêu thích" subtitle="Bài hát / playlist đã like" onPress={goFavorites} />

            {/* Bạn muốn thêm gì cứ thêm item tương tự */}
            {/* <MenuItem title="Tải xuống" subtitle="Nội dung đã tải" onPress={() => router.push("/(protected)/downloads" as any)} /> */}

            <Text style={styles.section}>Tài khoản</Text>

            <TouchableOpacity
              style={[styles.logoutBtn, loggingOut && { opacity: 0.7 }]}
              onPress={handleLogout}
              activeOpacity={0.9}
              disabled={loggingOut}
            >
              {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Đăng xuất</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.9}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSub}>{subtitle}</Text>}
      </View>
      <Text style={styles.chev}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  title: { fontSize: 24, fontWeight: "900", color: "#111827", marginBottom: 12 },
  section: { marginTop: 16, marginBottom: 8, color: "#6b7280", fontWeight: "800" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  cardLabel: { color: "#6b7280", fontWeight: "800", fontSize: 12 },
  cardValue: { color: "#111827", fontWeight: "900", marginTop: 6 },

  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  itemTitle: { color: "#111827", fontWeight: "900" },
  itemSub: { color: "#6b7280", marginTop: 4, fontWeight: "700", fontSize: 12 },
  chev: { fontSize: 22, color: "#9ca3af", fontWeight: "900" },

  logoutBtn: {
    marginTop: 8,
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "900" },

  center: { paddingTop: 30, alignItems: "center", gap: 10 },
  muted: { color: "#6b7280", fontWeight: "700" },
});

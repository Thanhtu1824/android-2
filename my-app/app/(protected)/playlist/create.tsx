import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

export default function CreatePlaylist() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    const n = name.trim();
    if (!n) return Alert.alert("Lỗi", "Nhập tên playlist");

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        Alert.alert("Vui lòng đăng nhập để tạo playlist.");
        router.replace("/(auth)/login" as any);
        return;
      }
      const { error } = await supabase
        .from("playlists")
        .insert({ name: n, user_id: user.id });

      if (error) {
        Alert.alert("Lỗi", error.message);
        return;
      }

      Alert.alert("OK", "Đã tạo playlist!");
      router.back(); // ✅ tạo xong quay lại
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()} // ✅ nút thoát mũi tên
            style={styles.iconBtn}
            activeOpacity={0.9}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Tạo playlist</Text>

          {/* spacer để title ở giữa */}
          <View style={{ width: 44 }} />
        </View>

        {/* FORM */}
        <Text style={styles.label}>Tên playlist</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Nhạc chill, Nhạc học bài..."
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={create}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Tạo</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 18,
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

  label: { color: "#111827", fontWeight: "800", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    color: "#111827",
    backgroundColor: "#fff",
  },

  btn: {
    marginTop: 12,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900" },
});

import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";

const FAVORITE_KEY = "FAVORITE_SONG_IDS";

type Track = {
  id: string;
  title: string;
  artist: string;
  file_path: string;
  artwork_url?: string | null;
};

async function getFavIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITE_KEY);
  const arr = raw ? (JSON.parse(raw) as string[]) : [];
  return Array.from(new Set(arr)).filter(Boolean);
}

export default function FavoritesScreen() {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Track[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const ids = await getFavIds();

    if (!ids.length) {
      setSongs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("songs")
      .select("id,title,artist,file_path,artwork_url,created_at")
      .in("id", ids);

    if (error) {
      console.log("Load favorites error:", error.message);
      setSongs([]);
      setLoading(false);
      return;
    }

    // giữ đúng thứ tự user đã like
    const map = new Map((data ?? []).map((s: any) => [s.id, s]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean) as Track[];

    setSongs(ordered);
    setLoading(false);
  }, []);

  // ✅ mỗi lần focus lại (từ player quay về) sẽ refresh
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: "/music/[id]" as any, params: { id: item.id } } as any)}
    >
      {item.artwork_url ? (
        <Image source={{ uri: item.artwork_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}

      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.artist}>{item.artist}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yêu thích</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Đang tải...</Text>
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="heart-outline" size={26} color="#9ca3af" />
            <Text style={[styles.muted, { marginTop: 8 }]}>Chưa có bài nào được yêu thích</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontWeight: "900", color: "#111827", fontSize: 16 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6b7280", fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "#f9fafb" },
  thumb: { width: 54, height: 54, borderRadius: 14 },
  thumbPlaceholder: { backgroundColor: "#e5e7eb" },

  title: { color: "#111827", fontWeight: "900" },
  artist: { color: "#6b7280", marginTop: 2, fontWeight: "600", fontSize: 12 },
});

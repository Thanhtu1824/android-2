import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

type Playlist = { id: string; name: string };

export default function PickPlaylist() {
  const { songId } = useLocalSearchParams<{ songId: string }>();

  const [list, setList] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Khóa thao tác khi đang thêm bài vào playlist (tránh bấm nhiều lần)
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("id,name")
        .order("created_at", { ascending: false });

      if (error) console.log(error.message);
      setList((data ?? []) as Playlist[]);
      setLoading(false);
    };

    load();
  }, []);

  const addTo = async (playlistId: string) => {
    if (!songId) {
      Alert.alert("Lỗi", "Không tìm thấy bài hát.");
      return;
    }

    // Nếu đang thêm rồi thì chặn bấm tiếp (kể cả bấm playlist khác)
    if (addingId) return;

    setAddingId(playlistId);
    try {
      // Dùng upsert + ignoreDuplicates để không lỗi khi trùng
      // YÊU CẦU: DB có unique (playlist_id, song_id) để onConflict hoạt động đúng
      const { error } = await supabase
        .from("playlist_tracks")
        .upsert(
          { playlist_id: playlistId, song_id: songId },
          { onConflict: "playlist_id,song_id", ignoreDuplicates: true }
        );

      if (error) {
        Alert.alert("Lỗi", error.message);
        return;
      }

      Alert.alert("OK", "Đã thêm vào playlist!");
      router.back();
    } finally {
      setAddingId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ padding: 16, flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#111827" }}>
          Chọn playlist
        </Text>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/(protected)/playlist/create" as any)}
          activeOpacity={0.9}
          disabled={!!addingId}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            + Tạo playlist mới
          </Text>
        </TouchableOpacity>

        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const disabled = addingId === item.id;
            return (
              <TouchableOpacity
                style={[styles.row, disabled && styles.rowDisabled]}
                onPress={() => addTo(item.id)}
                activeOpacity={0.9}
                disabled={disabled || !!addingId}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {disabled ? (
                    <ActivityIndicator style={{ marginLeft: 10 }} />
                  ) : null}
                </View>

                {disabled ? (
                  <Text style={styles.subText}>Đang thêm...</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={{ marginTop: 16 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <Text style={{ marginTop: 14, color: "#6b7280" }}>
                Chưa có playlist nào. Hãy tạo playlist mới.
              </Text>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  row: {
    marginTop: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  name: {
    fontWeight: "800",
    color: "#111827",
    flexShrink: 1,
  },
  subText: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
});

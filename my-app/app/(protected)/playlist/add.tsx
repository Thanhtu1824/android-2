import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

type SongRow = {
  id: string;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
};

export default function AddSongToPlaylistScreen() {
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<SongRow[]>([]);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("songs")
      .select("id,title,artist,audio_url")
      .order("created_at", { ascending: false });

    if (error) console.log(error.message);
    setSongs((data ?? []) as SongRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return songs;
    return songs.filter((s) => (s.title ?? "").toLowerCase().includes(k) || (s.artist ?? "").toLowerCase().includes(k));
  }, [q, songs]);

  const addSong = useCallback(
    async (songId: string) => {
      if (!playlistId) return;

      // ✅ check trùng trước
      const { data: exist, error: existErr } = await supabase
        .from("playlist_tracks")
        .select("song_id")
        .eq("playlist_id", playlistId)
        .eq("song_id", songId)
        .maybeSingle();

      if (existErr) {
        Alert.alert("Lỗi", existErr.message);
        return;
      }
      if (exist) {
        Alert.alert("Đã có", "Bài này đã có trong playlist rồi.");
        return;
      }

      const { error } = await supabase
        .from("playlist_tracks")
        .insert({ playlist_id: playlistId, song_id: songId });

      if (error) {
        Alert.alert("Lỗi", error.message);
        return;
      }

      Alert.alert("OK", "Đã thêm vào playlist!");
      router.back();
    },
    [playlistId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.title}>Thêm bài vào playlist</Text>

        <View style={{ marginTop: 12 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm bài..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        {loading ? (
          <View style={{ paddingTop: 24 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} activeOpacity={0.9} onPress={() => addSong(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{item.artist ?? "Unknown artist"}</Text>
                </View>
                <Text style={{ fontWeight: "900", color: "#2563eb" }}>+ Add</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "900", color: "#111827" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  row: {
    marginTop: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: { fontWeight: "900", color: "#111827" },
  rowSub: { marginTop: 4, color: "#6b7280", fontWeight: "700", fontSize: 12 },
});

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { getFavoriteSet, toggleFavorite } from "../../../lib/favorites";

const BUCKET = "tracks";

type Track = {
  id: string;
  title: string;
  artist: string;
  file_path: string;
  artwork_url?: string | null;
};

export default function MusicHome() {
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => setFavSet(await getFavoriteSet()))();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("songs")
        .select("id,title,artist,file_path,artwork_url,created_at")
        .order("created_at", { ascending: false });

      if (error) console.log("Load songs error:", error.message);
      else setTracks((data ?? []) as Track[]);

      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(s) || t.artist.toLowerCase().includes(s)
    );
  }, [q, tracks]);

  const getPublicUrl = useCallback((file_path: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
    return encodeURI(data.publicUrl);
  }, []);

  const onShare = useCallback(async (t: Track) => {
    const url = getPublicUrl(t.file_path);
    await Share.share({
      message: `${t.title} - ${t.artist}\n${url}`,
    });
  }, [getPublicUrl]);

  const onToggleFav = useCallback(async (id: string) => {
    const next = await toggleFavorite(id);
    setFavSet(next);
  }, []);

  const requireLoginThen = useCallback(async (redirect: string) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push({ pathname: "/(auth)/login", params: { redirect } } as any);
      return false;
    }
    return true;
  }, []);

  const onAddToPlaylist = useCallback(async (t: Track) => {
    // bắt login khi add playlist
    const ok = await requireLoginThen(`/music`); // quay lại tab music
    if (!ok) return;

    // tạm thời: điều hướng sang màn chọn playlist (mình gửi ở dưới)
    router.push({ pathname: "/(protected)/playlist/pick", params: { songId: t.id } } as any);
  }, [requireLoginThen]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>Nhạc</Text>

        <View style={{ marginTop: 12, marginBottom: 14 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm bài hát, ca sĩ..."
            placeholderTextColor="#9ca3af"
            style={styles.search}
          />
        </View>

        {loading ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isFav = favSet.has(item.id);

              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push({ pathname: "/music/[id]", params: { id: item.id } } as any)}
                  activeOpacity={0.9}
                >
                  {item.artwork_url ? (
                    <Image source={{ uri: item.artwork_url }} style={styles.artwork} />
                  ) : (
                    <View style={styles.artwork} />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.trackTitle}>{item.title}</Text>
                    <Text numberOfLines={1} style={styles.trackArtist}>{item.artist}</Text>
                  </View>

                  {/* ACTIONS */}
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onToggleFav(item.id)} style={styles.iconBtn}>
                      <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color="#111827" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onAddToPlaylist(item)} style={styles.iconBtn}>
                      <Ionicons name="add-circle-outline" size={20} color="#111827" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onShare(item)} style={styles.iconBtn}>
                      <Ionicons name="share-social-outline" size={18} color="#111827" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  row: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  artwork: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#e5e7eb" },
  trackTitle: { color: "#111827", fontWeight: "800" },
  trackArtist: { color: "#6b7280", marginTop: 2, fontSize: 12 },

  actions: { flexDirection: "row", gap: 6, alignItems: "center" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
});

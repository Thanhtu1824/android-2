import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
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
  const [searching, setSearching] = useState(false);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  const debounceRef = useRef<any>(null);

  useEffect(() => {
    (async () => setFavSet(await getFavoriteSet()))();
  }, []);

  const getPublicUrl = useCallback((file_path: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
    return encodeURI(data.publicUrl);
  }, []);

  const onShare = useCallback(
    async (t: Track) => {
      const url = getPublicUrl(t.file_path);
      await Share.share({
        message: `${t.title} - ${t.artist}\n${url}`,
      });
    },
    [getPublicUrl]
  );

  const requireLoginThen = useCallback(async (redirect: string) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push({ pathname: "/(auth)/login", params: { redirect } } as any);
      return false;
    }
    return true;
  }, []);

  const onToggleFav = useCallback(
    async (songId: string) => {
      const ok = await requireLoginThen(`/music`);
      if (!ok) return;

      const next = await toggleFavorite(songId);
      setFavSet(next);
    },
    [requireLoginThen]
  );

  const onAddToPlaylist = useCallback(
    async (t: Track) => {
      const ok = await requireLoginThen(`/music`);
      if (!ok) return;

      router.push({ pathname: "/(protected)/playlist/pick", params: { songId: t.id } } as any);
    },
    [requireLoginThen]
  );

  // ✅ Load all
  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("songs")
      .select("id,title,artist,file_path,artwork_url,created_at")
      .order("created_at", { ascending: false });

    if (error) console.log("Load songs error:", error.message);
    else setTracks((data ?? []) as Track[]);

    setLoading(false);
  }, []);

  // ✅ Search từ Supabase
  const searchFromServer = useCallback(
    async (keywordRaw: string) => {
      const keyword = keywordRaw.trim();

      if (!keyword) {
        await loadAll();
        return;
      }

      const safe = keyword.replace(/[%_]/g, "");
      setSearching(true);

      const { data, error } = await supabase
        .from("songs")
        .select("id,title,artist,file_path,artwork_url,created_at")
        .or(`title.ilike.%${safe}%,artist.ilike.%${safe}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Search songs error:", error.message);
        setTracks([]);
      } else {
        setTracks((data ?? []) as Track[]);
      }

      setSearching(false);
    },
    [loadAll]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ✅ Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchFromServer(q);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, searchFromServer]);

  const empty = useMemo(
    () => !loading && !searching && tracks.length === 0,
    [loading, searching, tracks.length]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }} edges={["top"]}>
      {/* ✅ Click ra ngoài => dismiss keyboard, mất focus search */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>Nhạc</Text>

          <View style={{ marginTop: 12, marginBottom: 14 }}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Tìm bài hát, ca sĩ..."
              placeholderTextColor="#9ca3af"
              style={styles.search}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit
            />
          </View>

          {loading ? (
            <View style={{ marginTop: 20, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Đang tải...</Text>
            </View>
          ) : (
            <>
              {searching ? (
                <View style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator />
                  <Text style={{ color: "#6b7280", fontWeight: "700" }}>Đang tìm...</Text>
                </View>
              ) : null}

              {empty ? (
                <View style={{ marginTop: 18, alignItems: "center" }}>
                  <Ionicons name="search-outline" size={24} color="#9ca3af" />
                  <Text style={{ marginTop: 8, color: "#6b7280", fontWeight: "700" }}>
                    Không tìm thấy bài phù hợp
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={tracks}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  // ✅ chạm vào list vẫn bấm được + tự dismiss keyboard
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    const isFav = favSet.has(item.id);

                    return (
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                          Keyboard.dismiss(); // ✅ bấm bài => tắt keyboard luôn
                          router.push({ pathname: "/music/[id]", params: { id: item.id } } as any);
                        }}
                        activeOpacity={0.9}
                      >
                        {item.artwork_url ? (
                          <Image source={{ uri: item.artwork_url }} style={styles.artwork} />
                        ) : (
                          <View style={styles.artwork} />
                        )}

                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.trackTitle}>
                            {item.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.trackArtist}>
                            {item.artist}
                          </Text>
                        </View>

                        <View style={styles.actions}>
                          <TouchableOpacity
                            onPress={() => onToggleFav(item.id)}
                            style={styles.iconBtn}
                            activeOpacity={0.9}
                          >
                            <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color="#111827" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => onAddToPlaylist(item)}
                            style={styles.iconBtn}
                            activeOpacity={0.9}
                          >
                            <Ionicons name="add-circle-outline" size={20} color="#111827" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => onShare(item)}
                            style={styles.iconBtn}
                            activeOpacity={0.9}
                          >
                            <Ionicons name="share-social-outline" size={18} color="#111827" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
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

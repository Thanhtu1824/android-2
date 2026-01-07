import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Audio } from "expo-av";

type SongRow = {
  id: string;
  title: string;
  artist?: string | null;
  file_path?: string | null; // ✅ cột thật của bạn trong songs
  artwork_url?: string | null;
};

type TrackItem = {
  song_id: string;
  song: SongRow; // ✅ 1 object
};

type LoopMode = "off" | "all" | "one";

export default function PlaylistDetailScreen() {
  const { id: playlistId } = useLocalSearchParams<{ id: string }>();

  const [playlistName, setPlaylistName] = useState<string>("Playlist");
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackItem[]>([]);

  // Player
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowSongId, setNowSongId] = useState<string | null>(null);

  // ✅ Loop state + ref (ref để callback không bị “state cũ”)
  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const loopModeRef = useRef<LoopMode>("off");

  // ✅ giữ index đang phát để callback auto-next dùng đúng index
  const nowIndexRef = useRef<number>(-1);

  const playable = useMemo(() => tracks.filter((t) => !!t.song?.id), [tracks]);

  const unloadSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
  }, []);

  const getPublicTrackUrl = useCallback((filePath?: string | null) => {
    if (!filePath) return null;
    const { data } = supabase.storage.from("tracks").getPublicUrl(filePath);
    return data?.publicUrl ?? null;
  }, []);

  const load = useCallback(async () => {
    if (!playlistId) return;
    setLoading(true);

    const { data: pl, error: plErr } = await supabase
      .from("playlists")
      .select("id,name")
      .eq("id", playlistId)
      .single();

    if (plErr) console.log(plErr.message);
    if (pl?.name) setPlaylistName(pl.name);

    const { data, error } = await supabase
      .from("playlist_tracks")
      .select(
        `
        song_id,
        song:songs!inner (
          id, title, artist, file_path, artwork_url
        )
      `
      )
      .eq("playlist_id", playlistId)
      .order("created_at", { ascending: true });

    if (error) console.log(error.message);

    const normalized: TrackItem[] = (data ?? [])
      .map((row: any) => ({
        song_id: row.song_id as string,
        song: row.song as SongRow,
      }))
      .filter((x) => !!x.song?.id);

    setTracks(normalized);
    setLoading(false);
  }, [playlistId]);

  useEffect(() => {
    load();
    return () => {
      unloadSound();
    };
  }, [load, unloadSound]);

  // ✅ apply native loop when mode changes (loop-one dùng looping native)
  useEffect(() => {
    (async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.setIsLoopingAsync(loopMode === "one");
        }
      } catch {}
    })();
  }, [loopMode]);

  const cycleLoopMode = useCallback(() => {
    setLoopMode((prev) => {
      const next: LoopMode = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      loopModeRef.current = next; // ✅ sync ref
      return next;
    });
  }, []);

  const playSongAt = useCallback(
    async (index: number) => {
      if (index < 0 || index >= playable.length) return;

      const song = playable[index].song;
      const url = getPublicTrackUrl(song.file_path);

      if (!url) {
        Alert.alert("Thiếu file", "Bài này chưa có file_path hoặc không lấy được public url.");
        return;
      }

      await unloadSound();

      nowIndexRef.current = index;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        async (status) => {
          if (!status.isLoaded) return;

          // ✅ auto next / loop
          if (status.didJustFinish) {
            const mode = loopModeRef.current;
            const curIdx = nowIndexRef.current;

            // loop 1 bài: phát lại bài hiện tại
            if (mode === "one") {
              await playSongAt(curIdx);
              return;
            }

            const next = curIdx + 1;

            // còn bài tiếp theo trong playlist
            if (next < playable.length) {
              await playSongAt(next);
              return;
            }

            // hết playlist
            if (mode === "all" && playable.length > 0) {
              await playSongAt(0);
              return;
            }

            // off: dừng
            setIsPlaying(false);
            setNowSongId(null);
            nowIndexRef.current = -1;
          }
        }
      );

      soundRef.current = sound;

      // ✅ nếu đang ở loop one thì bật looping native
      try {
        await sound.setIsLoopingAsync(loopModeRef.current === "one");
      } catch {}

      setNowSongId(song.id);
      setIsPlaying(true);
    },
    [playable, unloadSound, getPublicTrackUrl]
  );

  const playAll = useCallback(async () => {
    if (playable.length === 0) {
      Alert.alert("Trống", "Playlist chưa có bài nào.");
      return;
    }
    await playSongAt(0);
  }, [playable.length, playSongAt]);

  const togglePauseResume = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;

    const status = await s.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await s.pauseAsync();
      setIsPlaying(false);
    } else {
      await s.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const removeSong = useCallback(
    async (songId: string) => {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("song_id", songId);

      if (error) {
        Alert.alert("Lỗi", error.message);
        return;
      }

      if (nowSongId === songId) {
        await unloadSound();
        setIsPlaying(false);
        setNowSongId(null);
        nowIndexRef.current = -1;
      }

      await load();
    },
    [playlistId, load, nowSongId, unloadSound]
  );

  const shareSong = useCallback(
    async (song: SongRow) => {
      const url = getPublicTrackUrl(song.file_path);
      try {
        await Share.share({
          message: url
            ? `${song.title} - ${song.artist ?? ""}\n${url}`
            : `${song.title} - ${song.artist ?? ""}`,
        });
      } catch {}
    },
    [getPublicTrackUrl]
  );

  const favoriteSong = useCallback(async (song: SongRow) => {
    Alert.alert("Yêu thích", `Đã đánh dấu yêu thích (demo): ${song.title}`);
  }, []);

  const addToAnotherPlaylist = useCallback((song: SongRow) => {
    router.push({
      pathname: "/(protected)/playlist/pick",
      params: { songId: song.id },
    } as any);
  }, []);

  const openSongMenu = useCallback(
    (song: SongRow) => {
      const options = ["Xóa khỏi playlist", "Yêu thích", "Chia sẻ", "Thêm vào playlist", "Hủy"];
      const cancelButtonIndex = 4;
      const destructiveButtonIndex = 0;

      const onPick = async (idx: number) => {
        if (idx === 0) {
          Alert.alert("Xóa bài", "Bạn muốn xóa bài này khỏi playlist?", [
            { text: "Hủy", style: "cancel" },
            {
              text: "Xóa",
              style: "destructive",
              onPress: async () => {
                await removeSong(song.id);
              },
            },
          ]);
        } else if (idx === 1) {
          await favoriteSong(song);
        } else if (idx === 2) {
          await shareSong(song);
        } else if (idx === 3) {
          addToAnotherPlaylist(song);
        }
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
            title: song.title,
            message: song.artist ?? undefined,
          },
          (buttonIndex) => onPick(buttonIndex)
        );
      } else {
        Alert.alert(song.title, song.artist ?? "", [
          { text: "Xóa khỏi playlist", style: "destructive", onPress: () => onPick(0) },
          { text: "Yêu thích", onPress: () => onPick(1) },
          { text: "Chia sẻ", onPress: () => onPick(2) },
          { text: "Thêm vào playlist", onPress: () => onPick(3) },
          { text: "Hủy", style: "cancel" },
        ]);
      }
    },
    [removeSong, favoriteSong, shareSong, addToAnotherPlaylist]
  );

  const goAddSong = useCallback(() => {
    Alert.alert(
      "Thêm bài",
      "Bạn đang ở màn playlist. Nếu bạn đã có màn chọn bài để thêm vào playlist, hãy điều hướng tới đó.\n\nHiện tại mình giữ nút này để bạn tự nối flow.",
      [{ text: "OK" }]
    );
  }, []);

  const nowPlayingLabel = useMemo(() => {
    if (!nowSongId) return "Chưa phát";
    const current = playable.find((t) => t.song.id === nowSongId)?.song;
    if (!current) return "Chưa phát";
    return `${current.title}${current.artist ? " • " + current.artist : ""}`;
  }, [nowSongId, playable]);

  const loopLabel = useMemo(() => {
    if (loopMode === "one") return "Loop 1";
    if (loopMode === "all") return "Loop";
    return "Loop";
  }, [loopMode]);

  const loopActive = loopMode !== "off";
  const loopIsOne = loopMode === "one";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* HEADER */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.backBtn}>
            <Text style={styles.backIcon}>{"<"}</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{playlistName}</Text>
            <Text style={styles.sub}>
              {playable.length} bài • {nowPlayingLabel}
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={goAddSong} activeOpacity={0.9}>
            <Text style={styles.addBtnText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* CONTROLS */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.playBtn} onPress={playAll} activeOpacity={0.9}>
            <Text style={styles.playBtnText}>▶️ Play all</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: "#111827" }]}
            onPress={togglePauseResume}
            activeOpacity={0.9}
            disabled={!soundRef.current}
          >
            <Text style={styles.playBtnText}>{isPlaying ? "⏸ Pause" : "▶️ Resume"}</Text>
          </TouchableOpacity>

          {/* LOOP BUTTON */}
          <TouchableOpacity
            style={[styles.loopBtn, loopActive ? styles.loopBtnActive : styles.loopBtnOff]}
            onPress={cycleLoopMode}
            activeOpacity={0.9}
          >
            <View style={styles.loopIconWrap}>
              <Text style={[styles.loopIcon, loopActive ? styles.loopIconActive : styles.loopIconOff]}>
                {"🔁"}
              </Text>

              {/* badge "1" khi loop 1 bài */}
              {loopIsOne && (
                <View style={styles.loopBadge}>
                  <Text style={styles.loopBadgeText}>1</Text>
                </View>
              )}
            </View>

            <Text style={[styles.loopText, loopActive ? styles.loopTextActive : styles.loopTextOff]}>
              {loopLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 24 }}>
            <ActivityIndicator />
          </View>
        ) : playable.length === 0 ? (
          <Text style={{ marginTop: 12, color: "#6b7280" }}>
            Playlist chưa có bài nào. Nhấn “+ Thêm” để thêm bài.
          </Text>
        ) : (
          <FlatList
            data={playable}
            keyExtractor={(item) => item.song_id}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            renderItem={({ item, index }) => {
              const s = item.song;
              const active = nowSongId === s.id;

              return (
                <TouchableOpacity
                  style={[styles.row, active && styles.rowActive]}
                  activeOpacity={0.9}
                  onPress={() => playSongAt(index)}
                >
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.rowTitle}>
                      {s.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.rowSub}>
                      {s.artist ?? "Unknown artist"}
                    </Text>
                  </View>

                  {/* nút 3 chấm */}
                  <TouchableOpacity onPress={() => openSongMenu(s)} style={styles.moreBtn} activeOpacity={0.85}>
                    <Text style={styles.moreText}>⋯</Text>
                  </TouchableOpacity>
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
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backIcon: { fontSize: 20, fontWeight: "900", color: "#111827", marginTop: -2 },

  title: { fontSize: 20, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 4, color: "#6b7280", fontWeight: "700" },

  addBtn: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "900" },

  controlsRow: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },

  playBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  playBtnText: { color: "#fff", fontWeight: "900" },

  // Loop button
  loopBtn: {
    width: 86,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  loopBtnOff: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  loopBtnActive: {
    backgroundColor: "#e0ecff",
    borderColor: "#2563eb",
  },
  loopIconWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  loopIcon: { fontSize: 16, fontWeight: "900" },
  loopIconOff: { color: "#111827" },
  loopIconActive: { color: "#2563eb" },
  loopText: { marginTop: 2, fontSize: 12, fontWeight: "900" },
  loopTextOff: { color: "#111827" },
  loopTextActive: { color: "#2563eb" },

  // badge số 1
  loopBadge: {
    position: "absolute",
    right: -10,
    top: -8,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  loopBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  row: {
    marginTop: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowActive: { borderWidth: 2, borderColor: "#2563eb" },
  rowTitle: { fontWeight: "900", color: "#111827" },
  rowSub: { marginTop: 4, color: "#6b7280", fontWeight: "700", fontSize: 12 },

  moreBtn: {
    width: 44,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  moreText: { fontSize: 22, fontWeight: "900", color: "#111827", marginTop: -4 },
});

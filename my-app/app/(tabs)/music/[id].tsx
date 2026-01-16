// app/(tabs)/music/[id].tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Slider from "@react-native-community/slider";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../../lib/supabase";

const BUCKET = "tracks"; // ✅ bucket Public của bạn

type Track = {
  id: string;
  title: string;
  artist: string;
  file_path: string;
  artwork_url?: string | null;
};

type LoopMode = "off" | "one" | "all";

const FAVORITE_KEY = "FAVORITE_SONG_IDS";

function formatTime(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function getFavSet(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(FAVORITE_KEY);
  const arr = raw ? (JSON.parse(raw) as string[]) : [];
  return new Set(arr);
}

async function toggleFav(id: string): Promise<Set<string>> {
  const set = await getFavSet();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  await AsyncStorage.setItem(FAVORITE_KEY, JSON.stringify(Array.from(set)));
  return set;
}

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const soundRef = useRef<Audio.Sound | null>(null);

  // ✅ ref để callback không bị “state cũ”
  const isSeekingRef = useRef(false);
  const shouldPlayAfterSeekRef = useRef(false);

  // ✅ loop mode ref để callback ổn định
  const loopModeRef = useRef<LoopMode>("off");

  const [loading, setLoading] = useState(true);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);

  const current = useMemo(() => tracks[index], [tracks, index]);

  const [playing, setPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekMs, setSeekMs] = useState(0);

  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  // Load favorites local
  useEffect(() => {
    (async () => setFavSet(await getFavSet()))();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Load playlist + open current id
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("songs")
        .select("id,title,artist,file_path,artwork_url,created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.log("Load songs error:", error.message);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as Track[];
      setTracks(list);

      const found = list.findIndex((t) => t.id === id);
      setIndex(found >= 0 ? found : 0);

      setLoading(false);
    };

    load();
  }, [id]);

  // Next/Prev ổn định
  const goNext = () => {
    setIndex((i) => (tracks.length ? (i + 1) % tracks.length : i));
  };

  const goPrev = () => {
    setIndex((i) => (tracks.length ? (i - 1 + tracks.length) % tracks.length : i));
  };

  // Build public URL
  const getPublicUrl = (file_path: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
    return encodeURI(data.publicUrl);
  };

  // Load & autoplay when current changes
  useEffect(() => {
    if (!current) return;

    const loadAndPlay = async () => {
      try {
        // unload old
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        setPositionMs(0);
        setDurationMs(0);
        setPlaying(false);

        const url = getPublicUrl(current.file_path);
        console.log("PLAY URL:", url);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 },
          async (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;

            // ✅ loop all: hết bài -> next
            if (status.didJustFinish) {
              if (loopModeRef.current === "all") {
                goNext();
              } else {
                setPlaying(false);
              }
              return;
            }

            if (!isSeekingRef.current) {
              setPositionMs(status.positionMillis ?? 0);
            }

            setDurationMs(status.durationMillis ?? 0);
            setPlaying(status.isPlaying ?? false);
          }
        );

        soundRef.current = sound;

        // ✅ apply loop-one ngay sau khi load
        await sound.setIsLoopingAsync(loopModeRef.current === "one");
      } catch (e: any) {
        console.log("Player load error:", e?.message ?? e);
      }
    };

    loadAndPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const togglePlay = async () => {
    const s = soundRef.current;
    if (!s) return;

    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;

    if (st.isPlaying) await s.pauseAsync();
    else await s.playAsync();
  };

  // 🔁 OFF -> ONE -> ALL
  const toggleLoop = async () => {
    const next: LoopMode =
      loopModeRef.current === "off" ? "one" : loopModeRef.current === "one" ? "all" : "off";

    loopModeRef.current = next;
    setLoopMode(next);

    const s = soundRef.current;
    if (s) {
      // only loop-one uses native looping
      await s.setIsLoopingAsync(next === "one");
    }
  };

  const onSeekStart = async () => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setSeekMs(positionMs);

    const s = soundRef.current;
    if (!s) return;

    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;

    shouldPlayAfterSeekRef.current = !!st.isPlaying;
    if (st.isPlaying) await s.pauseAsync();
  };

  const onSeekComplete = async (value: number) => {
    const s = soundRef.current;

    isSeekingRef.current = false;
    setIsSeeking(false);

    if (!s) return;
    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;

    await s.setPositionAsync(value);

    if (shouldPlayAfterSeekRef.current) {
      await s.playAsync();
    }
  };

  const onShare = async () => {
    if (!current) return;
    const url = getPublicUrl(current.file_path);
    await Share.share({
      message: `${current.title} - ${current.artist}\n${url}`,
    });
  };

  // ✅ yêu cầu đăng nhập trước khi làm action protected
  const requireLogin = async (redirectPath: string) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.push({ pathname: "/(auth)/login", params: { redirect: redirectPath } } as any);
      return false;
    }
    return true;
  };

  // ✅ THÍCH: nếu chưa login -> bắt login
  const onToggleFavorite = async () => {
    if (!current) return;

    const ok = await requireLogin(`/music/${current.id}`);
    if (!ok) return;

    const next = await toggleFav(current.id);
    setFavSet(next);
  };

  const onAddToPlaylist = async () => {
    if (!current) return;
    const ok = await requireLogin(`/music/${current.id}`);
    if (!ok) return;

    // sang màn chọn playlist (protected)
    router.push({ pathname: "/(protected)/playlist/pick", params: { songId: current.id } } as any);
  };

  if (loading || !current) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: "#6b7280" }}>Đang tải bài hát...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sliderValue = isSeeking ? seekMs : positionMs;
  const isFav = favSet.has(current.id);

  const loopIcon =
    loopMode === "off" ? "repeat-outline" : loopMode === "one" ? "repeat" : "repeat";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.nowPlaying}>Now Playing</Text>

          <TouchableOpacity onPress={onShare} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        {current.artwork_url ? (
          <Image source={{ uri: current.artwork_url }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artPlaceholder]} />
        )}

        {/* Title */}
        <Text numberOfLines={2} style={styles.title}>
          {current.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {current.artist}
        </Text>

        {/* Actions row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onToggleFavorite} activeOpacity={0.9}>
            <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color="#111827" />
            <Text style={styles.actionText}>Yêu thích</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onAddToPlaylist} activeOpacity={0.9}>
            <Ionicons name="add-circle-outline" size={20} color="#111827" />
            <Text style={styles.actionText}>Playlist</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={toggleLoop} activeOpacity={0.9}>
            <Ionicons
              name={loopIcon as any}
              size={18}
              color="#111827"
              style={{ opacity: loopMode === "off" ? 0.7 : 1 }}
            />
            <Text style={styles.actionText}>
              {loopMode === "off" ? "Loop Off" : loopMode === "one" ? "Loop 1" : "Loop All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seek */}
        <View style={styles.seekWrap}>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={Math.max(1, durationMs)}
            value={Math.min(sliderValue, durationMs)}
            onSlidingStart={onSeekStart}
            onValueChange={(v) => setSeekMs(v)}
            onSlidingComplete={onSeekComplete}
            minimumTrackTintColor="#111827"
            maximumTrackTintColor="#e5e7eb"
            thumbTintColor="#111827"
          />

          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(sliderValue)}</Text>
            <Text style={styles.time}>{formatTime(durationMs)}</Text>
          </View>
        </View>

        {/* Controls (icon màu đen) */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.smallBtn} onPress={goPrev} activeOpacity={0.9}>
            <Ionicons name="play-skip-back" size={20} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.9}>
            <Ionicons name={playing ? "pause" : "play"} size={22} color="#111827" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn} onPress={goNext} activeOpacity={0.9}>
            <Ionicons name="play-skip-forward" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          {index + 1}/{tracks.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16, alignItems: "center" },

  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nowPlaying: { fontWeight: "900", color: "#111827" },

  artwork: {
    width: 270,
    height: 270,
    borderRadius: 26,
    marginTop: 22,
  },
  artPlaceholder: { backgroundColor: "#e5e7eb" },

  title: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  artist: { marginTop: 6, color: "#6b7280" },

  actionRow: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { color: "#111827", fontWeight: "800", fontSize: 11 },

  seekWrap: { width: "100%", marginTop: 10 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -6 },
  time: { color: "#6b7280", fontSize: 12, fontWeight: "600" },

  controls: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 18 },
  smallBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  hint: { marginTop: 14, color: "#9ca3af", fontWeight: "700" },
});

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";

type Card = { id: string; title: string; subtitle: string };
type PlaylistRow = { id: string; name: string; created_at?: string };

export default function HomeScreen() {
  const [q, setQ] = useState("");

  const [myPlaylists, setMyPlaylists] = useState<PlaylistRow[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const loadMyPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setMyPlaylists([]);
      setLoadingPlaylists(false);
      return;
    }

    const { data, error } = await supabase
      .from("playlists")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    if (error) console.log(error.message);
    setMyPlaylists((data ?? []) as PlaylistRow[]);
    setLoadingPlaylists(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMyPlaylists();
    }, [loadMyPlaylists])
  );

  const continueList: Card[] = useMemo(
    () => [
      { id: "c1", title: "Daily Mix", subtitle: "20 bài • Chill" },
      { id: "c2", title: "V-Pop Hits", subtitle: "35 bài • Hot" },
      { id: "c3", title: "Workout", subtitle: "15 bài • Energy" },
    ],
    []
  );

  const recommendPlaylists: Card[] = useMemo(
    () => [
      { id: "p1", title: "Top Charts", subtitle: "Bảng xếp hạng" },
      { id: "p2", title: "Lo-fi Night", subtitle: "Ngủ ngon hơn" },
      { id: "p3", title: "Acoustic", subtitle: "Nhẹ nhàng" },
      { id: "p4", title: "K-Pop", subtitle: "Sôi động" },
    ],
    []
  );

  const filteredMyPlaylists = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return myPlaylists;
    return myPlaylists.filter((p) => p.name.toLowerCase().includes(keyword));
  }, [myPlaylists, q]);

  const goCreatePlaylist = useCallback(() => {
    router.push("/(protected)/playlist/create" as any);
  }, []);

  const goPremium = useCallback(() => {
    router.push("/(protected)/premium" as any);
  }, []);

  // ✅ Bấm playlist -> mở màn chi tiết playlist
  const onPressMyPlaylist = useCallback((playlistId: string) => {
    router.push({
      pathname: "/(protected)/playlist/[id]",
      params: { id: playlistId },
    } as any);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.title}>MyMusic</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/(tabs)/music" as any)}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Mở Nhạc</Text>
          </TouchableOpacity>
        </View>

        {/* PRO ACTIONS */}
        <View style={styles.proRow}>
          <ProButton title="Tạo playlist" subtitle="Cần đăng nhập" onPress={goCreatePlaylist} />
          <ProButton title="Gói nâng cao" subtitle="Premium" onPress={goPremium} />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm bài hát, ca sĩ, playlist..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          <QuickButton text="Gần đây" onPress={() => {}} />
          <QuickButton text="Yêu thích" onPress={() => {}} />
          <QuickButton text="Tải xuống" onPress={() => {}} />
        </View>

        {/* CONTINUE */}
        <Text style={styles.sectionTitle}>Tiếp tục nghe</Text>
        <View style={styles.hScroll}>
          {continueList.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.bigCard}
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/music" as any)}
            >
              <View style={styles.bigArtwork} />
              <Text numberOfLines={1} style={styles.cardTitle}>
                {c.title}
              </Text>
              <Text numberOfLines={1} style={styles.cardSub}>
                {c.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PLAYLIST CỦA TÔI */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Playlist của tôi</Text>
          <TouchableOpacity onPress={loadMyPlaylists} activeOpacity={0.8}>
            <Text style={styles.link}>Tải lại</Text>
          </TouchableOpacity>
        </View>

        {loadingPlaylists ? (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator />
          </View>
        ) : filteredMyPlaylists.length === 0 ? (
          <Text style={{ marginTop: 2, marginBottom: 8, color: "#6b7280" }}>
            Bạn chưa có playlist nào.
          </Text>
        ) : (
          <View style={styles.grid}>
            {filteredMyPlaylists.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.gridCard}
                activeOpacity={0.9}
                onPress={() => onPressMyPlaylist(p.id)}
              >
                <View style={styles.gridArtwork} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.cardTitle}>
                    {p.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.cardSub}>
                    Playlist của bạn
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* RECOMMEND */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/music" as any)} activeOpacity={0.8}>
            <Text style={styles.link}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {recommendPlaylists.map((p) => (
            <TouchableOpacity key={p.id} style={styles.gridCard} activeOpacity={0.9}>
              <View style={styles.gridArtwork} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {p.title}
                </Text>
                <Text numberOfLines={1} style={styles.cardSub}>
                  {p.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* BANNER */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bắt đầu nghe từ Supabase</Text>
            <Text style={styles.bannerSub}>
              Tiếp theo mình sẽ nối dữ liệu thật + phát nhạc online.
            </Text>
          </View>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>Soon</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickButton({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.9} onPress={onPress}>
      <Text style={styles.quickText}>{text}</Text>
    </TouchableOpacity>
  );
}

function ProButton({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.proCard} activeOpacity={0.9} onPress={onPress}>
      <Text style={styles.proTitle}>{title}</Text>
      <Text style={styles.proSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  hello: { color: "#6b7280", fontSize: 13 },
  title: { color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 2 },

  primaryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  proRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  proCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
  },
  proTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  proSub: { color: "#cbd5e1", marginTop: 4, fontSize: 12, fontWeight: "700" },

  searchBox: { marginTop: 12, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
  },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  quickText: { color: "#111827", fontWeight: "700", fontSize: 13 },

  sectionHeaderRow: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#111827", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  link: { color: "#2563eb", fontWeight: "700" },

  hScroll: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bigCard: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  bigArtwork: { height: 90, borderRadius: 14, backgroundColor: "#e5e7eb", marginBottom: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  gridCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  gridArtwork: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#e5e7eb" },

  cardTitle: { color: "#111827", fontWeight: "800" },
  cardSub: { color: "#6b7280", marginTop: 2, fontSize: 12 },

  banner: {
    marginTop: 16,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerTitle: { color: "#fff", fontWeight: "900" },
  bannerSub: { color: "#cbd5e1", marginTop: 4, fontSize: 12 },
  bannerPill: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bannerPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});

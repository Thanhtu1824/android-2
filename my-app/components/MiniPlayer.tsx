import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  title: string;
  artist: string;
  onPress?: () => void;
  onToggle?: () => void;
  playing?: boolean;
};

export default function MiniPlayer({
  title,
  artist,
  onPress,
  onToggle,
  playing = false,
}: Props) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.artwork} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{artist}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onToggle} style={styles.btn}>
        <Text style={styles.btnText}>{playing ? "II" : "▶"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  artwork: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#374151" },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  artist: { color: "#cbd5e1", marginTop: 2, fontSize: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

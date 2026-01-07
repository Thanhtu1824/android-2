import { useMemo, useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // chống spam: sau khi gửi, khoá nút 60s
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  const cleanEmail = useMemo(() => email.trim(), [email]);

  const emailError = useMemo(() => {
    if (!cleanEmail) return "Vui lòng nhập email";
    if (!isValidEmail(cleanEmail)) return "Email không hợp lệ";
    return "";
  }, [cleanEmail]);

  const now = Date.now();
  const cooldownLeftSec = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const isCooldown = cooldownLeftSec > 0;

  const isBusy = loading || isCooldown;
  const canSubmit = !emailError && !loading && !isCooldown;

  // ✅ Expo Go: dùng Auth Proxy để Supabase chấp nhận redirect_to
  const redirectTo = useMemo(() => {
    const owner = (Constants.expoConfig as any)?.owner;
    const slug = (Constants.expoConfig as any)?.slug;

    // projectNameForProxy = "owner/slug" nếu có owner; nếu không có owner thì dùng slug
    const projectNameForProxy =
      owner && slug ? `${owner}/${slug}` : slug ? slug : undefined;

    return makeRedirectUri({
      useProxy: true,
      projectNameForProxy,
      path: "reset-password",
    });
  }, []);

  const handleGoHome = () => {
    if (loading) return;
    router.replace("/(tabs)" as any);
  };

  const sendReset = async () => {
    if (loading) return;

    if (emailError) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại email");
      return;
    }

    if (isCooldown) return;

    try {
      setLoading(true);

      // ✅ kiểm tra redirectTo đang gửi lên Supabase
      console.log("RESET redirectTo =", redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      // ✅ Bảo mật: KHÔNG lộ email tồn tại hay không
      // Chỉ show lỗi nếu là lỗi cấu hình/redirect/mạng thật sự.
      if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const isConfigOrNetwork =
          msg.includes("redirect") ||
          msg.includes("network") ||
          msg.includes("fetch") ||
          msg.includes("url") ||
          msg.includes("rate");

        if (isConfigOrNetwork) {
          Alert.alert("Lỗi", error.message);
          return;
        }
      }

      Alert.alert(
        "Thành công",
        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong hộp thư."
      );

      setCooldownUntil(Date.now() + 60_000);

      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.wrap}>
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.8}
          style={styles.backBtn}
          disabled={loading}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Quên mật khẩu</Text>

        <TextInput
          style={[styles.input, !!emailError && email.length > 0 && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="done"
          editable={!loading}
          onSubmitEditing={sendReset}
        />
        {!!emailError && email.length > 0 && <Text style={styles.errorText}>{emailError}</Text>}

        <TouchableOpacity
          style={[styles.btn, (!canSubmit || isBusy) && styles.btnDisabled]}
          onPress={sendReset}
          activeOpacity={0.9}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isCooldown ? `Vui lòng chờ ${cooldownLeftSec}s` : "Gửi yêu cầu"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !loading && router.replace("/(auth)/login" as any)}
          disabled={loading}
        >
          <Text style={[styles.link, loading && styles.linkDisabled]}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  wrap: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 8 },

  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { color: "#2563eb", fontWeight: "900", fontSize: 18 },

  title: { fontSize: 26, fontWeight: "900", color: "#111827", marginTop: 18, marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    color: "#111827",
  },
  inputError: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", marginBottom: 10, fontWeight: "700" },

  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "900" },

  link: { color: "#2563eb", marginTop: 14, fontWeight: "800" },
  linkDisabled: { opacity: 0.6 },
});

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

function validateStrongPassword(pw: string) {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("Tối thiểu 8 ký tự");
  if (!/[a-z]/.test(pw)) errors.push("Có chữ thường");
  if (!/[A-Z]/.test(pw)) errors.push("Có chữ hoa");
  if (!/[0-9]/.test(pw)) errors.push("Có số");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("Có ký tự đặc biệt");
  return errors;
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const confirmRef = useRef<TextInput>(null);

  // ✅ check có session (recovery) không
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !data.session) {
          Alert.alert(
            "Liên kết không hợp lệ",
            "Link đặt lại mật khẩu có thể đã hết hạn hoặc đã được dùng. Vui lòng gửi lại yêu cầu quên mật khẩu."
          );
          router.replace("/(auth)/forgot" as any);
          return;
        }
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const pwRules = useMemo(() => validateStrongPassword(password), [password]);

  const passwordError = useMemo(() => {
    if (password.length === 0) return "Vui lòng nhập mật khẩu mới";
    if (pwRules.length > 0) return "Mật khẩu chưa đủ mạnh";
    return "";
  }, [password, pwRules]);

  const confirmError = useMemo(() => {
    if (confirm.length === 0) return "Vui lòng nhập lại mật khẩu";
    if (confirm !== password) return "Mật khẩu nhập lại không khớp";
    return "";
  }, [confirm, password]);

  const canSubmit = !checking && !loading && !passwordError && !confirmError;

  const handleUpdatePassword = async () => {
    if (!canSubmit) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const msg = (error.message ?? "").toLowerCase();
        const looksExpired =
          msg.includes("expired") ||
          msg.includes("invalid") ||
          msg.includes("session") ||
          msg.includes("token");

        if (looksExpired) {
          Alert.alert(
            "Liên kết hết hạn",
            "Link đặt lại mật khẩu đã hết hạn hoặc đã được dùng. Vui lòng gửi lại yêu cầu quên mật khẩu."
          );
          router.replace("/(auth)/forgot" as any);
          return;
        }

        Alert.alert("Lỗi", error.message);
        return;
      }

      // ✅ sạch session recovery
      await supabase.auth.signOut();

      Alert.alert("Thành công", "Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.");
      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message ?? "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.wrapCenter}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Đặt lại mật khẩu</Text>

        {/* Password */}
        <View style={[styles.inputRow, password.length > 0 && !!passwordError && styles.inputError]}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Mật khẩu mới"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.8}
            disabled={loading}
            style={styles.eyeBtn}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {password.length > 0 && pwRules.length > 0 && (
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Mật khẩu cần:</Text>
            {pwRules.map((r) => (
              <Text key={r} style={styles.ruleItem}>• {r}</Text>
            ))}
          </View>
        )}
        {password.length > 0 && !!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

        {/* Confirm */}
        <View style={[styles.inputRow, confirm.length > 0 && !!confirmError && styles.inputError]}>
          <TextInput
            ref={confirmRef}
            style={styles.inputFlex}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirm}
            value={confirm}
            onChangeText={setConfirm}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleUpdatePassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            activeOpacity={0.8}
            disabled={loading}
            style={styles.eyeBtn}
          >
            <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {confirm.length > 0 && !!confirmError && <Text style={styles.errorText}>{confirmError}</Text>}

        <TouchableOpacity
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleUpdatePassword}
          activeOpacity={0.9}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Cập nhật mật khẩu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  wrap: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 8 },
  wrapCenter: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },

  title: { fontSize: 26, fontWeight: "900", color: "#111827", marginTop: 18, marginBottom: 20 },

  inputRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  inputFlex: { flex: 1, color: "#111827" },

  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },
  eyeText: { fontSize: 18 },

  inputError: { borderColor: "#ef4444" },

  errorText: { color: "#ef4444", marginBottom: 10, fontWeight: "700" },

  rulesBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  rulesTitle: { fontWeight: "900", marginBottom: 6, color: "#111827" },
  ruleItem: { color: "#111827", fontWeight: "600", marginBottom: 2 },

  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "900" },
});

import { useMemo, useRef, useState } from "react";
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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function validateStrongPassword(pw: string) {
  const errors: string[] = [];
  if (pw.length < 8) errors.push("Tối thiểu 8 ký tự");
  if (!/[a-z]/.test(pw)) errors.push("Có chữ thường");
  if (!/[A-Z]/.test(pw)) errors.push("Có chữ hoa");
  if (!/[0-9]/.test(pw)) errors.push("Có số");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("Có ký tự đặc biệt");
  return errors;
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const cleanEmail = useMemo(() => email.trim(), [email]);
  const isBusy = loading;

  const emailError = useMemo(() => {
    if (cleanEmail.length === 0) return "Vui lòng nhập email";
    if (!isValidEmail(cleanEmail)) return "Email không hợp lệ";
    return "";
  }, [cleanEmail]);

  const pwRules = useMemo(() => validateStrongPassword(password), [password]);

  const passwordError = useMemo(() => {
    if (password.length === 0) return "Vui lòng nhập mật khẩu";
    if (pwRules.length > 0) return "Mật khẩu chưa đủ mạnh";
    return "";
  }, [password, pwRules]);

  const confirmError = useMemo(() => {
    if (confirm.length === 0) return "Vui lòng nhập lại mật khẩu";
    if (confirm !== password) return "Mật khẩu nhập lại không khớp";
    return "";
  }, [confirm, password]);

  const canSubmit = !emailError && !passwordError && !confirmError && !isBusy;

  const handleGoHome = () => {
    if (isBusy) return;
    router.replace("/(tabs)" as any);
  };

  const handleRegister = async () => {
    if (isBusy) return;

    if (emailError || passwordError || confirmError) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        Alert.alert("Lỗi đăng ký", error.message);
        return;
      }

      Alert.alert("Thành công", "Kiểm tra email để xác minh tài khoản!");
      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      Alert.alert("Lỗi đăng ký", e?.message ?? "Có lỗi xảy ra");
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
          disabled={isBusy}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Đăng ký</Text>

        {/* Email */}
        <TextInput
          style={[styles.input, !!emailError && email.length > 0 && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          blurOnSubmit={false}
          editable={!isBusy}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        {!!emailError && email.length > 0 && <Text style={styles.errorText}>{emailError}</Text>}

        {/* Password */}
        <View style={[styles.inputRow, password.length > 0 && !!passwordError && styles.inputError]}>
          <TextInput
            ref={passwordRef}
            style={styles.inputFlex}
            placeholder="Mật khẩu"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
            blurOnSubmit={false}
            editable={!isBusy}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.8}
            disabled={isBusy}
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
        {!!passwordError && password.length > 0 && <Text style={styles.errorText}>{passwordError}</Text>}

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
            returnKeyType="done"
            editable={!isBusy}
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm((v) => !v)}
            activeOpacity={0.8}
            disabled={isBusy}
            style={styles.eyeBtn}
          >
            <Ionicons name={showConfirm ? "eye-off" : "eye"} size={20} color="#111827" />
          </TouchableOpacity>
        </View>
        {!!confirmError && confirm.length > 0 && <Text style={styles.errorText}>{confirmError}</Text>}

        <TouchableOpacity
          style={[styles.btn, (!canSubmit || isBusy) && styles.btnDisabled]}
          onPress={handleRegister}
          activeOpacity={0.9}
          disabled={!canSubmit}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Tạo tài khoản</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !isBusy && router.replace("/(auth)/login" as any)}
          disabled={isBusy}
        >
          <Text style={[styles.link, isBusy && styles.linkDisabled]}>
            Đã có tài khoản? Đăng nhập
          </Text>
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

  link: { color: "#2563eb", marginTop: 14, fontWeight: "800" },
  linkDisabled: { opacity: 0.6 },
});

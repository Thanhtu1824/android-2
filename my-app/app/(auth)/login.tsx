import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const redirectTo = makeRedirectUri({});

  const cleanEmail = useMemo(() => email.trim(), [email]);

  const isBusy = loading || googleLoading;

  const emailError = useMemo(() => {
    if (cleanEmail.length === 0) return "Vui lòng nhập email";
    if (!isValidEmail(cleanEmail)) return "Email không hợp lệ";
    return "";
  }, [cleanEmail]);

  const passwordError = useMemo(() => {
    if (password.length === 0) return "Vui lòng nhập mật khẩu";
    if (password.length < 6) return "Mật khẩu ít nhất 6 ký tự";
    return "";
  }, [password]);

  const canSubmit = !emailError && !passwordError && !isBusy;

  const handleGoHome = () => {
    if (isBusy) return;
    router.replace("/(tabs)" as any);
  };

  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);

    const access_token = (params as any)?.access_token;
    const refresh_token = (params as any)?.refresh_token;

    if (!access_token) return;

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
  };

  const handleGoogleLogin = async () => {
    if (isBusy) return;

    try {
      setGoogleLoading(true);

      // Web: cho Supabase tự redirect
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
        return;
      }

      // Native: lấy url rồi mở browser session, xong setSession từ url trả về
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      const res = await WebBrowser.openAuthSessionAsync(data?.url ?? "", redirectTo);

      if (res.type === "success") {
        await createSessionFromUrl(res.url);
        router.replace((redirect as any) ?? "/(tabs)");
      }
      // res.type === 'cancel' => không làm gì cả
    } catch (e: any) {
      Alert.alert("Đăng nhập Google thất bại", e?.message ?? "Có lỗi xảy ra");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (isBusy) return;

    if (emailError || passwordError) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        Alert.alert("Đăng nhập thất bại", error.message);
        return;
      }

      router.replace((redirect as any) ?? "/(tabs)");
    } catch (e: any) {
      Alert.alert("Đăng nhập thất bại", e?.message ?? "Có lỗi xảy ra");
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

        <Text style={styles.title}>Đăng nhập</Text>

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

        <TextInput
          ref={passwordRef}
          style={[styles.input, !!passwordError && password.length > 0 && styles.inputError]}
          placeholder="Mật khẩu"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          editable={!isBusy}
          onSubmitEditing={handleLogin}
        />
        {!!passwordError && password.length > 0 && <Text style={styles.errorText}>{passwordError}</Text>}

        <TouchableOpacity
          style={[styles.btn, (!canSubmit || isBusy) && styles.btnDisabled]}
          onPress={handleLogin}
          activeOpacity={0.9}
          disabled={!canSubmit}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.googleBtn, isBusy && styles.btnDisabled]}
          onPress={handleGoogleLogin}
          activeOpacity={0.9}
          disabled={isBusy}
        >
          {googleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Đăng nhập bằng Google</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !isBusy && router.push("/(auth)/register" as any)}
          disabled={isBusy}
        >
          <Text style={[styles.link, isBusy && styles.linkDisabled]}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !isBusy && router.push("/(auth)/forgot" as any)}
          disabled={isBusy}
        >
          <Text style={[styles.link, isBusy && styles.linkDisabled]}>Quên mật khẩu?</Text>
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

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    marginTop: 18,
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    color: "#111827",
  },
  inputError: {
    borderColor: "#ef4444",
  },

  errorText: {
    color: "#ef4444",
    marginBottom: 10,
    fontWeight: "700",
  },

  btn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },

  btnText: { color: "#fff", fontWeight: "900" },

  googleBtn: { backgroundColor: "#db4437" },

  link: { color: "#2563eb", marginTop: 14, fontWeight: "800" },
  linkDisabled: { opacity: 0.6 },
});

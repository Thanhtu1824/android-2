import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function Forgot() {
  const [email, setEmail] = useState("");

  const sendReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) Alert.alert("Lỗi", error.message);
    else Alert.alert("Thành công", "Email đặt lại mật khẩu đã được gửi!");

    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Quên mật khẩu</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={sendReset}>
          <Text style={styles.buttonText}>Gửi yêu cầu</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.link}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  link: {
    color: "#2563eb",
    marginTop: 16,
  },
});

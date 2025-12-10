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

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
  const cleanEmail = email.trim();

  if (!cleanEmail) {
    Alert.alert("Lỗi", "Vui lòng nhập email");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Lỗi", "Mật khẩu phải ít nhất 6 ký tự");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
  });

  console.log("SIGNUP RESULT:", { data, error });

  if (error) {
    Alert.alert("Lỗi đăng ký", error.message);
  } else {
    Alert.alert("Thành công", "Kiểm tra email để xác minh tài khoản!");
    router.replace("/(auth)/login");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Tạo tài khoản</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 80,
    backgroundColor: "#fff",
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 15,
    color: "#111827",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#2563eb",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500",
  },
});

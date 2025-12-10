import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) alert(error.message);
    else router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng nhập</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/forgot")}>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 80 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20, color: "#000" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 10, marginBottom: 12, color: "#000" },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, marginTop: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { color: "#2563eb", marginTop: 12 },
});

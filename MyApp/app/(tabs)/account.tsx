import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Tài khoản</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Tên</Text>
          <Text style={styles.value}>Người dùng demo</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>user@example.com</Text>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  value: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
});

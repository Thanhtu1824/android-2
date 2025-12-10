import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function CartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Giỏ hàng</Text>
        <Text style={styles.text}>Giỏ hàng của bạn đang trống.</Text>
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
    marginBottom: 8,
  },
  text: {
    color: '#4b5563',
  },
});

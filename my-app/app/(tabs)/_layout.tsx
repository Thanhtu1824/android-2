import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="music" options={{ title: "Nhạc" }} />
      <Tabs.Screen name="account" options={{ title: "Tài khoản" }} />
    </Tabs>
  );
}

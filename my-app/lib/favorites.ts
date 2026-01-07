import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "FAVORITE_SONG_IDS";

export async function getFavoriteSet(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  const arr = raw ? (JSON.parse(raw) as string[]) : [];
  return new Set(arr);
}

export async function toggleFavorite(id: string): Promise<Set<string>> {
  const set = await getFavoriteSet();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  return set;
}

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProtectedLayout() {
  const router = useRouter();
  const segments = useSegments();
  const segRef = useRef<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    segRef.current = segments as string[];
  }, [segments]);

  useEffect(() => {
    let mounted = true;

    const guard = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        const redirect = "/" + segRef.current.join("/");
        router.replace({ pathname: "/(auth)/login", params: { redirect } });
      }
      setReady(true);
    };

    guard();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        const redirect = "/" + segRef.current.join("/");
        router.replace({ pathname: "/(auth)/login", params: { redirect } });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

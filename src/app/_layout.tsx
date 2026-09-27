import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import Onboarding from "@/components/onboarding";
import { FOCUS } from "@/constants/theme";
import { getProfile, subscribeReset, type Profile } from "@/lib/focus-storage";

SplashScreen.preventAutoHideAsync();

const FOCUS_THEME = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: FOCUS.bg,
    card: FOCUS.surface,
    text: FOCUS.text,
    border: FOCUS.border,
    notification: FOCUS.ember,
    primary: FOCUS.ember,
  },
};

export default function RootLayout() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getProfile().then((stored) => {
      if (cancelled) return;
      setProfile(stored);
      setLoading(false);
    });
    const unsubscribe = subscribeReset(() => setProfile(null));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider value={FOCUS_THEME}>
      <StatusBar style="light" />
      <AnimatedSplashOverlay />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: FOCUS.bg }}>
          <ActivityIndicator color={FOCUS.ember} />
        </View>
      ) : profile ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: FOCUS.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      ) : (
        <Onboarding onFinished={setProfile} />
      )}
    </ThemeProvider>
  );
}

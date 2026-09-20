import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Onboarding, UserProfile } from "@/components/onboarding";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("pulse-profile").then((stored) => {
      if (stored) setProfile(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  const finishOnboarding = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    AsyncStorage.setItem("pulse-profile", JSON.stringify(nextProfile));
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F2F2F7",
          }}
        >
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : profile ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout" options={{ presentation: "card" }} />
        </Stack>
      ) : (
        <Onboarding onComplete={finishOnboarding} />
      )}
    </ThemeProvider>
  );
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from "expo-router";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Onboarding, UserProfile } from "@/components/onboarding";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("pulse-profile").then((stored) => {
      if (stored) setProfile(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          // Outfit and Work Sans from Google Fonts
          Outfit: require("@expo-google-fonts/outfit"),
          "Work Sans": require("@expo-google-fonts/work-sans"),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Failed to load custom fonts", e);
        // Fallback to system fonts
        setFontsLoaded(true);
      }
    })();
  }, []);

  if (loading || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F0F23",
        }}
      >
        <ActivityIndicator color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {profile ? (
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#8B5CF6",
            tabBarInactiveTintColor: "#94A3B8",
            tabBarStyle: {
              backgroundColor: "#1A1A2E",
              borderTopWidth: 1,
              borderTopColor: "#374151",
            },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Inicio" }} />
          <Tabs.Screen name="calculator" options={{ title: "Dominante" }} />
          <Tabs.Screen name="coach" options={{ title: "Racha" }} />
          <Tabs.Screen name="explore" options={{ title: "Espejo" }} />
          <Tabs.Screen name="plans" options={{ title: "Confrontación" }} />
        </Tabs>
      ) : (
        <Onboarding onComplete={(nextProfile) => {
          setProfile(nextProfile);
          AsyncStorage.setItem("pulse-profile", JSON.stringify(nextProfile));
        }}/>
      )}
    </ThemeProvider>
  );
}
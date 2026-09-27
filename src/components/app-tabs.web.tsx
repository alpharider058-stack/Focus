import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FOCUS, MaxContentWidth, Spacing } from "@/constants/theme";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href={"/" as never} asChild>
            <TabButton>Hoy</TabButton>
          </TabTrigger>
          <TabTrigger name="discipline" href={"/discipline" as never} asChild>
            <TabButton>Disciplina</TabButton>
          </TabTrigger>
          <TabTrigger name="focus" href={"/focus" as never} asChild>
            <TabButton>Enfoque</TabButton>
          </TabTrigger>
          <TabTrigger name="ego" href={"/ego" as never} asChild>
            <TabButton>Ego</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href={"/profile" as never} asChild>
            <TabButton>Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>FOCUS</Text>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    backgroundColor: FOCUS.surface,
    borderWidth: 1,
    borderColor: FOCUS.border,
  },
  brandText: { marginRight: "auto", color: FOCUS.ember, fontWeight: "900", letterSpacing: 3 },
  pressed: { opacity: 0.7 },
  tabButtonView: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Spacing.three },
  tabButtonActive: { backgroundColor: `${FOCUS.ember}22` },
  tabText: { color: FOCUS.textMuted, fontSize: 14, fontWeight: "700" },
  tabTextActive: { color: FOCUS.ember },
});

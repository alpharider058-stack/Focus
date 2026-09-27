import { NativeTabs } from "expo-router/unstable-native-tabs";

import { FOCUS } from "@/constants/theme";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={FOCUS.surface}
      indicatorColor={FOCUS.ember}
      labelStyle={{ selected: { color: FOCUS.ember, fontWeight: "700" } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/home.png")} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discipline">
        <NativeTabs.Trigger.Label>Disciplina</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/explore.png")} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="focus">
        <NativeTabs.Trigger.Label>Enfoque</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/home.png")} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ego">
        <NativeTabs.Trigger.Label>Ego</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/explore.png")} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/home.png")} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

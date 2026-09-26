import { View, Text } from "react-native";

export default function PlansTab() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F0F23" }}>
      <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "600" }}>
        Modo Confrontación
      </Text>
      <Text style={{ color: "#94A3B8", marginTop: 8 }}>
        Visualiza y supera tus rivales y retos
      </Text>
    </View>
  );
}
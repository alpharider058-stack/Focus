import { View, Text } from "react-native";

export default function CoachTab() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F0F23" }}>
      <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "600" }}>
        Racha de Victorias
      </Text>
      <Text style={{ color: "#94A3B8", marginTop: 8 }}>
        Registra tus victorias diarias y mantén tu racha
      </Text>
    </View>
  );
}
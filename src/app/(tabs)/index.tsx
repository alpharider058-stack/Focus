import { View, Text } from "react-native";

export default function HomeTab() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F0F23" }}>
      <Text style={{ color: "#F8FAFC", fontSize: 24, fontWeight: "600" }}>
        Bienvenido a Focus
      </Text>
      <Text style={{ color: "#94A3B8", marginTop: 12 }}>
        Selecciona una función desde la barra inferior
      </Text>
    </View>
  );
}
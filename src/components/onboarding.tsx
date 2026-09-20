import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
    FadeIn,
    FadeInRight
} from "react-native-reanimated";

export type UserProfile = {
  name: string;
  goal: string;
  level: string;
  days: string;
};

type Props = { onComplete: (profile: UserProfile) => void };
const blue = "#007AFF";
const options = {
  goal: ["Ganar fuerza", "Ganar musculo", "Perder grasa", "Moverme mejor"],
  level: ["Estoy empezando", "Intermedio", "Avanzado"],
  days: ["2 dias", "3 dias", "4 dias", "5+ dias"],
};

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [days, setDays] = useState("");
  const values = [name, goal, level, days];
  const labels = [
    "Como te llamas?",
    "Que quieres conseguir?",
    "Cual es tu nivel?",
    "Cuantos dias entrenas?",
  ];
  const canContinue = values[step].trim().length > 0;

  const next = () => {
    if (!canContinue) return;
    if (step === 3) onComplete({ name: name.trim(), goal, level, days });
    else setStep((current) => current + 1);
  };

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>P</Text>
        </View>
        <Text style={styles.brandName}>PULSE</Text>
      </Animated.View>
      <View style={styles.progress}>
        <View
          style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]}
        />
      </View>
      <Animated.View
        key={step}
        entering={FadeInRight.duration(350)}
        style={styles.panel}
      >
        <Text style={styles.step}>PASO {step + 1} DE 4</Text>
        <Text style={styles.title}>{labels[step]}</Text>
        <Text style={styles.subtitle}>
          Personalizaremos tu experiencia con respuestas simples.
        </Text>
        {step === 0 ? (
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#8D8D96"
            style={styles.input}
          />
        ) : (
          <View style={styles.options}>
            {options[step === 1 ? "goal" : step === 2 ? "level" : "days"].map(
              (option) => {
                const selected = values[step] === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      step === 1
                        ? setGoal(option)
                        : step === 2
                          ? setLevel(option)
                          : setDays(option)
                    }
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    />
                  </Pressable>
                );
              },
            )}
          </View>
        )}
      </Animated.View>
      <Pressable
        disabled={!canContinue}
        onPress={next}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {step === 3 ? "Empezar" : "Continuar"}
        </Text>
        <Text style={styles.arrow}>-&gt;</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    padding: 24,
    justifyContent: "center",
  },
  brand: { alignItems: "center", marginBottom: 44 },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#111113",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandMarkText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  brandName: {
    color: "#111113",
    fontSize: 13,
    letterSpacing: 4,
    fontWeight: "800",
  },
  progress: {
    height: 5,
    backgroundColor: "#DADAE0",
    borderRadius: 4,
    marginBottom: 40,
  },
  progressFill: { height: "100%", backgroundColor: blue, borderRadius: 4 },
  panel: { minHeight: 255 },
  step: {
    color: "#777782",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  title: { color: "#111113", fontSize: 32, lineHeight: 38, fontWeight: "700" },
  subtitle: {
    color: "#777782",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
    marginBottom: 26,
  },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    color: "#111113",
    fontSize: 17,
  },
  options: { gap: 10 },
  option: {
    height: 52,
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#fff",
  },
  optionSelected: { borderColor: blue, backgroundColor: "#E8F2FF" },
  optionText: { color: "#111113", fontSize: 15, fontWeight: "600" },
  optionTextSelected: { color: blue },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C7C7CF",
  },
  radioSelected: { borderColor: blue, backgroundColor: blue },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 26,
  },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  arrow: { color: "#fff", fontSize: 19 },
});

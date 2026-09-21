import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { readTrainingLogs } from "@/lib/fitness-storage";

const COLORS = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  line: "#E6E6EB",
  red: "#FF3B30",
};
const goals = [
  "Ganar fuerza",
  "Ganar musculo",
  "Perder grasa",
  "Moverme mejor",
];
const levels = ["Estoy empezando", "Intermedio", "Avanzado"];
const weekDays = [
  { key: "1", label: "L" },
  { key: "2", label: "M" },
  { key: "3", label: "X" },
  { key: "4", label: "J" },
  { key: "5", label: "V" },
  { key: "6", label: "S" },
  { key: "0", label: "D" },
];
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  signal: AbortSignal,
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortRequest = () => controller.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
      if (signal.aborted || attempt === MAX_RETRIES) throw error;
    }
  }
  throw new Error("No se pudo conectar con el servidor");
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const [selectedGoals, setSelectedGoals] = useState([goals[0]]);
  const [level, setLevel] = useState(levels[0]);
  const [selectedDays, setSelectedDays] = useState(["1", "3", "5"]);
  const [exerciseCount, setExerciseCount] = useState("5");
  const [equipment, setEquipment] = useState("Gimnasio completo");
  const [limitations, setLimitations] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [adaptiveAdvice, setAdaptiveAdvice] = useState("");
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    readTrainingLogs().then((logs) => {
      const latest = logs.find(
        (log) => log.averageRpe !== undefined || log.averageRir !== undefined,
      );
      if (!latest) return;
      if ((latest.averageRir ?? 2) >= 3 || (latest.averageRpe ?? 8) <= 7) {
        setAdaptiveAdvice(
          "Tu última sesión fue controlada. Prueba a subir un 2,5-5% la carga.",
        );
      } else if (
        (latest.averageRpe ?? 8) >= 9.5 ||
        (latest.averageRir ?? 2) <= 0
      ) {
        setAdaptiveAdvice(
          "Tu última sesión fue muy exigente. Mantén o reduce un 5% la carga.",
        );
      } else {
        setAdaptiveAdvice(
          "Tu carga está bien ajustada. Mantén el peso y busca una repetición extra.",
        );
      }
    });
  }, []);

  const generate = async () => {
    const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
    const endpoint =
      process.env.EXPO_PUBLIC_AI_PROXY_URL ||
      (expoHost ? `http://${expoHost}:8787` : "http://192.168.1.130:8787");
    setLoading(true);
    setMessage("");
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const profile = await AsyncStorage.getItem("pulse-profile");
      const response = await fetchWithRetry(
        `${endpoint}/api/coach`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: profile ? JSON.parse(profile) : {},
            goals: selectedGoals,
            level,
            days: selectedDays,
            exerciseCount: Math.min(
              Math.max(Number.parseInt(exerciseCount, 10) || 5, 1),
              8,
            ),
            equipment,
            limitations,
          }),
        },
        controller.signal,
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            `El servidor respondió con error (${response.status})`,
        );
      const routine = result.routine;
      const requestedExerciseCount = Math.min(
        Math.max(Number.parseInt(exerciseCount, 10) || 5, 1),
        8,
      );
      const routineRecord = {
        id: `routine-ai-${Date.now()}`,
        name: routine.name,
        exerciseIds: [],
        updatedAt: Date.now(),
        aiExercises: routine.exercises.slice(0, requestedExerciseCount),
      };
      const stored = await AsyncStorage.getItem("pulse-routines");
      const routines = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem(
        "pulse-routines",
        JSON.stringify([routineRecord, ...routines]),
      );
      await AsyncStorage.setItem("pulse-routine", routine.name);
      await AsyncStorage.setItem(
        "pulse-plan",
        JSON.stringify(
          Object.fromEntries(
            selectedDays.map((day) => [day, routineRecord.id]),
          ),
        ),
      );
      setMessage(`Listo: ${routine.name} se ha añadido a Rutinas y Plan.`);
    } catch (error) {
      if (controller.signal.aborted) return;
      const friendlyMessage =
        error instanceof DOMException && error.name === "AbortError"
          ? "La solicitud tardó demasiado. Comprueba tu conexión e inténtalo de nuevo."
          : "Sin conexión a Internet. Comprueba tu red e inténtalo de nuevo.";
      setMessage(friendlyMessage);
      Alert.alert("No se pudo generar el plan", friendlyMessage);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text style={styles.eyebrow}>PULSE COACH</Text>
        <Text style={styles.title}>Tu rutina, hecha para ti</Text>
        <Text style={styles.subtitle}>
          Responde unas preguntas y la IA preparará una rutina y una semana de
          entrenamiento.
        </Text>
        {adaptiveAdvice ? (
          <View style={styles.adaptiveCard}>
            <Text style={styles.adaptiveLabel}>AJUSTE ADAPTATIVO</Text>
            <Text style={styles.adaptiveText}>{adaptiveAdvice}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>Objetivos (puedes elegir varios)</Text>
        <View style={styles.options}>
          {goals.map((item) => (
            <Option
              key={item}
              value={item}
              selected={selectedGoals.includes(item)}
              onPress={() =>
                setSelectedGoals((current) =>
                  current.includes(item)
                    ? current.filter((goal) => goal !== item)
                    : [...current, item],
                )
              }
            />
          ))}
        </View>
        <Text style={styles.label}>Nivel</Text>
        <View style={styles.options}>
          {levels.map((item) => (
            <Option
              key={item}
              value={item}
              selected={level === item}
              onPress={() => setLevel(item)}
            />
          ))}
        </View>
        <Text style={styles.label}>Días de entrenamiento</Text>
        <View style={styles.days}>
          {weekDays.map((day) => (
            <Pressable
              key={day.key}
              onPress={() =>
                setSelectedDays((current) =>
                  current.includes(day.key)
                    ? current.filter((item) => item !== day.key)
                    : [...current, day.key],
                )
              }
              style={[
                styles.day,
                selectedDays.includes(day.key) && styles.daySelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDays.includes(day.key) && styles.dayTextSelected,
                ]}
              >
                {day.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Ejercicios por sesión</Text>
        <TextInput
          value={exerciseCount}
          onChangeText={setExerciseCount}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="5"
          placeholderTextColor={COLORS.secondary}
        />
        <Text style={styles.label}>Equipamiento disponible</Text>
        <TextInput
          value={equipment}
          onChangeText={setEquipment}
          style={styles.input}
          placeholder="Gimnasio, casa..."
          placeholderTextColor={COLORS.secondary}
        />
        <Text style={styles.label}>Lesiones o limitaciones</Text>
        <TextInput
          value={limitations}
          onChangeText={setLimitations}
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="Escribe ninguna si no aplica"
          placeholderTextColor={COLORS.secondary}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable
          onPress={generate}
          disabled={loading}
          style={[styles.button, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generar mi plan</Text>
          )}
        </Pressable>
        <Text style={styles.disclaimer}>
          La IA no sustituye el consejo de un profesional sanitario. Si tienes
          dolor o una lesión, consulta antes de entrenar.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

function Option({
  value,
  selected,
  onPress,
}: {
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {value}
      </Text>
      <View style={[styles.radio, selected && styles.radioSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    paddingHorizontal: 20,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: COLORS.ink, fontSize: 32, fontWeight: "700", marginTop: 6 },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 22,
  },
  label: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  options: { gap: 8 },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 8,
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: COLORS.blue },
  dayText: { color: COLORS.secondary, fontWeight: "800" },
  dayTextSelected: { color: "#fff" },
  option: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.card,
    minHeight: 48,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionSelected: { backgroundColor: "#E8F2FF", borderColor: COLORS.blue },
  optionText: { color: COLORS.ink, fontSize: 14, fontWeight: "600" },
  optionTextSelected: { color: COLORS.blue },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#C7C7CF",
  },
  radioSelected: { borderColor: COLORS.blue, backgroundColor: COLORS.blue },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 15,
    color: COLORS.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 82, paddingTop: 14, textAlignVertical: "top" },
  message: {
    color: COLORS.ink,
    backgroundColor: "#EAF8EE",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    lineHeight: 19,
  },
  adaptiveCard: {
    backgroundColor: "#EAF8EE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  adaptiveLabel: {
    color: "#248A3D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  adaptiveText: {
    color: COLORS.ink,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  button: {
    minHeight: 52,
    backgroundColor: COLORS.blue,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  disabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disclaimer: {
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    marginBottom: 10,
  },
});

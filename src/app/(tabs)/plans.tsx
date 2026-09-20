import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  line: "#E6E6EB",
};
const DAYS = [
  { key: "1", label: "L", name: "Lunes" },
  { key: "2", label: "M", name: "Martes" },
  { key: "3", label: "X", name: "Miercoles" },
  { key: "4", label: "J", name: "Jueves" },
  { key: "5", label: "V", name: "Viernes" },
  { key: "6", label: "S", name: "Sabado" },
  { key: "0", label: "D", name: "Domingo" },
];
type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  aiExercises?: unknown[];
};

type TrainingPlan = Record<string, string>;

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [plan, setPlan] = useState<TrainingPlan>({});
  const [selectedDay, setSelectedDay] = useState(String(new Date().getDay()));
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        AsyncStorage.getItem("pulse-routines"),
        AsyncStorage.getItem("pulse-plan"),
      ]).then(([storedRoutines, storedPlan]) => {
        if (!active) return;
        setRoutines(storedRoutines ? JSON.parse(storedRoutines) : []);
        setPlan(storedPlan ? JSON.parse(storedPlan) : {});
      });
      return () => {
        active = false;
      };
    }, []),
  );
  const assign = (routineId: string | null) => {
    const next = { ...plan };
    if (routineId) next[selectedDay] = routineId;
    else delete next[selectedDay];
    setPlan(next);
    AsyncStorage.setItem("pulse-plan", JSON.stringify(next));
    if (routineId) {
      const routine = routines.find((item) => item.id === routineId);
      if (routine) {
        AsyncStorage.setItem("pulse-routine", routine.name);
        AsyncStorage.setItem(
          "pulse-exercises",
          JSON.stringify(routine.exerciseIds),
        );
      }
    }
  };
  const todayRoutine = plan[String(new Date().getDay())]
    ? routines.find((item) => item.id === plan[String(new Date().getDay())])
    : null;
  const currentRoutine = plan[selectedDay]
    ? routines.find((item) => item.id === plan[selectedDay])
    : null;
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={styles.eyebrow}>ORGANIZA TU SEMANA</Text>
          <Text style={styles.title}>Plan</Text>
          <Text style={styles.subtitle}>
            Elige qué días entrenas y asigna una rutina.
          </Text>
        </Animated.View>
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>HOY</Text>
          <Text style={styles.todayTitle}>
            {todayRoutine ? todayRoutine.name : "Día de descanso"}
          </Text>
          <Text style={styles.todayDetail}>
            {todayRoutine
              ? "Tu rutina está lista para empezar desde Inicio."
              : "Puedes descansar o asignar una sesión a este día."}
          </Text>
        </View>
        <Pressable
          style={styles.aiButton}
          onPress={() => router.push("/coach")}
        >
          <View>
            <Text style={styles.aiTitle}>Crear o sustituir plan con IA</Text>
            <Text style={styles.aiDetail}>
              Elige objetivos y días de entrenamiento
            </Text>
          </View>
          <Text style={styles.aiArrow}>-&gt;</Text>
        </Pressable>
        <Text style={styles.sectionLabel}>Tu semana</Text>
        <View style={styles.daysRow}>
          {DAYS.map((day) => (
            <Pressable
              key={day.key}
              onPress={() => setSelectedDay(day.key)}
              style={[
                styles.day,
                selectedDay === day.key && styles.daySelected,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  selectedDay === day.key && styles.dayLabelSelected,
                ]}
              >
                {day.label}
              </Text>
              <View
                style={[styles.dayDot, plan[day.key] && styles.dayDotActive]}
              />
            </Pressable>
          ))}
        </View>
        <View style={styles.selectedHeader}>
          <View>
            <Text style={styles.sectionLabel}>
              {DAYS.find((day) => day.key === selectedDay)?.name}
            </Text>
            <Text style={styles.assignment}>
              {currentRoutine ? currentRoutine.name : "Descanso"}
            </Text>
          </View>
          {currentRoutine && (
            <Pressable onPress={() => assign(null)}>
              <Text style={styles.clear}>Quitar</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.helper}>Selecciona una rutina para este día</Text>
        {routines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Primero crea una rutina</Text>
            <Text style={styles.emptyDetail}>
              Ve a Rutinas y crea tu primera sesión.
            </Text>
          </View>
        ) : (
          routines.map((routine) => (
            <Pressable
              key={routine.id}
              onPress={() => assign(routine.id)}
              style={[
                styles.routine,
                currentRoutine?.id === routine.id && styles.routineActive,
              ]}
            >
              <View
                style={[
                  styles.icon,
                  currentRoutine?.id === routine.id && styles.iconActive,
                ]}
              >
                <Text
                  style={[
                    styles.iconText,
                    currentRoutine?.id === routine.id && styles.iconTextActive,
                  ]}
                >
                  {routine.exerciseIds.length ||
                    routine.aiExercises?.length ||
                    0}
                </Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.meta}>
                  {routine.exerciseIds.length ||
                    routine.aiExercises?.length ||
                    0}{" "}
                  ejercicios
                </Text>
              </View>
              <Text style={styles.radio}>
                {currentRoutine?.id === routine.id ? "OK" : "+"}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { color: COLORS.ink, fontSize: 34, fontWeight: "700", marginTop: 5 },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  todayCard: {
    backgroundColor: COLORS.ink,
    borderRadius: 22,
    padding: 20,
    marginBottom: 26,
  },
  todayLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  todayTitle: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 14 },
  todayDetail: { color: "#A5A5AE", fontSize: 13, lineHeight: 19, marginTop: 6 },
  aiButton: {
    backgroundColor: "#E8F2FF",
    borderRadius: 17,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  aiTitle: { color: COLORS.blue, fontSize: 15, fontWeight: "700" },
  aiDetail: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  aiArrow: { color: COLORS.blue, fontSize: 20 },
  sectionLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  daysRow: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 26,
  },
  day: {
    width: 38,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  daySelected: { backgroundColor: COLORS.blue },
  dayLabel: { color: COLORS.secondary, fontWeight: "800", fontSize: 14 },
  dayLabelSelected: { color: "#fff" },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D2D2D8",
    marginTop: 7,
  },
  dayDotActive: { backgroundColor: COLORS.green },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignment: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: "700",
    marginTop: 5,
  },
  clear: { color: "#FF3B30", fontSize: 13, fontWeight: "700" },
  helper: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 7,
    marginBottom: 12,
  },
  routine: {
    backgroundColor: COLORS.card,
    borderRadius: 17,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  routineActive: { borderColor: COLORS.green, backgroundColor: "#F5FFF7" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: { backgroundColor: COLORS.green },
  iconText: { color: COLORS.blue, fontWeight: "800" },
  iconTextActive: { color: "#fff" },
  copy: { flex: 1, marginLeft: 12 },
  routineName: { color: COLORS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  radio: { color: COLORS.blue, fontWeight: "800", fontSize: 14 },
  empty: { backgroundColor: COLORS.card, borderRadius: 17, padding: 18 },
  emptyTitle: { color: COLORS.ink, fontWeight: "700", fontSize: 16 },
  emptyDetail: { color: COLORS.secondary, fontSize: 13, marginTop: 5 },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getWeeklySummary, readTrainingLogs } from "@/lib/fitness-storage";

const COLORS = {
  background: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  purple: "#AF52DE",
  line: "#E6E6EB",
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profileName, setProfileName] = useState("tu progreso");
  const [todayPlanRoutine, setTodayPlanRoutine] = useState("");
  const [todayRoutineId, setTodayRoutineId] = useState<string | null>(null);
  const [todayRoutineCompleted, setTodayRoutineCompleted] = useState(false);
  const [summary, setSummary] = useState(() => getWeeklySummary([]));
  const progress = useSharedValue(0);

  const loadRoutineData = () =>
    Promise.all([
      AsyncStorage.getItem("pulse-profile"),
      AsyncStorage.getItem("pulse-plan"),
      AsyncStorage.getItem("pulse-routines"),
      readTrainingLogs(),
    ]).then(([profile, storedPlan, storedRoutines, logs]) => {
      if (profile) setProfileName(JSON.parse(profile).name);
      if (storedPlan && storedRoutines) {
        const plan = JSON.parse(storedPlan) as Record<string, string>;
        const routines = JSON.parse(storedRoutines) as Array<{
          id: string;
          name: string;
        }>;
        const assigned = routines.find(
          (item) => item.id === plan[String(new Date().getDay())],
        );
        setTodayPlanRoutine(assigned?.name ?? "");
        setTodayRoutineId(assigned?.id ?? null);
        setTodayRoutineCompleted(
          Boolean(
            assigned &&
            logs.some((log) => {
              const isSameDay =
                new Date(log.date).toLocaleDateString("es-ES") ===
                new Date().toLocaleDateString("es-ES");
              const isSameRoutine = log.routineId
                ? log.routineId === assigned.id
                : log.routineName === assigned.name;
              return isSameDay && isSameRoutine;
            }),
          ),
        );
      } else {
        setTodayPlanRoutine("");
        setTodayRoutineId(null);
        setTodayRoutineCompleted(false);
      }
      setSummary(getWeeklySummary(logs));
    });
  useFocusEffect(() => {
    loadRoutineData();
  });

  useEffect(() => {
    progress.value = withTiming(summary.sets > 0 ? 1 : 0, { duration: 600 });
  }, [summary.sets, progress]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const openTodayWorkout = () => {
    if (todayRoutineId) {
      router.push(
        `/workout?routineId=${encodeURIComponent(todayRoutineId)}` as `/workout?${string}`,
      );
      return;
    }
    router.push("/workout");
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View>
            <Text style={styles.eyebrow}>
              {new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
                .format(new Date())
                .toUpperCase()}
            </Text>
            <Text style={styles.title}>Hola, {profileName}</Text>
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/explore")}
          >
            <Text style={styles.avatarText}>AR</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.heroCard}
        >
          <View style={styles.heroTopline}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>HOY</Text>
            </View>
            <Text style={styles.heroMeta}>
              {todayPlanRoutine
                ? "ENTRENAMIENTO PROGRAMADO"
                : "DESCANSO PROGRAMADO"}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {todayPlanRoutine || "Día de descanso"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {todayPlanRoutine
              ? `${todayPlanRoutine} · ${summary.sets} series esta semana`
              : "Tu plan no tiene rutina para hoy"}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              todayPlanRoutine ? openTodayWorkout() : router.push("/plans")
            }
          >
            <Text style={styles.primaryButtonText}>
              {todayPlanRoutine
                ? todayRoutineCompleted
                  ? "Repetir rutina"
                  : "Comenzar entrenamiento"
                : "Ver mi plan"}
            </Text>
            <Text style={styles.buttonArrow}>-&gt;</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu resumen</Text>
          <Text style={styles.sectionLink}>Esta semana</Text>
        </View>
        <View style={styles.metricsGrid}>
          {[
            {
              label: "Volumen",
              value: summary.volume.toLocaleString("es-ES"),
              unit: "kg",
              color: COLORS.blue,
            },
            {
              label: "Series",
              value: String(summary.sets),
              unit: "completadas",
              color: COLORS.green,
            },
            {
              label: "Tiempo",
              value: String(summary.minutes),
              unit: "minutos",
              color: COLORS.orange,
            },
          ].map((metric, index) => (
            <Animated.View
              key={metric.label}
              entering={FadeInRight.delay(150 + index * 80).duration(450)}
              style={styles.metricCard}
            >
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: `${metric.color}18` },
                ]}
              >
                <View
                  style={[styles.metricDot, { backgroundColor: metric.color }]}
                />
              </View>
              <Text style={styles.metricValue}>
                {metric.value}
                <Text style={styles.metricUnit}> {metric.unit}</Text>
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consistencia</Text>
          <Text style={styles.sectionLink}>Ver analiticas</Text>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartSummary}>
            <Text style={styles.chartValue}>{summary.activeDays} de 7</Text>
            <Text style={styles.chartHint}>dias activos</Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>
                {summary.activeDays ? "En marcha" : "Empieza hoy"}
              </Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
              <View key={day} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: summary.days[index] ? 54 : 10,
                      backgroundColor: summary.days[index]
                        ? COLORS.green
                        : "#D8E8FA",
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: 20,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.secondary,
    marginBottom: 5,
  },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "700", color: COLORS.ink },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  heroCard: {
    backgroundColor: COLORS.ink,
    borderRadius: 24,
    padding: 22,
    marginBottom: 26,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#2B2B30",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroMeta: { color: "#A5A5AE", fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 20 },
  heroSubtitle: { color: "#A5A5AE", marginTop: 5, fontSize: 13 },
  progressTrack: {
    height: 6,
    backgroundColor: "#36363D",
    borderRadius: 4,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 16,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  buttonArrow: { color: "#fff", fontSize: 18 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 2,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  sectionLink: { fontSize: 13, fontWeight: "600", color: COLORS.blue },
  metricsGrid: { flexDirection: "row", gap: 10, marginBottom: 26 },
  metricCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    flex: 1,
    minHeight: 124,
    justifyContent: "space-between",
  },
  metricIcon: {
    height: 30,
    width: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricDot: { width: 9, height: 9, borderRadius: 5 },
  metricValue: { fontSize: 21, fontWeight: "700", color: COLORS.ink },
  metricUnit: { fontSize: 11, fontWeight: "500", color: COLORS.secondary },
  metricLabel: { fontSize: 12, color: COLORS.secondary },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },
  chartSummary: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  chartValue: { fontSize: 25, fontWeight: "700", color: COLORS.ink },
  chartHint: { fontSize: 13, color: COLORS.secondary },
  streakPill: {
    backgroundColor: "#EAF8EE",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: "auto",
  },
  streakText: { color: "#248A3D", fontSize: 11, fontWeight: "700" },
  chartBars: {
    height: 112,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flex: 1,
  },
  bar: { width: 18, borderRadius: 8 },
  barLabel: { color: COLORS.secondary, fontSize: 11 },
  routineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F1EAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  routineIconText: { color: COLORS.purple, fontWeight: "800", fontSize: 13 },
  routineIconCompleted: { backgroundColor: "#EAF8EE" },
  repeatButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F2FF",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 10,
  },
  repeatButtonText: { color: COLORS.blue, fontSize: 12, fontWeight: "700" },
  routineCopy: { flex: 1, marginLeft: 13 },
  routineTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  routineDetail: { marginTop: 4, fontSize: 12, color: COLORS.secondary },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 10,
  },
  emptyTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "700" },
  emptyDetail: { color: COLORS.secondary, fontSize: 13, marginTop: 5 },
  chevron: { color: "#B8B8C0", fontSize: 27, fontWeight: "300" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 42,
  },
  sheetSmall: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C5C5CC",
    marginBottom: 22,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetEyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sheetTitle: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 22,
  },
  closeButton: { color: COLORS.blue, fontSize: 14, fontWeight: "600" },
  sheetSubtitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  setRow: {
    minHeight: 58,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#C9C9D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  check: { color: "#fff", fontSize: 15, fontWeight: "800" },
  setText: { color: COLORS.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  setTextDone: { color: COLORS.secondary, textDecorationLine: "line-through" },
  setValue: { color: COLORS.secondary, fontSize: 13 },
  restBox: {
    backgroundColor: "#FFF4E5",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  restLabel: {
    color: "#A66100",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  restTime: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  restAction: { color: "#A66100", fontWeight: "700", fontSize: 14 },
  finishButton: {
    minHeight: 52,
    backgroundColor: COLORS.green,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  finishButtonDisabled: { opacity: 0.4 },
  finishButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: 2,
  },
  cancelText: {
    color: COLORS.secondary,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 17,
  },
});

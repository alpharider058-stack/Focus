import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInRight,
    Layout,
    ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EXERCISES } from "@/data/exercises";
import { saveTrainingLog } from "@/lib/fitness-storage";
import {
    getRoutineActivity,
    type RoutineActivityProps,
} from "@/lib/routine-live-activity";
import type { LiveActivity } from "expo-widgets";

const COLORS = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  line: "#E6E6EB",
};
type ExerciseItem = {
  name: string;
  muscle?: string;
  equipment?: string;
  sets?: number;
  reps?: number | string;
  weight?: string | number;
  rest?: string | number;
};
type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  settings?: Record<string, { weight: string; rest: string }>;
  aiExercises?: ExerciseItem[];
};
type WorkoutExercise = ExerciseItem & {
  id: string;
  done: boolean;
  weightValue: string;
  restValue: string;
  rpeValue: string;
  rirValue: string;
};
type WorkoutProgress = {
  items: WorkoutExercise[];
  restEndsAt: number | null;
  restExerciseId: string | null;
};

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ routineId?: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<WorkoutExercise[]>([]);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restExerciseId, setRestExerciseId] = useState<string | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const liveActivity = useRef<LiveActivity<RoutineActivityProps> | null>(null);

  useEffect(() => {
    const routineId = Array.isArray(params.routineId)
      ? params.routineId[0]
      : params.routineId;
    Promise.all([
      AsyncStorage.getItem("pulse-routines"),
      AsyncStorage.getItem("pulse-routine"),
    ]).then(([stored, activeName]) => {
      const routines = stored ? (JSON.parse(stored) as Routine[]) : [];
      const selected =
        routines.find((item) => item.id === routineId) ||
        routines.find((item) => item.name === activeName) ||
        routines[0];
      if (!selected) return;
      setRoutine(selected);
      const generated =
        selected.aiExercises ||
        selected.exerciseIds.map((id) => {
          const exercise = EXERCISES.find((item) => item.id === id);
          const settings = selected.settings?.[id];
          return {
            name: exercise?.name || "Ejercicio",
            muscle: exercise?.muscle,
            equipment: exercise?.equipment,
            sets: 3,
            reps: 10,
            weight: settings?.weight || "",
            rest: settings?.rest || "90",
          };
        });
      const initialItems = generated.map((item, index) => ({
        id: `${selected.id}-${index}`,
        ...item,
        done: false,
        weightValue: String(item.weight ?? ""),
        restValue: String(item.rest ?? "90"),
        rpeValue: "",
        rirValue: "",
      }));
      AsyncStorage.getItem(`pulse-workout-progress:${selected.id}`).then(
        (saved) => {
          if (!saved) {
            setItems(initialItems);
            return;
          }
          try {
            const progress = JSON.parse(saved) as WorkoutProgress;
            setItems(progress.items?.length ? progress.items : initialItems);
            setRestEndsAt(progress.restEndsAt ?? null);
            setRestExerciseId(progress.restExerciseId ?? null);
          } catch {
            setItems(initialItems);
          }
        },
      );
    });
  }, [params.routineId]);

  useEffect(() => {
    if (!routine || !items.length) return;
    void AsyncStorage.setItem(
      `pulse-workout-progress:${routine.id}`,
      JSON.stringify({
        items,
        restEndsAt,
        restExerciseId,
      } satisfies WorkoutProgress),
    );
  }, [items, restEndsAt, restExerciseId, routine]);

  useEffect(() => {
    if (!restEndsAt) {
      setRestRemaining(0);
      setRestExerciseId(null);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((restEndsAt - Date.now()) / 1000),
      );
      setRestRemaining(remaining);
      if (!remaining) {
        setRestEndsAt(null);
        setRestExerciseId(null);
      }
    };
    updateRemaining();
    const timer = setInterval(updateRemaining, 250);
    return () => clearInterval(timer);
  }, [restEndsAt]);

  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      !routine ||
      !items.length ||
      liveActivity.current
    ) {
      return;
    }

    const currentExercise =
      items.find((item) => !item.done) || items[items.length - 1];
    const routineActivity = getRoutineActivity();
    liveActivity.current =
      routineActivity.getInstances()[0] ||
      routineActivity.start(
        {
          routineName: routine.name,
          exerciseName: currentExercise.name,
          completed: items.filter((item) => item.done).length,
          total: items.length,
        },
        "miprimeraapp://workout",
      );
  }, [items, routine]);

  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      !routine ||
      !items.length ||
      !liveActivity.current
    ) {
      return;
    }

    const currentExercise =
      items.find((item) => !item.done) || items[items.length - 1];
    void liveActivity.current.update({
      routineName: routine.name,
      exerciseName: currentExercise.name,
      completed: items.filter((item) => item.done).length,
      total: items.length,
    });
  }, [items, routine]);

  const updateItem = (
    id: string,
    field: "weightValue" | "restValue" | "rpeValue" | "rirValue",
    value: string,
  ) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  const toggleDone = (id: string) => {
    const selected = items.find((item) => item.id === id);
    if (!selected) return;
    const nextDone = !selected.done;
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, done: nextDone } : item,
      ),
    );
    if (nextDone) {
      const restSeconds = Math.max(0, Number(selected.restValue) || 0);
      setRestEndsAt(restSeconds ? Date.now() + restSeconds * 1000 : null);
      setRestExerciseId(restSeconds ? id : null);
    } else {
      setRestEndsAt(null);
      setRestExerciseId(null);
    }
  };
  const exitWorkout = async () => {
    if (routine && items.length) {
      await AsyncStorage.setItem(
        `pulse-workout-progress:${routine.id}`,
        JSON.stringify({
          items,
          restEndsAt,
          restExerciseId,
        } satisfies WorkoutProgress),
      );
    }
    router.back();
  };
  const finish = async () => {
    if (!routine) return;
    const completed = items.filter((item) => item.done).length;
    if (!completed) return;
    const completedItems = items.filter((item) => item.done);
    const muscleVolumes = completedItems.reduce<Record<string, number>>(
      (volumes, item) => {
        const muscle = item.muscle || "Otros";
        volumes[muscle] =
          (volumes[muscle] || 0) +
          (Number(item.weightValue) || 0) *
            Number(item.reps || 10) *
            Number(item.sets || 3);
        return volumes;
      },
      {},
    );
    const oneRmRecords = completedItems
      .map((item) => ({
        exercise: item.name,
        value: Math.round(
          (Number(item.weightValue) || 0) * (1 + Number(item.reps || 10) / 30),
        ),
      }))
      .filter((record) => record.value > 0);
    const rpeValues = completedItems
      .map((item) => Number(item.rpeValue))
      .filter((value) => value > 0);
    const rirValues = completedItems
      .map((item) => Number(item.rirValue))
      .filter((value) => value >= 0);
    await saveTrainingLog({
      id: `${routine.id}-${new Date().toISOString().slice(0, 10)}`,
      date: new Date().toISOString(),
      routineId: routine.id,
      routineName: routine.name,
      sets: completed * 3,
      volumeKg: items
        .filter((item) => item.done)
        .reduce(
          (total, item) => total + (Number(item.weightValue) || 0) * 3,
          0,
        ),
      minutes: Math.max(10, completed * 8),
      xp: 25 + completed * 10,
      muscleVolumes,
      oneRmRecords,
      averageRpe: rpeValues.length
        ? rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length
        : undefined,
      averageRir: rirValues.length
        ? rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length
        : undefined,
    });
    if (
      Platform.OS === "ios" &&
      Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
      liveActivity.current
    ) {
      await liveActivity.current.end("immediate", {
        routineName: routine.name,
        exerciseName: "Rutina completada",
        completed,
        total: items.length,
      });
      liveActivity.current = null;
    }
    await AsyncStorage.removeItem(`pulse-workout-progress:${routine.id}`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.header}
        >
          <Pressable onPress={exitWorkout} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ENTRENAMIENTO ACTIVO</Text>
            <Text style={styles.title}>
              {routine?.name || "Cargando rutina"}
            </Text>
          </View>
        </Animated.View>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            {items.filter((item) => item.done).length} de {items.length}{" "}
            ejercicios completados
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${items.length ? (items.filter((item) => item.done).length / items.length) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>
        {items.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInRight.delay(index * 70).duration(350)}
            layout={Layout.springify()}
            style={[styles.exerciseCard, item.done && styles.exerciseDone]}
          >
            <Pressable
              onPress={() => toggleDone(item.id)}
              style={styles.exerciseTop}
            >
              <Animated.View
                key={`${item.id}-${item.done}`}
                entering={item.done ? ZoomIn.duration(320) : undefined}
                style={[styles.check, item.done && styles.checkDone]}
              >
                <Text
                  style={[styles.checkText, item.done && styles.checkTextDone]}
                >
                  {item.done ? "✓" : index + 1}
                </Text>
              </Animated.View>
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.muscle || "Fuerza"} · {item.sets || 3} series ·{" "}
                  {item.reps || 10} reps
                </Text>
              </View>
              <Text style={styles.status}>
                {item.done ? "Hecho" : "Pendiente"}
              </Text>
            </Pressable>
            {item.id === restExerciseId && restRemaining > 0 && (
              <View style={styles.restTimer}>
                <Text style={styles.restTimerLabel}>DESCANSO</Text>
                <Text style={styles.restTimerValue}>
                  {Math.floor(restRemaining / 60)}:
                  {String(restRemaining % 60).padStart(2, "0")}
                </Text>
              </View>
            )}
            <View style={styles.controls}>
              <View style={styles.control}>
                <Text style={styles.controlLabel}>PESO (KG)</Text>
                <TextInput
                  value={item.weightValue}
                  onChangeText={(value) =>
                    updateItem(item.id, "weightValue", value)
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.secondary}
                  style={styles.controlInput}
                />
              </View>
              <View style={styles.control}>
                <Text style={styles.controlLabel}>DESCANSO (SEG)</Text>
                <TextInput
                  value={item.restValue}
                  onChangeText={(value) =>
                    updateItem(item.id, "restValue", value)
                  }
                  keyboardType="number-pad"
                  placeholder="90"
                  placeholderTextColor={COLORS.secondary}
                  style={styles.controlInput}
                />
              </View>
              <View style={styles.control}>
                <Text style={styles.controlLabel}>RPE</Text>
                <TextInput
                  value={item.rpeValue}
                  onChangeText={(value) =>
                    updateItem(item.id, "rpeValue", value)
                  }
                  keyboardType="decimal-pad"
                  placeholder="8"
                  placeholderTextColor={COLORS.secondary}
                  style={styles.controlInput}
                />
              </View>
              <View style={styles.control}>
                <Text style={styles.controlLabel}>RIR</Text>
                <TextInput
                  value={item.rirValue}
                  onChangeText={(value) =>
                    updateItem(item.id, "rirValue", value)
                  }
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={COLORS.secondary}
                  style={styles.controlInput}
                />
              </View>
            </View>
            {item.done && (item.rpeValue || item.rirValue) ? (
              <Text style={styles.loadAdvice}>{getLoadAdvice(item)}</Text>
            ) : null}
          </Animated.View>
        ))}
        {!items.length && (
          <Text style={styles.empty}>
            Esta rutina no tiene ejercicios todavía.
          </Text>
        )}
        <Pressable
          onPress={finish}
          disabled={!items.some((item) => item.done)}
          style={[
            styles.finish,
            !items.some((item) => item.done) && styles.disabled,
          ]}
        >
          <Text style={styles.finishText}>Finalizar entrenamiento</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function getLoadAdvice(item: WorkoutExercise) {
  const rpe = Number(item.rpeValue);
  const rir = Number(item.rirValue);
  if (rir >= 3 || (rpe > 0 && rpe <= 7))
    return "Coach: puedes subir 2,5-5% la próxima sesión.";
  if (rir <= 0 || rpe >= 9.5)
    return "Coach: mantén o baja 5% la carga y prioriza la técnica.";
  return "Coach: mantén la carga y busca una repetición más.";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    paddingHorizontal: 20,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: COLORS.ink, fontSize: 30, lineHeight: 30, marginTop: -3 },
  headerCopy: { marginLeft: 12 },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { color: COLORS.ink, fontSize: 28, fontWeight: "700", marginTop: 4 },
  progressCard: {
    backgroundColor: COLORS.ink,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  progressLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  track: {
    height: 7,
    backgroundColor: "#37373D",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 14,
  },
  fill: { height: "100%", backgroundColor: COLORS.green, borderRadius: 4 },
  exerciseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },
  exerciseDone: {
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: "#F5FFF7",
  },
  exerciseTop: { flexDirection: "row", alignItems: "center" },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: COLORS.green },
  checkText: { color: COLORS.blue, fontSize: 13, fontWeight: "800" },
  checkTextDone: { color: "#fff" },
  exerciseCopy: { flex: 1, marginLeft: 11 },
  exerciseName: { color: COLORS.ink, fontSize: 15, fontWeight: "700" },
  exerciseMeta: { color: COLORS.secondary, fontSize: 12, marginTop: 4 },
  status: { color: COLORS.secondary, fontSize: 11, fontWeight: "700" },
  controls: { flexDirection: "row", gap: 10, marginTop: 15 },
  control: { flex: 1 },
  controlLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  controlInput: {
    height: 42,
    backgroundColor: "#F2F2F7",
    borderRadius: 11,
    paddingHorizontal: 12,
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  loadAdvice: {
    color: "#248A3D",
    backgroundColor: "#EAF8EE",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  restTimer: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#EAF8EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  restTimerLabel: {
    color: "#248A3D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  restTimerValue: {
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  empty: { color: COLORS.secondary, textAlign: "center", padding: 20 },
  finish: {
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabled: { opacity: 0.4 },
  finishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

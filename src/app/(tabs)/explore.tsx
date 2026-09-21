import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EXERCISES, EXERCISE_COUNT, Exercise } from "@/data/exercises";

const COLORS = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  line: "#E6E6EB",
  red: "#FF3B30",
};
const MUSCLE_FILTERS = [
  "Todos",
  "Pecho",
  "Espalda",
  "Brazos",
  "Piernas",
  "Core",
];
type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  updatedAt: number;
  settings?: Record<string, { weight: string; rest: string }>;
};
type EditorMode = "create" | "edit";

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [muscleFilter, setMuscleFilter] = useState("Todos");
  const [exerciseSettings, setExerciseSettings] = useState<
    Record<string, { weight: string; rest: string }>
  >({});

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("pulse-routines"),
      AsyncStorage.getItem("pulse-routine"),
      AsyncStorage.getItem("pulse-exercises"),
    ]).then(([storedRoutines, legacyName, legacyExercises]) => {
      if (storedRoutines) {
        const restored = JSON.parse(storedRoutines) as Routine[];
        setRoutines(restored);
        setActiveRoutineId(restored[0]?.id ?? null);
      } else if (legacyName) {
        const migrated: Routine = {
          id: "routine-migrated",
          name: legacyName,
          exerciseIds: legacyExercises ? JSON.parse(legacyExercises) : [],
          updatedAt: Date.now(),
        };
        setRoutines([migrated]);
        setActiveRoutineId(migrated.id);
        AsyncStorage.setItem("pulse-routines", JSON.stringify([migrated]));
      }
    });
  }, []);

  const persist = (next: Routine[]) => {
    setRoutines(next);
    AsyncStorage.setItem("pulse-routines", JSON.stringify(next));
  };

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setRoutineName("");
    setSelected([]);
    setExerciseSettings({});
    setQuery("");
    setEditorVisible(true);
  };
  const openEdit = (routine: Routine) => {
    setEditorMode("edit");
    setEditingId(routine.id);
    setRoutineName(routine.name);
    setSelected(routine.exerciseIds);
    setExerciseSettings(routine.settings ?? {});
    setQuery("");
    setEditorVisible(true);
  };
  const closeEditor = () => setEditorVisible(false);
  const saveRoutine = () => {
    const name = routineName.trim();
    if (!name || selected.length === 0) return;
    const routine: Routine = {
      id: editingId ?? `routine-${Date.now()}`,
      name,
      exerciseIds: selected,
      updatedAt: Date.now(),
      settings: exerciseSettings,
    };
    const next =
      editorMode === "edit"
        ? routines.map((item) => (item.id === routine.id ? routine : item))
        : [routine, ...routines];
    persist(next);
    setActiveRoutineId(routine.id);
    AsyncStorage.setItem("pulse-routine", name);
    AsyncStorage.setItem("pulse-exercises", JSON.stringify(selected));
    closeEditor();
  };
  const useRoutine = (routine: Routine) => {
    setActiveRoutineId(routine.id);
    AsyncStorage.setItem("pulse-routine", routine.name);
    AsyncStorage.setItem(
      "pulse-exercises",
      JSON.stringify(routine.exerciseIds),
    );
  };
  const deleteRoutine = (routine: Routine) => {
    const next = routines.filter((item) => item.id !== routine.id);
    persist(next);
    if (activeRoutineId === routine.id) {
      setActiveRoutineId(next[0]?.id ?? null);
      if (next[0]) useRoutine(next[0]);
      else AsyncStorage.multiRemove(["pulse-routine", "pulse-exercises"]);
    }
  };
  const filtered = useMemo(
    () =>
      EXERCISES.filter(
        (exercise) =>
          (muscleFilter === "Todos" ||
            (muscleFilter === "Brazos"
              ? ["Biceps", "Triceps"].includes(exercise.muscle)
              : muscleFilter === exercise.muscle)) &&
          `${exercise.name} ${exercise.muscle} ${exercise.equipment}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ).slice(0, 35),
    [muscleFilter, query],
  );
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(450)}
          style={styles.header}
        >
          <View>
            <Text style={styles.eyebrow}>TU PLAN</Text>
            <Text style={styles.title}>Rutinas</Text>
            <Text style={styles.subtitle}>
              Crea, organiza y entrena sin perderte.
            </Text>
          </View>
          <Pressable style={styles.addButton} onPress={openCreate}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </Animated.View>
        <Pressable style={styles.createBanner} onPress={openCreate}>
          <View>
            <Text style={styles.createTitle}>Nueva rutina</Text>
            <Text style={styles.createDetail}>
              Elige un nombre y añade ejercicios
            </Text>
          </View>
          <Text style={styles.bannerArrow}>-&gt;</Text>
        </Pressable>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Mis rutinas</Text>
          <Text style={styles.countLabel}>{routines.length}</Text>
        </View>
        {routines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no tienes rutinas</Text>
            <Text style={styles.emptyDetail}>
              Empieza con una rutina de fuerza, movilidad o cardio.
            </Text>
            <Pressable style={styles.emptyButton} onPress={openCreate}>
              <Text style={styles.emptyButtonText}>Crear rutina</Text>
            </Pressable>
          </View>
        ) : (
          routines.map((routine, index) => (
            <Animated.View
              key={routine.id}
              entering={FadeInRight.delay(index * 70).duration(350)}
              style={styles.routineCard}
            >
              <View style={styles.routineIcon}>
                <Text style={styles.routineIconText}>
                  {routine.exerciseIds.length}
                </Text>
              </View>
              <View style={styles.routineCopy}>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                <Text style={styles.meta}>
                  {routine.exerciseIds.length} ejercicios
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => useRoutine(routine)}
                    style={[
                      styles.smallAction,
                      activeRoutineId === routine.id && styles.activeAction,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallActionText,
                        activeRoutineId === routine.id &&
                          styles.activeActionText,
                      ]}
                    >
                      {activeRoutineId === routine.id ? "En uso" : "Usar"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openEdit(routine)}
                    style={styles.smallAction}
                  >
                    <Text style={styles.smallActionText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => deleteRoutine(routine)}
                    style={styles.deleteAction}
                  >
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))
        )}
        <View style={styles.catalogHeader}>
          <Text style={styles.sectionLabel}>Biblioteca</Text>
          <Text style={styles.countLabel}>{EXERCISE_COUNT} ejercicios</Text>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, músculo o equipo"
          placeholderTextColor={COLORS.secondary}
          style={styles.searchInput}
        />
        <MuscleChips selected={muscleFilter} onSelect={setMuscleFilter} />
        {(query.length > 0 || muscleFilter !== "Todos") &&
          filtered.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              index={index}
              selected={selected.includes(exercise.id)}
              onPress={() => {}}
            />
          ))}
      </ScrollView>

      <Modal
        visible={editorVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={12}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.eyebrow}>
                  {editorMode === "edit" ? "EDITAR RUTINA" : "NUEVA RUTINA"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {editorMode === "edit"
                    ? "Ajusta tu sesión"
                    : "Crea tu sesión"}
                </Text>
              </View>
              <Pressable onPress={closeEditor}>
                <Text style={styles.close}>Cerrar</Text>
              </Pressable>
            </View>
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Nombre de la rutina"
              placeholderTextColor={COLORS.secondary}
              style={styles.nameInput}
            />
            <Text style={styles.selectionTitle}>
              {selected.length} ejercicios seleccionados
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.settingsStrip}
              keyboardShouldPersistTaps="handled"
            >
              {selected.map((id) => {
                const exercise = EXERCISES.find((item) => item.id === id);
                const values = exerciseSettings[id] ?? {
                  weight: "",
                  rest: "90",
                };
                if (!exercise) return null;
                return (
                  <View key={id} style={styles.settingsCard}>
                    <Text style={styles.settingsName} numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <View style={styles.settingsInputs}>
                      <TextInput
                        value={values.weight}
                        onChangeText={(value) =>
                          setExerciseSettings((current) => ({
                            ...current,
                            [id]: { ...values, weight: value },
                          }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="kg"
                        placeholderTextColor={COLORS.secondary}
                        style={styles.settingsInput}
                      />
                      <TextInput
                        value={values.rest}
                        onChangeText={(value) =>
                          setExerciseSettings((current) => ({
                            ...current,
                            [id]: { ...values, rest: value },
                          }))
                        }
                        keyboardType="number-pad"
                        placeholder="seg"
                        placeholderTextColor={COLORS.secondary}
                        style={styles.settingsInput}
                      />
                    </View>
                    <Text style={styles.settingsHint}>peso / descanso</Text>
                  </View>
                );
              })}
            </ScrollView>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar ejercicios para añadir"
              placeholderTextColor={COLORS.secondary}
              style={styles.searchInput}
            />
            <MuscleChips selected={muscleFilter} onSelect={setMuscleFilter} />
            <ScrollView
              style={styles.exerciseList}
              keyboardShouldPersistTaps="handled"
            >
              {filtered.slice(0, 20).map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  selected={selected.includes(exercise.id)}
                  onPress={() =>
                    setSelected((current) =>
                      current.includes(exercise.id)
                        ? current.filter((id) => id !== exercise.id)
                        : [...current, exercise.id],
                    )
                  }
                />
              ))}
            </ScrollView>
            <Pressable
              disabled={!routineName.trim() || selected.length === 0}
              onPress={saveRoutine}
              style={[
                styles.saveButton,
                (!routineName.trim() || selected.length === 0) &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.saveButtonText}>
                {editorMode === "edit" ? "Guardar cambios" : "Crear rutina"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function MuscleChips({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chips}
      contentContainerStyle={styles.chipsContent}
    >
      {MUSCLE_FILTERS.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onSelect(filter)}
          style={[styles.chip, selected === filter && styles.chipSelected]}
        >
          <Text
            style={[
              styles.chipText,
              selected === filter && styles.chipTextSelected,
            ]}
          >
            {filter}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ExerciseRow({
  exercise,
  index,
  selected,
  onPress,
}: {
  exercise: Exercise;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(Math.min(index, 8) * 20).duration(240)}
    >
      <Pressable
        onPress={onPress}
        style={[styles.exerciseRow, selected && styles.exerciseSelected]}
      >
        <View
          style={[styles.exerciseMark, selected && styles.exerciseMarkSelected]}
        >
          <Text
            style={[
              styles.exerciseMarkText,
              selected && styles.exerciseMarkTextSelected,
            ]}
          >
            {selected ? "OK" : exercise.muscle.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.routineCopy}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.meta}>
            {exercise.muscle} · {exercise.equipment}
          </Text>
        </View>
        <Text style={[styles.plus, selected && styles.plusSelected]}>
          {selected ? "x" : "+"}
        </Text>
      </Pressable>
    </Animated.View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  title: { color: COLORS.ink, fontSize: 34, fontWeight: "700" },
  subtitle: { color: COLORS.secondary, fontSize: 13, marginTop: 4 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#fff", fontSize: 28, fontWeight: "300", marginTop: -3 },
  createBanner: {
    backgroundColor: COLORS.ink,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  createTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  createDetail: { color: "#A5A5AE", fontSize: 12, marginTop: 4 },
  bannerArrow: { color: "#fff", fontSize: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  countLabel: { color: COLORS.blue, fontSize: 12, fontWeight: "700" },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
  },
  emptyTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "700" },
  emptyDetail: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  emptyButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F2FF",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 15,
  },
  emptyButtonText: { color: COLORS.blue, fontWeight: "700", fontSize: 13 },
  routineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  routineIconText: { color: COLORS.blue, fontSize: 15, fontWeight: "800" },
  routineCopy: { flex: 1, marginLeft: 13 },
  routineTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "700" },
  meta: { color: COLORS.secondary, fontSize: 12, marginTop: 5 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallAction: {
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  activeAction: { backgroundColor: "#EAF8EE" },
  smallActionText: { color: COLORS.blue, fontSize: 12, fontWeight: "700" },
  activeActionText: { color: "#248A3D" },
  deleteAction: { paddingHorizontal: 7, paddingVertical: 7 },
  deleteText: { color: COLORS.red, fontSize: 12, fontWeight: "600" },
  toolCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#FFF4E5",
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconText: { color: "#A66100", fontSize: 11, fontWeight: "800" },
  chevron: { color: "#B8B8C0", fontSize: 25 },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    height: 48,
    backgroundColor: "#E2E2E7",
    borderRadius: 14,
    paddingHorizontal: 15,
    color: COLORS.ink,
    fontSize: 14,
    marginBottom: 12,
  },
  chips: { marginBottom: 12 },
  chipsContent: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#E2E2E7",
  },
  chipSelected: { backgroundColor: COLORS.blue },
  chipText: { color: COLORS.secondary, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: "#fff" },
  exerciseList: { maxHeight: 270, marginBottom: 10 },
  exerciseRow: {
    minHeight: 62,
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseSelected: {
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: "#F5FFF7",
  },
  exerciseMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseMarkSelected: { backgroundColor: COLORS.green },
  exerciseMarkText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "800",
  },
  exerciseMarkTextSelected: { color: "#fff" },
  exerciseName: { color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  plus: { color: COLORS.blue, fontSize: 24, paddingHorizontal: 7 },
  plusSelected: { color: COLORS.green, fontSize: 17, fontWeight: "800" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "91%",
  },
  toolSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 35,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C5C5CC",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetTitle: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: "700",
    marginBottom: 17,
  },
  close: { color: COLORS.blue, fontSize: 14, fontWeight: "700" },
  nameInput: {
    height: 50,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: COLORS.ink,
    fontSize: 16,
    marginBottom: 12,
  },
  selectionTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingsStrip: { marginBottom: 10 },
  settingsCard: {
    width: 156,
    backgroundColor: "#EAF8EE",
    borderRadius: 13,
    padding: 10,
    marginRight: 8,
  },
  settingsName: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingsInputs: { flexDirection: "row", gap: 6 },
  settingsInput: {
    flex: 1,
    height: 34,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    color: COLORS.ink,
    fontSize: 12,
  },
  settingsHint: { color: "#248A3D", fontSize: 9, marginTop: 5 },
  saveButton: {
    height: 50,
    backgroundColor: COLORS.blue,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  disabledButton: { opacity: 0.35 },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  toolHint: { color: COLORS.secondary, fontSize: 13, marginBottom: 18 },
  inputsRow: { flexDirection: "row", gap: 10 },
  halfInput: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 15,
    color: COLORS.ink,
    fontSize: 15,
  },
  result: {
    backgroundColor: "#EAF8EE",
    borderRadius: 15,
    padding: 16,
    marginTop: 18,
  },
  resultLabel: {
    color: "#248A3D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  resultValue: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 4,
  },
});

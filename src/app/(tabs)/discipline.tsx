import { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import { Button, Card, Chip, Field, HabitRow, Header, Loading, ProgressBar, Screen, SectionLabel } from "@/components/focus-ui";
import { FOCUS } from "@/constants/theme";
import { useSnapshot } from "@/hooks/use-snapshot";
import {
  addHabit,
  dateKey,
  emptyLog,
  habitStreak,
  lastDays,
  removeHabit,
  SUGGESTED_HABITS,
  toggleHabit,
  type Habit,
} from "@/lib/focus-storage";

export default function DisciplineScreen() {
  const { data, refresh } = useSnapshot();
  const [title, setTitle] = useState("");

  if (!data) return <Loading />;

  const today = dateKey();
  const log = data.logs[today] ?? emptyLog(today);
  const total = data.habits.length;
  const doneToday = data.habits.filter((habit) => log.habitsDone.includes(habit.id)).length;
  const days = lastDays(7).map((day) => {
    const dayLog = data.logs[day.key];
    const done = dayLog ? data.habits.filter((habit) => dayLog.habitsDone.includes(habit.id)).length : 0;
    return { ...day, done, ratio: total ? done / total : 0 };
  });
  const perfectDays = days.filter((day) => total > 0 && day.done >= total).length;
  const existing = new Set(data.habits.map((habit) => habit.title.toLowerCase()));
  const suggestions = SUGGESTED_HABITS.filter((item) => !existing.has(item.toLowerCase()));

  const create = async (value: string) => {
    const created = await addHabit(value);
    if (!created) return;
    setTitle("");
    await refresh();
  };

  const toggle = async (id: string) => {
    await toggleHabit(id);
    await refresh();
  };

  const confirmDelete = (habit: Habit) => {
    const run = async () => {
      await removeHabit(habit.id);
      await refresh();
    };
    if (Platform.OS === "web") {
      void run();
      return;
    }
    Alert.alert("Eliminar hábito", `¿Seguro que quieres eliminar "${habit.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void run() },
    ]);
  };

  return (
    <Screen>
      <Header eyebrow="DISCIPLINA" title="Tus juramentos" subtitle="Lo que prometes, lo cumples. Sin negociar." />

      <Card>
        <View style={styles.rowBetween}>
          <SectionLabel>Últimos 7 días</SectionLabel>
          <Text style={styles.perfect}>{perfectDays} días perfectos</Text>
        </View>
        <View style={styles.week}>
          {days.map((day) => (
            <View key={day.key} style={styles.day}>
              <View
                style={[
                  styles.dot,
                  day.ratio >= 1 ? styles.dotFull : day.ratio > 0 ? styles.dotPartial : null,
                  day.key === today && styles.dotToday,
                ]}
              >
                <Text style={[styles.dotText, day.ratio >= 1 && styles.dotTextFull]}>{day.done}</Text>
              </View>
              <Text style={[styles.dayLabel, day.key === today && styles.dayLabelToday]}>{day.label}</Text>
            </View>
          ))}
        </View>
        <ProgressBar value={total ? doneToday / total : 0} color={FOCUS.success} />
        <Text style={styles.muted}>
          Hoy: {doneToday} de {total} cumplidos
        </Text>
      </Card>

      <SectionLabel>Hábitos</SectionLabel>
      {total === 0 ? (
        <Card>
          <Text style={styles.muted}>Sin hábitos todavía. Añade el primero abajo.</Text>
        </Card>
      ) : (
        data.habits.map((habit) => (
          <HabitRow
            key={habit.id}
            title={habit.title}
            done={log.habitsDone.includes(habit.id)}
            meta={`Racha ${habitStreak(data.logs, habit.id)} días · +${habit.xp} XP`}
            onPress={() => void toggle(habit.id)}
            onDelete={() => confirmDelete(habit)}
          />
        ))
      )}

      <Card>
        <SectionLabel>Nuevo juramento</SectionLabel>
        <View style={styles.row}>
          <Field
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Estudiar 1 hora"
            maxLength={80}
            style={styles.flex}
            returnKeyType="done"
            onSubmitEditing={() => void create(title)}
          />
          <Button label="Añadir" onPress={() => void create(title)} disabled={!title.trim()} />
        </View>
        {suggestions.length > 0 ? (
          <View style={styles.chips}>
            {suggestions.map((item) => (
              <Chip key={item} label={`+ ${item}`} onPress={() => void create(item)} />
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  perfect: { color: FOCUS.success, fontSize: 13, fontWeight: "800" },
  week: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  day: { alignItems: "center", gap: 6 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: FOCUS.surface,
    borderWidth: 1,
    borderColor: FOCUS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFull: { backgroundColor: FOCUS.success, borderColor: FOCUS.success },
  dotPartial: { backgroundColor: `${FOCUS.warning}33`, borderColor: FOCUS.warning },
  dotToday: { borderWidth: 2, borderColor: FOCUS.ember },
  dotText: { color: FOCUS.text, fontSize: 13, fontWeight: "800" },
  dotTextFull: { color: "#0B0B0F" },
  dayLabel: { color: FOCUS.textMuted, fontSize: 12, fontWeight: "800" },
  dayLabelToday: { color: FOCUS.ember },
  muted: { color: FOCUS.textMuted, fontSize: 13 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  flex: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

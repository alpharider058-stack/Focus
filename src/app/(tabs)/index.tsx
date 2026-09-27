import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, HabitRow, Header, Loading, ProgressBar, Screen, SectionLabel, Stat } from "@/components/focus-ui";
import { FOCUS } from "@/constants/theme";
import { affirmationFor } from "@/data/affirmations";
import { useSnapshot } from "@/hooks/use-snapshot";
import { computeStreak, dateKey, emptyLog, habitStreak, levelInfo, toggleHabit } from "@/lib/focus-storage";

function greeting(hour: number): string {
  if (hour < 6) return "Aún despierto";
  if (hour < 13) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, refresh } = useSnapshot();

  if (!data) return <Loading />;

  const today = dateKey();
  const log = data.logs[today] ?? emptyLog(today);
  const streak = computeStreak(data.logs);
  const level = levelInfo(data.xp);
  const done = data.habits.filter((habit) => log.habitsDone.includes(habit.id)).length;
  const total = data.habits.length;
  const allDone = total > 0 && done >= total;
  const identity = data.profile?.identity ?? [];

  const onToggle = async (id: string) => {
    await toggleHabit(id);
    await refresh();
  };

  return (
    <Screen>
      <Header
        eyebrow={greeting(new Date().getHours()).toUpperCase()}
        title={data.profile?.name || "Hoy"}
        subtitle={data.profile?.goal ? `Objetivo: ${data.profile.goal}` : undefined}
      />

      <Card accent={FOCUS.ember}>
        <View style={styles.levelRow}>
          <View>
            <Text style={styles.levelLabel}>NIVEL {level.level}</Text>
            <Text style={styles.levelTitle}>{level.title}</Text>
          </View>
          <Text style={styles.xp}>{data.xp} XP</Text>
        </View>
        <ProgressBar value={level.progress} />
        <Text style={styles.muted}>
          {level.next - data.xp} XP para el nivel {level.level + 1}
        </Text>
      </Card>

      <View style={styles.statsRow}>
        <Stat label="Racha" value={String(streak.current)} suffix="días" color={FOCUS.ember} />
        <Stat label="Hábitos" value={`${done}/${total}`} color={FOCUS.success} />
        <Stat label="Enfoque" value={String(log.focusMinutes)} suffix="min" color={FOCUS.violet} />
      </View>

      <Card>
        <SectionLabel>Afirmación de hoy</SectionLabel>
        <Text style={styles.affirmation}>{`\u201C${affirmationFor(today)}\u201D`}</Text>
      </Card>

      <SectionLabel>{allDone ? "Día perfecto. Todo cumplido." : "Tus juramentos de hoy"}</SectionLabel>
      {total === 0 ? (
        <Card>
          <Text style={styles.muted}>Aún no tienes hábitos. Añádelos en Disciplina.</Text>
        </Card>
      ) : (
        data.habits.map((habit) => (
          <HabitRow
            key={habit.id}
            title={habit.title}
            done={log.habitsDone.includes(habit.id)}
            meta={`Racha ${habitStreak(data.logs, habit.id)} · +${habit.xp} XP`}
            onPress={() => void onToggle(habit.id)}
          />
        ))
      )}

      <View style={styles.actions}>
        <Button label="Iniciar enfoque" onPress={() => router.navigate("/focus" as never)} style={styles.flex} />
        <Button label="Check-in de ego" variant="secondary" onPress={() => router.navigate("/ego" as never)} style={styles.flex} />
      </View>

      {identity.length > 0 ? (
        <Card accent={FOCUS.violet}>
          <SectionLabel>Recuerda quién eres</SectionLabel>
          {identity.map((item) => (
            <Text key={item} style={styles.identity}>
              {"\u25C6"} {item}
            </Text>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  levelLabel: { color: FOCUS.ember, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  levelTitle: { color: FOCUS.text, fontSize: 24, fontWeight: "900" },
  xp: { color: FOCUS.text, fontSize: 16, fontWeight: "800" },
  muted: { color: FOCUS.textMuted, fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  affirmation: { color: FOCUS.text, fontSize: 19, lineHeight: 27, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  flex: { flex: 1 },
  identity: { color: FOCUS.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
});

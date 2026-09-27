import { Alert, Platform, StyleSheet, Text, View } from "react-native";

import { BarChart, Button, Card, Header, Loading, ProgressBar, Screen, SectionLabel, Stat } from "@/components/focus-ui";
import { FOCUS } from "@/constants/theme";
import { useSnapshot } from "@/hooks/use-snapshot";
import { clearAll, computeStreak, getAchievements, getTotals, lastDays, levelInfo } from "@/lib/focus-storage";

export default function ProfileScreen() {
  const { data } = useSnapshot();

  if (!data) return <Loading />;

  const level = levelInfo(data.xp);
  const streak = computeStreak(data.logs);
  const totals = getTotals(data);
  const achievements = getAchievements({
    xp: data.xp,
    bestStreak: streak.best,
    totalHabits: totals.totalHabits,
    totalFocus: totals.totalFocus,
    wins: data.wins.length,
    mirrorDays: totals.mirrorDays,
  });
  const unlocked = achievements.filter((item) => item.unlocked).length;
  const week = lastDays(7).map((day) => ({ key: day.key, label: day.label, value: data.logs[day.key]?.focusMinutes ?? 0 }));

  const confirmReset = () => {
    if (Platform.OS === "web") {
      void clearAll();
      return;
    }
    Alert.alert("Borrar todos los datos", "Perderás tu nivel, rachas, hábitos y registros. No se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => void clearAll() },
    ]);
  };

  return (
    <Screen>
      <Header eyebrow="PERFIL" title={data.profile?.name || "Tú"} subtitle={data.profile?.goal} />

      <Card accent={FOCUS.ember}>
        <View style={styles.levelRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{level.level}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.levelTitle}>{level.title}</Text>
            <Text style={styles.muted}>
              {data.xp} XP · siguiente nivel en {level.next - data.xp} XP
            </Text>
          </View>
        </View>
        <ProgressBar value={level.progress} />
      </Card>

      <View style={styles.row}>
        <Stat label="Racha actual" value={String(streak.current)} suffix="días" color={FOCUS.ember} />
        <Stat label="Mejor racha" value={String(streak.best)} suffix="días" color={FOCUS.warning} />
      </View>
      <View style={styles.row}>
        <Stat label="Enfoque total" value={String(totals.totalFocus)} suffix="min" color={FOCUS.violet} />
        <Stat label="Hábitos cumplidos" value={String(totals.totalHabits)} color={FOCUS.success} />
      </View>

      <Card>
        <SectionLabel>Minutos de enfoque (7 días)</SectionLabel>
        <BarChart items={week} color={FOCUS.ember} />
      </Card>

      {data.profile?.identity.length ? (
        <Card accent={FOCUS.violet}>
          <SectionLabel>Tu identidad</SectionLabel>
          {data.profile.identity.map((item) => (
            <Text key={item} style={styles.identity}>
              {"\u25C6"} {item}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <View style={styles.rowBetween}>
          <SectionLabel>Logros</SectionLabel>
          <Text style={styles.muted}>
            {unlocked}/{achievements.length}
          </Text>
        </View>
        {achievements.map((item) => (
          <View key={item.id} style={[styles.achievement, !item.unlocked && styles.locked]}>
            <Text style={[styles.achievementIcon, item.unlocked && { color: FOCUS.ember }]}>
              {item.unlocked ? "\u2605" : "\u25CB"}
            </Text>
            <View style={styles.flex}>
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.description}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Button label="Borrar todos mis datos" variant="danger" onPress={confirmReset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${FOCUS.ember}22`,
    borderWidth: 2,
    borderColor: FOCUS.ember,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: FOCUS.ember, fontSize: 24, fontWeight: "900" },
  levelTitle: { color: FOCUS.text, fontSize: 22, fontWeight: "900" },
  flex: { flex: 1 },
  muted: { color: FOCUS.textMuted, fontSize: 13 },
  row: { flexDirection: "row", gap: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  identity: { color: FOCUS.text, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  achievement: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  locked: { opacity: 0.5 },
  achievementIcon: { color: FOCUS.textFaint, fontSize: 22, width: 26, textAlign: "center" },
  achievementTitle: { color: FOCUS.text, fontSize: 15, fontWeight: "800" },
});

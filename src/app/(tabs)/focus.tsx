import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { Button, Card, Chip, Field, Header, Loading, ProgressBar, Screen, SectionLabel, Stat } from "@/components/focus-ui";
import { Glow } from "@/components/motion";
import { FOCUS } from "@/constants/theme";
import { useSnapshot } from "@/hooks/use-snapshot";
import {
  completeFocus,
  dateKey,
  emptyLog,
  focusElapsedSeconds,
  makeId,
  saveActiveFocus,
  type ActiveFocus,
} from "@/lib/focus-storage";

const PRESETS = [
  { minutes: 15, label: "Sprint" },
  { minutes: 25, label: "Clásico" },
  { minutes: 50, label: "Profundo" },
  { minutes: 90, label: "Monje" },
];

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusScreen() {
  const { data, refresh } = useSnapshot();
  const [duration, setDuration] = useState(25);
  const [intent, setIntent] = useState("");
  const [active, setActive] = useState<ActiveFocus | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reward, setReward] = useState<number | null>(null);

  // Restore a running or paused session every time data is reloaded.
  useEffect(() => {
    if (data) {
      setActive(data.active);
      setNow(Date.now());
    }
  }, [data]);

  const elapsed = active ? focusElapsedSeconds(active, now) : 0;
  const totalSeconds = (active?.durationMin ?? duration) * 60;
  const finished = Boolean(active) && elapsed >= totalSeconds;
  const running = Boolean(active) && !active?.paused && !finished;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  if (!data) return <Loading />;

  const today = dateKey();
  const todayMinutes = (data.logs[today] ?? emptyLog(today)).focusMinutes;
  const elapsedMinutes = Math.floor(elapsed / 60);

  const start = async () => {
    const next: ActiveFocus = {
      id: makeId("active"),
      intent: intent.trim(),
      durationMin: duration,
      startedAt: Date.now(),
      elapsedBefore: 0,
      paused: false,
    };
    setReward(null);
    setNow(Date.now());
    setActive(next);
    await saveActiveFocus(next);
  };

  const togglePause = async () => {
    if (!active) return;
    const time = Date.now();
    const next: ActiveFocus = active.paused
      ? { ...active, paused: false, startedAt: time }
      : { ...active, paused: true, elapsedBefore: focusElapsedSeconds(active, time) };
    setNow(time);
    setActive(next);
    await saveActiveFocus(next);
  };

  const finish = async () => {
    if (!active) return;
    const minutes = finished ? active.durationMin : Math.floor(focusElapsedSeconds(active) / 60);
    const xp = await completeFocus(active.intent, minutes);
    setActive(null);
    setIntent("");
    setReward(xp);
    await refresh();
  };

  const cancel = async () => {
    await saveActiveFocus(null);
    setActive(null);
    await refresh();
  };

  const status = !active ? "LISTO" : finished ? "COMPLETADO" : active.paused ? "EN PAUSA" : "EN ENFOQUE";
  const accent = finished ? FOCUS.success : FOCUS.ember;

  return (
    <Screen>
      <Header eyebrow="ENFOQUE" title="Modo bestia" subtitle="Una tarea. Cero distracciones. El móvil boca abajo." />

      <Card accent={finished ? FOCUS.success : active ? FOCUS.ember : undefined} style={styles.timerCard}>
        <Glow color={accent} size={300} active={running || finished} />
        <Animated.Text key={status} entering={FadeIn.duration(400)} style={[styles.status, finished && { color: FOCUS.success }]}>
          {status}
        </Animated.Text>
        <Text style={styles.time} accessibilityRole="timer">
          {formatTime(totalSeconds - elapsed)}
        </Text>
        {active?.intent ? <Text style={styles.intent}>{active.intent}</Text> : null}
        <ProgressBar value={elapsed / totalSeconds} color={accent} height={10} />
      </Card>

      {!active ? (
        <View style={styles.stack}>
          <Card>
            <SectionLabel>¿En qué vas a enfocarte?</SectionLabel>
            <Field value={intent} onChangeText={setIntent} placeholder="Ej: Terminar el informe" maxLength={120} />
            <SectionLabel>Duración</SectionLabel>
            <View style={styles.chips}>
              {PRESETS.map((preset) => (
                <Chip
                  key={preset.minutes}
                  label={`${preset.label} · ${preset.minutes} min`}
                  active={duration === preset.minutes}
                  onPress={() => setDuration(preset.minutes)}
                />
              ))}
            </View>
          </Card>
          <Button label={`Empezar ${duration} minutos`} onPress={() => void start()} />
        </View>
      ) : finished ? (
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <Button label={`Reclamar +${active.durationMin} XP`} onPress={() => void finish()} />
        </Animated.View>
      ) : (
        <View style={styles.stack}>
          <View style={styles.row}>
            <Button
              label={active.paused ? "Reanudar" : "Pausar"}
              variant="secondary"
              onPress={() => void togglePause()}
              style={styles.flex}
            />
            <Button
              label={elapsedMinutes >= 1 ? `Terminar (+${elapsedMinutes} XP)` : "Terminar"}
              onPress={() => void finish()}
              disabled={elapsedMinutes < 1}
              style={styles.flex}
            />
          </View>
          <Button label="Abandonar sesión (sin XP)" variant="danger" onPress={() => void cancel()} />
        </View>
      )}

      {reward !== null ? (
        <Animated.View entering={ZoomIn.springify().damping(11)}>
          <Card accent={FOCUS.success}>
            <Text style={styles.rewardTitle}>+{reward} XP</Text>
            <Text style={styles.muted}>Así se construye el respeto propio. Una sesión cada vez.</Text>
          </Card>
        </Animated.View>
      ) : null}

      <View style={styles.row}>
        <Stat label="Hoy" value={String(todayMinutes)} suffix="min" color={FOCUS.violet} />
        <Stat label="Sesiones" value={String(data.sessions.length)} color={FOCUS.ember} />
      </View>

      {data.sessions.length > 0 ? (
        <Card>
          <SectionLabel>Sesiones recientes</SectionLabel>
          {data.sessions.slice(0, 6).map((session) => (
            <View key={session.id} style={styles.sessionRow}>
              <Text style={styles.sessionIntent} numberOfLines={1}>
                {session.intent || "Enfoque"}
              </Text>
              <Text style={styles.sessionMeta}>
                {session.minutes} min · {new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timerCard: { alignItems: "center", justifyContent: "center", paddingVertical: 28, gap: 12, overflow: "hidden" },
  status: { color: FOCUS.ember, fontSize: 12, fontWeight: "900", letterSpacing: 3 },
  time: { color: FOCUS.text, fontSize: 72, fontWeight: "900", fontVariant: ["tabular-nums"], letterSpacing: 1 },
  intent: { color: FOCUS.textMuted, fontSize: 15, fontWeight: "600", textAlign: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stack: { gap: 14 },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  rewardTitle: { color: FOCUS.success, fontSize: 26, fontWeight: "900" },
  muted: { color: FOCUS.textMuted, fontSize: 13 },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
  sessionIntent: { color: FOCUS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  sessionMeta: { color: FOCUS.textMuted, fontSize: 13 },
});

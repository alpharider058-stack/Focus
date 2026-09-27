import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { BarChart, Button, Card, Chip, Field, Header, Loading, Screen, SectionLabel } from "@/components/focus-ui";
import { FOCUS } from "@/constants/theme";
import { affirmationFor } from "@/data/affirmations";
import { useSnapshot } from "@/hooks/use-snapshot";
import {
  addWin,
  dateKey,
  lastDays,
  removeWin,
  saveMirror,
  WIN_KINDS,
  XP_REWARDS,
  type Win,
  type WinKind,
} from "@/lib/focus-storage";

const KIND_META: Record<WinKind, { label: string; color: string; placeholder: string }> = {
  victoria: { label: "Victoria", color: FOCUS.ember, placeholder: "¿Qué has conquistado hoy?" },
  gratitud: { label: "Gratitud", color: FOCUS.success, placeholder: "¿Por qué estás agradecido?" },
  leccion: { label: "Lección", color: FOCUS.violet, placeholder: "¿Qué has aprendido?" },
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function EgoScreen() {
  const { data, refresh } = useSnapshot();
  const [offset, setOffset] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [mirrorMessage, setMirrorMessage] = useState<string | null>(null);
  const [winText, setWinText] = useState("");
  const [kind, setKind] = useState<WinKind>("victoria");

  // Prefill today's check-in once.
  useEffect(() => {
    if (!data || hydrated) return;
    const log = data.logs[dateKey()];
    setConfidence(log?.confidence ?? null);
    setNote(log?.mirrorNote ?? "");
    setHydrated(true);
  }, [data, hydrated]);

  if (!data) return <Loading />;

  const today = dateKey();
  const alreadyChecked = data.logs[today]?.confidence != null;
  const week = lastDays(7).map((day) => ({
    key: day.key,
    label: day.label,
    value: data.logs[day.key]?.confidence ?? 0,
  }));

  const saveCheckIn = async () => {
    if (confidence === null) return;
    const first = await saveMirror(confidence, note);
    setMirrorMessage(first ? `Check-in guardado. +${XP_REWARDS.mirror} XP` : "Check-in actualizado.");
    await refresh();
  };

  const saveWin = async () => {
    const win = await addWin(winText, kind);
    if (!win) return;
    setWinText("");
    await refresh();
  };

  const confirmRemove = (win: Win) => {
    const run = async () => {
      await removeWin(win.id);
      await refresh();
    };
    if (Platform.OS === "web") {
      void run();
      return;
    }
    Alert.alert("Eliminar registro", "Se restarán los XP que te dio.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void run() },
    ]);
  };

  return (
    <Screen>
      <Header eyebrow="EGO" title="Frente al espejo" subtitle="La confianza no se pide. Se construye con pruebas." />

      <Card accent={FOCUS.violet}>
        <SectionLabel>Afirmación</SectionLabel>
        <Text style={styles.affirmation}>{`\u201C${affirmationFor(today, offset)}\u201D`}</Text>
        <View style={styles.row}>
          <Button label="Otra afirmación" variant="secondary" onPress={() => setOffset((value) => value + 1)} style={styles.flex} />
        </View>
        <Text style={styles.muted}>Léela en voz alta. Dos veces. Mirándote a los ojos.</Text>
      </Card>

      <Card>
        <SectionLabel>{alreadyChecked ? "Check-in de hoy (hecho)" : "Check-in de hoy"}</SectionLabel>
        <Text style={styles.question}>Del 1 al 10, ¿cuánto te respetas hoy?</Text>
        <View style={styles.scores}>
          {SCORES.map((score) => (
            <Pressable
              key={score}
              accessibilityRole="button"
              accessibilityLabel={`Puntuación ${score}`}
              accessibilityState={{ selected: confidence === score }}
              onPress={() => setConfidence(score)}
              style={({ pressed }) => [styles.score, confidence === score && styles.scoreActive, pressed && styles.pressed]}
            >
              <Text style={[styles.scoreText, confidence === score && styles.scoreTextActive]}>{score}</Text>
            </Pressable>
          ))}
        </View>
        <Field
          value={note}
          onChangeText={setNote}
          placeholder="Hoy me respeto porque..."
          maxLength={280}
          multiline
          style={styles.multiline}
        />
        <Button label={alreadyChecked ? "Actualizar check-in" : `Guardar (+${XP_REWARDS.mirror} XP)`} onPress={() => void saveCheckIn()} disabled={confidence === null} />
        {mirrorMessage ? <Text style={styles.success}>{mirrorMessage}</Text> : null}
      </Card>

      <Card>
        <SectionLabel>Tu confianza esta semana</SectionLabel>
        <BarChart items={week} color={FOCUS.violet} height={80} />
      </Card>

      <Card>
        <SectionLabel>Diario de pruebas</SectionLabel>
        <Text style={styles.muted}>Cada registro es una prueba de quién eres. +{XP_REWARDS.win} XP.</Text>
        <View style={styles.chips}>
          {WIN_KINDS.map((item) => (
            <Chip key={item} label={KIND_META[item].label} active={kind === item} color={KIND_META[item].color} onPress={() => setKind(item)} />
          ))}
        </View>
        <Field value={winText} onChangeText={setWinText} placeholder={KIND_META[kind].placeholder} maxLength={280} multiline style={styles.multiline} />
        <Button label="Registrar" onPress={() => void saveWin()} disabled={!winText.trim()} />
      </Card>

      {data.wins.slice(0, 20).map((win) => (
        <View key={win.id} style={[styles.win, { borderLeftColor: KIND_META[win.kind].color }]}>
          <View style={styles.flex}>
            <Text style={[styles.winKind, { color: KIND_META[win.kind].color }]}>
              {KIND_META[win.kind].label.toUpperCase()} · {new Date(win.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </Text>
            <Text style={styles.winText}>{win.text}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar registro"
            hitSlop={10}
            onPress={() => confirmRemove(win)}
            style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
          >
            <Text style={styles.deleteText}>{"\u00D7"}</Text>
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  affirmation: { color: FOCUS.text, fontSize: 20, lineHeight: 28, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  muted: { color: FOCUS.textMuted, fontSize: 13, lineHeight: 18 },
  question: { color: FOCUS.text, fontSize: 16, fontWeight: "700" },
  scores: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  score: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: FOCUS.surface,
    borderWidth: 1,
    borderColor: FOCUS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreActive: { backgroundColor: FOCUS.violet, borderColor: FOCUS.violet },
  scoreText: { color: FOCUS.text, fontSize: 16, fontWeight: "800" },
  scoreTextActive: { color: "#0B0B0F" },
  pressed: { opacity: 0.8 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  success: { color: FOCUS.success, fontSize: 13, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  win: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: FOCUS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FOCUS.border,
    borderLeftWidth: 4,
    padding: 14,
  },
  winKind: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  winText: { color: FOCUS.text, fontSize: 15, lineHeight: 21 },
  delete: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  deleteText: { color: FOCUS.textMuted, fontSize: 22, fontWeight: "600" },
});

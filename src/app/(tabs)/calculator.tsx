import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { readTrainingLogs, type TrainingLog } from "@/lib/fitness-storage";

const COLORS = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  ink: "#111113",
  secondary: "#777782",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
};

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      readTrainingLogs().then((next) => {
        if (active) setLogs(next);
      });
      return () => {
        active = false;
      };
    }, []),
  );
  const oneRepMax =
    weight && reps ? Math.round(Number(weight) * (1 + Number(reps) / 30)) : 0;
  const oneRmHistory = getOneRmHistory(logs);
  const oneRmMax = getOneRmMax(logs);
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={12}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
          ]}
        >
          <Animated.View entering={FadeInDown.duration(450)}>
            <Text style={styles.eyebrow}>HERRAMIENTA</Text>
            <Text style={styles.title}>Fuerza</Text>
            <Text style={styles.subtitle}>
              Calcula tu 1RM estimado y sigue tu progreso.
            </Text>
          </Animated.View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calculadora de 1RM</Text>
            <Text style={styles.cardHint}>
              Introduce los datos de una serie. El teclado quedara junto a estos
              campos.
            </Text>
            <View style={styles.inputs}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="next"
                placeholder="Peso (kg)"
                placeholderTextColor={COLORS.secondary}
                style={styles.input}
              />
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                inputMode="numeric"
                returnKeyType="done"
                placeholder="Repeticiones"
                placeholderTextColor={COLORS.secondary}
                style={styles.input}
              />
            </View>
            {oneRepMax > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.result}
              >
                <Text style={styles.resultLabel}>1RM ESTIMADO</Text>
                <Text style={styles.resultValue}>{oneRepMax} kg</Text>
                <Text style={styles.resultHint}>Formula de Epley</Text>
              </Animated.View>
            )}
          </View>
          <Text style={styles.sectionLabel}>Referencias rapidas</Text>
          <View style={styles.referenceCard}>
            <Reference
              label="60%"
              value={oneRepMax ? `${Math.round(oneRepMax * 0.6)} kg` : "--"}
            />
            <Reference
              label="75%"
              value={oneRepMax ? `${Math.round(oneRepMax * 0.75)} kg` : "--"}
            />
            <Reference
              label="85%"
              value={oneRepMax ? `${Math.round(oneRepMax * 0.85)} kg` : "--"}
            />
          </View>
          <Text style={styles.sectionLabel}>Evolución de 1RM</Text>
          <View style={styles.historyCard}>
            {oneRmHistory.length ? (
              oneRmHistory.map((record) => (
                <View key={record.date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{record.date}</Text>
                  <View style={styles.historyBarTrack}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          width: `${Math.max(8, (record.value / oneRmMax) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.historyValue}>{record.value} kg</Text>
                </View>
              ))
            ) : (
              <Text style={styles.historyEmpty}>
                Completa una sesión con peso para empezar tu histórico.
              </Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function getOneRmHistory(logs: TrainingLog[]) {
  return logs
    .flatMap((log) =>
      (log.oneRmRecords ?? []).map((record) => ({
        date: new Date(log.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
        value: record.value,
      })),
    )
    .slice(0, 6)
    .reverse();
}

function getOneRmMax(logs: TrainingLog[]) {
  return Math.max(
    1,
    ...logs.flatMap((log) =>
      (log.oneRmRecords ?? []).map((record) => record.value),
    ),
  );
}
function Reference({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.referenceItem}>
      <Text style={styles.referenceLabel}>{label}</Text>
      <Text style={styles.referenceValue}>{value}</Text>
    </View>
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
    marginBottom: 26,
  },
  card: { backgroundColor: COLORS.card, borderRadius: 22, padding: 18 },
  cardTitle: { color: COLORS.ink, fontSize: 19, fontWeight: "700" },
  cardHint: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },
  inputs: { gap: 10 },
  input: {
    height: 56,
    backgroundColor: COLORS.bg,
    borderRadius: 15,
    paddingHorizontal: 15,
    color: COLORS.ink,
    fontSize: 16,
  },
  result: {
    backgroundColor: "#EAF8EE",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  resultLabel: {
    color: "#248A3D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  resultValue: {
    color: COLORS.ink,
    fontSize: 32,
    fontWeight: "700",
    marginTop: 4,
  },
  resultHint: { color: "#248A3D", fontSize: 12, marginTop: 3 },
  sectionLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 26,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  referenceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  referenceItem: { alignItems: "center", flex: 1 },
  referenceLabel: { color: COLORS.secondary, fontSize: 12, fontWeight: "700" },
  referenceValue: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 7,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  historyDate: { width: 48, color: COLORS.secondary, fontSize: 11 },
  historyBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#E5E5EA",
    borderRadius: 5,
    overflow: "hidden",
  },
  historyBar: { height: "100%", backgroundColor: COLORS.blue, borderRadius: 5 },
  historyValue: {
    width: 52,
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  historyEmpty: { color: COLORS.secondary, fontSize: 13, lineHeight: 19 },
});

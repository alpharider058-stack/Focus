import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Chip, Field, ProgressBar } from "@/components/focus-ui";
import { FOCUS, MaxContentWidth } from "@/constants/theme";
import { createHabit, saveHabits, saveProfile, SUGGESTED_HABITS, type Profile } from "@/lib/focus-storage";

const STEPS = 3;
const IDENTITY_PLACEHOLDERS = [
  "Soy alguien que cumple su palabra",
  "Soy alguien que entrena aunque no tenga ganas",
  "Soy alguien que no se rinde",
];

export default function Onboarding({ onFinished }: { onFinished: (profile: Profile) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [identity, setIdentity] = useState<string[]>(["", "", ""]);
  const [selected, setSelected] = useState<string[]>(SUGGESTED_HABITS.slice(0, 3));
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const canContinue =
    step === 0
      ? name.trim().length >= 2
      : step === 1
        ? goal.trim().length >= 3 && identity.some((item) => item.trim().length > 0)
        : selected.length > 0;

  const options = [...SUGGESTED_HABITS, ...selected.filter((item) => !SUGGESTED_HABITS.includes(item))];

  const toggleHabit = (title: string) => {
    setSelected((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]));
  };

  const addCustom = () => {
    const clean = custom.trim().slice(0, 80);
    if (!clean || selected.includes(clean)) return;
    setSelected((prev) => [...prev, clean]);
    setCustom("");
  };

  const updateIdentity = (index: number, value: string) => {
    setIdentity((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    const profile: Profile = {
      name: name.trim(),
      goal: goal.trim(),
      identity: identity.map((item) => item.trim()).filter(Boolean),
      createdAt: Date.now(),
    };
    await saveHabits(selected.map((title) => createHabit(title)));
    await saveProfile(profile);
    onFinished(profile);
  };

  const next = () => {
    if (!canContinue) return;
    if (step < STEPS - 1) setStep(step + 1);
    else void finish();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.content}>
          <Text style={styles.brand}>FOCUS</Text>
          <ProgressBar value={(step + 1) / STEPS} />
          <Text style={styles.stepLabel}>
            Paso {step + 1} de {STEPS}
          </Text>

          {step === 0 ? (
            <View style={styles.block}>
              <Text style={styles.title}>Aquí se forja tu mejor versión.</Text>
              <Text style={styles.body}>
                Disciplina diaria, enfoque profundo y un ego que se gana a base de cumplir. Empecemos por lo básico.
              </Text>
              <Text style={styles.label}>¿Cómo te llamas?</Text>
              <Field value={name} onChangeText={setName} placeholder="Tu nombre" autoFocus maxLength={30} returnKeyType="next" onSubmitEditing={next} />
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.block}>
              <Text style={styles.title}>¿Quién decides ser?</Text>
              <Text style={styles.body}>
                Tu objetivo marca el rumbo. Tus frases de identidad te recuerdan cada día quién eres.
              </Text>
              <Text style={styles.label}>Tu gran objetivo</Text>
              <Field value={goal} onChangeText={setGoal} placeholder="Ej: Ser la persona más disciplinada que conozco" maxLength={100} />
              <Text style={styles.label}>Tu identidad (al menos una)</Text>
              {identity.map((item, index) => (
                <Field
                  key={IDENTITY_PLACEHOLDERS[index] ?? String(index)}
                  value={item}
                  onChangeText={(value) => updateIdentity(index, value)}
                  placeholder={IDENTITY_PLACEHOLDERS[index]}
                  maxLength={90}
                />
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.block}>
              <Text style={styles.title}>Tus juramentos diarios</Text>
              <Text style={styles.body}>
                Elige los hábitos que vas a cumplir cada día. Empieza con pocos y cúmplelos siempre.
              </Text>
              <View style={styles.chips}>
                {options.map((title) => (
                  <Chip key={title} label={title} active={selected.includes(title)} onPress={() => toggleHabit(title)} />
                ))}
              </View>
              <Text style={styles.label}>Añade el tuyo</Text>
              <View style={styles.row}>
                <Field
                  value={custom}
                  onChangeText={setCustom}
                  placeholder="Ej: Estudiar 1 hora"
                  style={styles.flex}
                  maxLength={80}
                  returnKeyType="done"
                  onSubmitEditing={addCustom}
                />
                <Button label="Añadir" variant="secondary" onPress={addCustom} disabled={!custom.trim()} />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            {step > 0 ? <Button label="Atrás" variant="secondary" onPress={() => setStep(step - 1)} style={styles.flex} /> : null}
            <Button
              label={step === STEPS - 1 ? "Empezar" : "Continuar"}
              onPress={next}
              disabled={!canContinue || saving}
              style={styles.flexWide}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FOCUS.bg },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: MaxContentWidth, alignSelf: "center", paddingHorizontal: 22, gap: 14, flexGrow: 1 },
  brand: { color: FOCUS.ember, fontSize: 14, fontWeight: "900", letterSpacing: 6 },
  stepLabel: { color: FOCUS.textMuted, fontSize: 12, fontWeight: "700" },
  block: { gap: 12, marginTop: 12 },
  title: { color: FOCUS.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  body: { color: FOCUS.textMuted, fontSize: 15, lineHeight: 22 },
  label: { color: FOCUS.text, fontSize: 14, fontWeight: "800", marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  flex: { flex: 1 },
  flexWide: { flex: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: "auto", paddingTop: 24 },
});

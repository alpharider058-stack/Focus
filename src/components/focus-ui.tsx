import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomTabInset, FOCUS, MaxContentWidth } from "@/constants/theme";

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function Loading() {
  return (
    <View style={[styles.root, styles.center]}>
      <ActivityIndicator color={FOCUS.ember} />
    </View>
  );
}

export function Header({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return <View style={[styles.card, accent ? { borderColor: `${accent}66` } : null, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export type ButtonVariant = "primary" | "secondary" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonVariants[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, buttonTextVariants[variant]]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
  color = FOCUS.ember,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: `${color}22`, borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color = FOCUS.ember, height = 8 }: { value: number; color?: string; height?: number }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const pct = Math.round(safe * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <View style={{ width: `${pct}%` as const, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function Stat({ label, value, suffix, color = FOCUS.text }: { label: string; value: string; suffix?: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>
        {value}
        {suffix ? <Text style={styles.statSuffix}> {suffix}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HabitRow({
  title,
  meta,
  done,
  onPress,
  onDelete,
}: {
  title: string;
  meta?: string;
  done: boolean;
  onPress: () => void;
  onDelete?: () => void;
}) {
  return (
    <View style={[styles.habitRow, done && styles.habitRowDone]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [styles.habitMain, pressed && styles.pressed]}
      >
        <View style={[styles.check, done && styles.checkDone]}>
          {done ? <Text style={styles.checkMark}>{"\u2713"}</Text> : null}
        </View>
        <View style={styles.flex}>
          <Text style={[styles.habitTitle, done && styles.habitTitleDone]}>{title}</Text>
          {meta ? <Text style={styles.habitMeta}>{meta}</Text> : null}
        </View>
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${title}`}
          hitSlop={10}
          onPress={onDelete}
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Text style={styles.deleteText}>{"\u00D7"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field(props: TextInputProps) {
  const { style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={FOCUS.textFaint}
      selectionColor={FOCUS.ember}
      {...rest}
      style={[styles.input, style]}
    />
  );
}

export function BarChart({
  items,
  color = FOCUS.ember,
  height = 96,
}: {
  items: { key: string; label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <View style={styles.chart}>
      {items.map((item) => (
        <View key={item.key} style={styles.chartCol}>
          <Text style={styles.chartValue}>{item.value > 0 ? String(item.value) : ""}</Text>
          <View style={[styles.chartTrack, { height }]}>
            <View
              style={{
                width: "100%",
                height: item.value > 0 ? Math.max(4, (item.value / max) * height) : 0,
                backgroundColor: color,
                borderRadius: 6,
              }}
            />
          </View>
          <Text style={styles.chartLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const buttonVariants = StyleSheet.create({
  primary: { backgroundColor: FOCUS.ember },
  secondary: { backgroundColor: FOCUS.cardHigh, borderWidth: 1, borderColor: FOCUS.border },
  danger: { backgroundColor: "transparent", borderWidth: 1, borderColor: FOCUS.danger },
});

const buttonTextVariants = StyleSheet.create({
  primary: { color: "#0B0B0F" },
  secondary: { color: FOCUS.text },
  danger: { color: FOCUS.danger },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FOCUS.bg },
  center: { alignItems: "center", justifyContent: "center" },
  content: { width: "100%", maxWidth: MaxContentWidth, alignSelf: "center", paddingHorizontal: 20, gap: 14 },
  flex: { flex: 1 },
  header: { marginBottom: 6, gap: 4 },
  eyebrow: { color: FOCUS.ember, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: { color: FOCUS.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: FOCUS.textMuted, fontSize: 15, lineHeight: 21 },
  card: {
    backgroundColor: FOCUS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: FOCUS.border,
    gap: 10,
  },
  sectionLabel: { color: FOCUS.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FOCUS.border,
    backgroundColor: FOCUS.surface,
  },
  chipText: { color: FOCUS.textMuted, fontSize: 14, fontWeight: "700" },
  track: { width: "100%", backgroundColor: FOCUS.surface, overflow: "hidden" },
  stat: {
    flex: 1,
    backgroundColor: FOCUS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FOCUS.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: "900" },
  statSuffix: { fontSize: 13, fontWeight: "700", color: FOCUS.textMuted },
  statLabel: { color: FOCUS.textMuted, fontSize: 12, fontWeight: "700" },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FOCUS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FOCUS.border,
    paddingRight: 8,
  },
  habitRowDone: { borderColor: `${FOCUS.success}55` },
  habitMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: FOCUS.textFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: FOCUS.success, borderColor: FOCUS.success },
  checkMark: { color: "#0B0B0F", fontSize: 16, fontWeight: "900" },
  habitTitle: { color: FOCUS.text, fontSize: 16, fontWeight: "700" },
  habitTitleDone: { color: FOCUS.textMuted, textDecorationLine: "line-through" },
  habitMeta: { color: FOCUS.textMuted, fontSize: 12, marginTop: 2 },
  delete: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deleteText: { color: FOCUS.textMuted, fontSize: 22, fontWeight: "600" },
  input: {
    backgroundColor: FOCUS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FOCUS.border,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: FOCUS.text,
    fontSize: 15,
  },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  chartCol: { flex: 1, alignItems: "center", gap: 6 },
  chartValue: { color: FOCUS.textMuted, fontSize: 11, fontWeight: "700", minHeight: 14 },
  chartTrack: {
    width: "100%",
    justifyContent: "flex-end",
    backgroundColor: FOCUS.surface,
    borderRadius: 6,
    overflow: "hidden",
  },
  chartLabel: { color: FOCUS.textMuted, fontSize: 12, fontWeight: "800" },
});

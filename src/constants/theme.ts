import "@/global.css";

import { Platform } from "react-native";

/**
 * FOCUS brand palette. Dark-only, "ember" identity:
 * fire orange for action, violet for mind, green for completed.
 */
export const FOCUS = {
  bg: "#08080C",
  surface: "#111117",
  card: "#16161E",
  cardHigh: "#1D1D27",
  border: "#262631",
  text: "#F5F5F7",
  textMuted: "#A1A1AE",
  textFaint: "#7C7C8A",
  ember: "#FF5A1F",
  emberSoft: "#FF8A5B",
  violet: "#8B7CFF",
  success: "#2ED47A",
  warning: "#FFB020",
  danger: "#FF4D5E",
} as const;

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: FOCUS.text,
    background: FOCUS.bg,
    backgroundElement: FOCUS.card,
    backgroundSelected: FOCUS.cardHigh,
    textSecondary: FOCUS.textMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

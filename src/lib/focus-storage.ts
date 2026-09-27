import AsyncStorage from "@react-native-async-storage/async-storage";

export type Profile = {
  name: string;
  goal: string;
  identity: string[];
  createdAt: number;
};

export type Habit = {
  id: string;
  title: string;
  xp: number;
  createdAt: number;
};

export type DayLog = {
  date: string;
  habitsDone: string[];
  focusMinutes: number;
  confidence: number | null;
  mirrorNote: string;
};

export type WinKind = "victoria" | "gratitud" | "leccion";

export type Win = {
  id: string;
  date: string;
  text: string;
  kind: WinKind;
};

export type FocusSession = {
  id: string;
  date: string;
  minutes: number;
  intent: string;
};

export type ActiveFocus = {
  id: string;
  intent: string;
  durationMin: number;
  /** Timestamp of the last start or resume. */
  startedAt: number;
  /** Seconds accumulated before the last start or resume. */
  elapsedBefore: number;
  paused: boolean;
};

export type Snapshot = {
  profile: Profile | null;
  habits: Habit[];
  logs: Record<string, DayLog>;
  xp: number;
  wins: Win[];
  sessions: FocusSession[];
  active: ActiveFocus | null;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export const XP_REWARDS = { habit: 15, focusMinute: 1, mirror: 10, win: 5 } as const;

export const SUGGESTED_HABITS: string[] = [
  "Levantarme a la primera alarma",
  "Entrenar o moverme 30 minutos",
  "Leer 10 páginas",
  "Cero redes sociales antes de las 12:00",
  "Ducha fría",
  "Planificar el día siguiente",
  "Beber 2 litros de agua",
  "Meditar 10 minutos",
];

export const WIN_KINDS: WinKind[] = ["victoria", "gratitud", "leccion"];

export const LEVEL_TITLES: { level: number; title: string }[] = [
  { level: 1, title: "Aprendiz" },
  { level: 3, title: "Constante" },
  { level: 5, title: "Firme" },
  { level: 8, title: "Implacable" },
  { level: 12, title: "Élite" },
  { level: 18, title: "Leyenda" },
];

const KEYS = {
  profile: "focus-profile",
  habits: "focus-habits",
  logs: "focus-logs",
  wins: "focus-wins",
  sessions: "focus-sessions",
  xp: "focus-xp",
  active: "focus-active",
} as const;

const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

const resetListeners = new Set<() => void>();

/** Lets the root layout react when all data is wiped. */
export function subscribeReset(listener: () => void): () => void {
  resetListeners.add(listener);
  return () => {
    resetListeners.delete(listener);
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(date: Date, count: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function parseDateKey(key: string): Date {
  const parts = key.split("-").map(Number);
  return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- Profile ---------- */

export async function getProfile(): Promise<Profile | null> {
  const raw = await readJson(KEYS.profile);
  if (!isRecord(raw) || typeof raw.name !== "string") return null;
  return {
    name: raw.name,
    goal: typeof raw.goal === "string" ? raw.goal : "",
    identity: Array.isArray(raw.identity)
      ? raw.identity.filter((item): item is string => typeof item === "string")
      : [],
    createdAt: Number(raw.createdAt) || Date.now(),
  };
}

export async function saveProfile(profile: Profile): Promise<void> {
  await writeJson(KEYS.profile, profile);
}

/* ---------- Habits ---------- */

export function createHabit(title: string): Habit {
  return {
    id: makeId("habit"),
    title: title.trim().slice(0, 80),
    xp: XP_REWARDS.habit,
    createdAt: Date.now(),
  };
}

export async function getHabits(): Promise<Habit[]> {
  const raw = await readJson(KEYS.habits);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): Habit[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string") return [];
    const xp = Number(item.xp);
    return [{
      id: item.id,
      title: item.title,
      xp: Number.isFinite(xp) && xp > 0 ? Math.round(xp) : XP_REWARDS.habit,
      createdAt: Number(item.createdAt) || 0,
    }];
  });
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await writeJson(KEYS.habits, habits);
}

export async function addHabit(title: string): Promise<Habit | null> {
  const clean = title.trim();
  if (!clean) return null;
  const habits = await getHabits();
  if (habits.some((habit) => habit.title.toLowerCase() === clean.toLowerCase())) return null;
  const habit = createHabit(clean);
  await saveHabits([...habits, habit]);
  return habit;
}

export async function removeHabit(id: string): Promise<void> {
  const habits = await getHabits();
  await saveHabits(habits.filter((habit) => habit.id !== id));
}

/* ---------- Daily logs ---------- */

export function emptyLog(date: string): DayLog {
  return { date, habitsDone: [], focusMinutes: 0, confidence: null, mirrorNote: "" };
}

function normalizeLog(date: string, value: unknown): DayLog {
  if (!isRecord(value)) return emptyLog(date);
  const confidence = Number(value.confidence);
  const hasConfidence = value.confidence !== null && value.confidence !== undefined && Number.isFinite(confidence);
  return {
    date,
    habitsDone: Array.isArray(value.habitsDone)
      ? [...new Set(value.habitsDone.filter((id): id is string => typeof id === "string"))]
      : [],
    focusMinutes: Math.max(0, Math.floor(Number(value.focusMinutes) || 0)),
    confidence: hasConfidence ? Math.min(10, Math.max(1, Math.round(confidence))) : null,
    mirrorNote: typeof value.mirrorNote === "string" ? value.mirrorNote : "",
  };
}

export async function getLogs(): Promise<Record<string, DayLog>> {
  const raw = await readJson(KEYS.logs);
  if (!isRecord(raw)) return {};
  const result: Record<string, DayLog> = {};
  for (const [date, value] of Object.entries(raw)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) result[date] = normalizeLog(date, value);
  }
  return result;
}

async function saveLogs(logs: Record<string, DayLog>): Promise<void> {
  await writeJson(KEYS.logs, logs);
}

/** Toggles a habit for today. Returns true if it is now completed. */
export async function toggleHabit(habitId: string): Promise<boolean> {
  const habits = await getHabits();
  const habit = habits.find((item) => item.id === habitId);
  if (!habit) return false;
  const today = dateKey();
  const logs = await getLogs();
  const log = logs[today] ?? emptyLog(today);
  const wasDone = log.habitsDone.includes(habitId);
  logs[today] = {
    ...log,
    habitsDone: wasDone
      ? log.habitsDone.filter((id) => id !== habitId)
      : [...log.habitsDone, habitId],
  };
  await saveLogs(logs);
  await addXp(wasDone ? -habit.xp : habit.xp);
  return !wasDone;
}

/** Saves today's confidence check-in. Returns true if it was the first one today (XP granted). */
export async function saveMirror(confidence: number, note: string): Promise<boolean> {
  const today = dateKey();
  const logs = await getLogs();
  const log = logs[today] ?? emptyLog(today);
  const first = log.confidence === null;
  logs[today] = {
    ...log,
    confidence: Math.min(10, Math.max(1, Math.round(confidence))),
    mirrorNote: note.trim().slice(0, 280),
  };
  await saveLogs(logs);
  if (first) await addXp(XP_REWARDS.mirror);
  return first;
}

/* ---------- XP & levels ---------- */

export async function getXp(): Promise<number> {
  const value = Number(await AsyncStorage.getItem(KEYS.xp));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export async function addXp(delta: number): Promise<void> {
  const next = Math.max(0, (await getXp()) + Math.round(delta));
  await AsyncStorage.setItem(KEYS.xp, String(next));
}

export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

export function levelInfo(xp: number): {
  level: number;
  title: string;
  floor: number;
  next: number;
  progress: number;
} {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  let title = LEVEL_TITLES[0]?.title ?? "Aprendiz";
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.level) title = entry.title;
  }
  return { level, title, floor, next, progress: (xp - floor) / (next - floor) };
}

/* ---------- Wins journal ---------- */

export async function getWins(): Promise<Win[]> {
  const raw = await readJson(KEYS.wins);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): Win[] => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.text !== "string") return [];
    const kind = WIN_KINDS.find((value) => value === item.kind) ?? "victoria";
    return [{
      id: item.id,
      text: item.text,
      kind,
      date: typeof item.date === "string" ? item.date : new Date().toISOString(),
    }];
  });
}

export async function addWin(text: string, kind: WinKind): Promise<Win | null> {
  const clean = text.trim();
  if (!clean) return null;
  const win: Win = { id: makeId("win"), date: new Date().toISOString(), text: clean.slice(0, 280), kind };
  const wins = await getWins();
  await writeJson(KEYS.wins, [win, ...wins].slice(0, 200));
  await addXp(XP_REWARDS.win);
  return win;
}

export async function removeWin(id: string): Promise<void> {
  const wins = await getWins();
  if (!wins.some((win) => win.id === id)) return;
  await writeJson(KEYS.wins, wins.filter((win) => win.id !== id));
  await addXp(-XP_REWARDS.win);
}

/* ---------- Focus sessions ---------- */

export async function getActiveFocus(): Promise<ActiveFocus | null> {
  const raw = await readJson(KEYS.active);
  if (!isRecord(raw) || typeof raw.id !== "string") return null;
  const durationMin = Number(raw.durationMin);
  if (!Number.isFinite(durationMin) || durationMin <= 0) return null;
  return {
    id: raw.id,
    intent: typeof raw.intent === "string" ? raw.intent : "",
    durationMin,
    startedAt: Number(raw.startedAt) || Date.now(),
    elapsedBefore: Math.max(0, Number(raw.elapsedBefore) || 0),
    paused: Boolean(raw.paused),
  };
}

export async function saveActiveFocus(active: ActiveFocus | null): Promise<void> {
  if (!active) {
    await AsyncStorage.removeItem(KEYS.active);
    return;
  }
  await writeJson(KEYS.active, active);
}

export function focusElapsedSeconds(active: ActiveFocus, now = Date.now()): number {
  const running = active.paused ? 0 : Math.max(0, (now - active.startedAt) / 1000);
  return Math.min(active.durationMin * 60, active.elapsedBefore + running);
}

export async function getSessions(): Promise<FocusSession[]> {
  const raw = await readJson(KEYS.sessions);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): FocusSession[] => {
    if (!isRecord(item) || typeof item.id !== "string") return [];
    const minutes = Number(item.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return [];
    return [{
      id: item.id,
      date: typeof item.date === "string" ? item.date : new Date().toISOString(),
      minutes: Math.floor(minutes),
      intent: typeof item.intent === "string" ? item.intent : "",
    }];
  });
}

/** Closes the active session, logs minutes and grants XP. Returns XP earned. */
export async function completeFocus(intent: string, minutes: number): Promise<number> {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  await saveActiveFocus(null);
  if (safeMinutes < 1) return 0;
  const session: FocusSession = {
    id: makeId("focus"),
    date: new Date().toISOString(),
    minutes: safeMinutes,
    intent: intent.trim().slice(0, 120),
  };
  const sessions = await getSessions();
  await writeJson(KEYS.sessions, [session, ...sessions].slice(0, 200));
  const today = dateKey();
  const logs = await getLogs();
  const log = logs[today] ?? emptyLog(today);
  logs[today] = { ...log, focusMinutes: log.focusMinutes + safeMinutes };
  await saveLogs(logs);
  const xp = safeMinutes * XP_REWARDS.focusMinute;
  await addXp(xp);
  return xp;
}

/* ---------- Stats ---------- */

export function isActiveDay(log: DayLog | undefined): boolean {
  return Boolean(log && (log.habitsDone.length > 0 || log.focusMinutes > 0 || log.confidence !== null));
}

function countBackwards(check: (key: string) => boolean): number {
  const today = new Date();
  let cursor = check(dateKey(today)) ? today : addDays(today, -1);
  let count = 0;
  while (check(dateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function computeStreak(logs: Record<string, DayLog>): { current: number; best: number } {
  const current = countBackwards((key) => isActiveDay(logs[key]));
  const activeDates = Object.keys(logs).filter((key) => isActiveDay(logs[key])).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of activeDates) {
    run = previous && dateKey(addDays(parseDateKey(previous), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return { current, best: Math.max(best, current) };
}

export function habitStreak(logs: Record<string, DayLog>, habitId: string): number {
  return countBackwards((key) => Boolean(logs[key]?.habitsDone.includes(habitId)));
}

export function lastDays(count = 7): { key: string; label: string }[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const day = addDays(today, index - (count - 1));
    return { key: dateKey(day), label: WEEKDAY_LABELS[day.getDay()] ?? "" };
  });
}

export function getTotals(snapshot: Snapshot): {
  totalHabits: number;
  totalFocus: number;
  mirrorDays: number;
  activeDays: number;
} {
  const logs = Object.values(snapshot.logs);
  return {
    totalHabits: logs.reduce((sum, log) => sum + log.habitsDone.length, 0),
    totalFocus: logs.reduce((sum, log) => sum + log.focusMinutes, 0),
    mirrorDays: logs.filter((log) => log.confidence !== null).length,
    activeDays: logs.filter((log) => isActiveDay(log)).length,
  };
}

export function getAchievements(input: {
  xp: number;
  bestStreak: number;
  totalHabits: number;
  totalFocus: number;
  wins: number;
  mirrorDays: number;
}): Achievement[] {
  const { level } = levelInfo(input.xp);
  return [
    { id: "first", title: "Primer paso", description: "Cumple tu primer hábito", unlocked: input.totalHabits >= 1 },
    { id: "streak3", title: "Encendido", description: "Racha de 3 días", unlocked: input.bestStreak >= 3 },
    { id: "streak7", title: "Semana de hierro", description: "Racha de 7 días", unlocked: input.bestStreak >= 7 },
    { id: "streak30", title: "Imparable", description: "Racha de 30 días", unlocked: input.bestStreak >= 30 },
    { id: "focus100", title: "Mente afilada", description: "100 minutos de enfoque", unlocked: input.totalFocus >= 100 },
    { id: "focus1000", title: "Monje", description: "1000 minutos de enfoque", unlocked: input.totalFocus >= 1000 },
    { id: "wins10", title: "Coleccionista", description: "Registra 10 victorias", unlocked: input.wins >= 10 },
    { id: "mirror7", title: "Frente al espejo", description: "7 check-ins de confianza", unlocked: input.mirrorDays >= 7 },
    { id: "level5", title: "Nivel 5", description: "Alcanza el nivel 5", unlocked: level >= 5 },
    { id: "level10", title: "Nivel 10", description: "Alcanza el nivel 10", unlocked: level >= 10 },
  ];
}

/* ---------- Snapshot & reset ---------- */

export async function loadSnapshot(): Promise<Snapshot> {
  const [profile, habits, logs, xp, wins, sessions, active] = await Promise.all([
    getProfile(),
    getHabits(),
    getLogs(),
    getXp(),
    getWins(),
    getSessions(),
    getActiveFocus(),
  ]);
  return { profile, habits, logs, xp, wins, sessions, active };
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  resetListeners.forEach((listener) => listener());
}

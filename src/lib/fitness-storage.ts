import AsyncStorage from "@react-native-async-storage/async-storage";

export type TrainingLog = {
  id: string;
  date: string;
  routineId?: string;
  routineName: string;
  volumeKg: number;
  sets: number;
  minutes: number;
  xp?: number;
  muscleVolumes?: Record<string, number>;
  oneRmRecords?: Array<{
    exercise: string;
    value: number;
  }>;
  averageRpe?: number;
  averageRir?: number;
};

export const TRAINING_LOG_KEY = "pulse-training-log";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function readTrainingLogs(): Promise<TrainingLog[]> {
  const stored = await AsyncStorage.getItem(TRAINING_LOG_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as TrainingLog[];
  } catch {
    return [];
  }
}

export async function saveTrainingLog(log: TrainingLog) {
  const logs = await readTrainingLogs();
  const next = [log, ...logs.filter((item) => item.id !== log.id)];
  await AsyncStorage.setItem(TRAINING_LOG_KEY, JSON.stringify(next));
  return next;
}

export function getTrainingStreakWeeks(logs: TrainingLog[], date = new Date()) {
  const trainedWeeks = new Set(
    logs.map((log) => getDateKey(getWeekStart(new Date(log.date)))),
  );
  let streak = 0;
  const cursor = getWeekStart(date);
  while (trainedWeeks.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function getTotalXp(logs: TrainingLog[]) {
  return logs.reduce(
    (total, log) => total + (log.xp ?? Math.max(25, log.sets * 2)),
    0,
  );
}

export function getAchievements(logs: TrainingLog[]) {
  const totalSets = logs.reduce((total, log) => total + log.sets, 0);
  const streakWeeks = getTrainingStreakWeeks(logs);
  const records = logs.flatMap((log) => log.oneRmRecords ?? []);
  const bestOneRm = records.length
    ? Math.max(...records.map((record) => record.value))
    : 0;
  return [
    {
      id: "first-session",
      title: "Primer entrenamiento",
      unlocked: logs.length > 0,
    },
    {
      id: "hundred-sets",
      title: "100 series completadas",
      unlocked: totalSets >= 100,
    },
    {
      id: "streak-three",
      title: "Racha de 3 semanas",
      unlocked: streakWeeks >= 3,
    },
    {
      id: "strong-start",
      title: "Primer récord de 1RM",
      unlocked: bestOneRm > 0,
    },
  ];
}

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

export function getWeeklySummary(logs: TrainingLog[], date = new Date()) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekly = logs.filter((log) => {
    const loggedAt = new Date(log.date);
    return loggedAt >= weekStart && loggedAt < weekEnd;
  });
  const days = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(weekStart);
    target.setDate(target.getDate() + index);
    const key = getDateKey(target);
    return weekly.some((log) => getDateKey(new Date(log.date)) === key);
  });
  return {
    volume: weekly.reduce((total, log) => total + log.volumeKg, 0),
    sets: weekly.reduce((total, log) => total + log.sets, 0),
    minutes: weekly.reduce((total, log) => total + log.minutes, 0),
    activeDays: days.filter(Boolean).length,
    days,
  };
}

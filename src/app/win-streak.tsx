import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInUp,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

export default function WinStreakScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [victories, setVictories] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  [bestStreak, setBestStreak] = useState(0);
  [newVictory, setNewVictory] = useState("");
  [isAdding, setIsAdding] = useState(false);
  [lastVictoryDate, setLastVictoryDate] = useState("");
  [streakFire, setStreakFire] = useState(0);

  const fireScale = useSharedValue(1);
  const fireScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const victoryItems = [
    { id: 1, icon: "💪", label: "Entrenamiento intenso", color: "#EF4444" },
    { id: 2, icon: "💼", label: "Cerré un trato importante", color: "#3B82F6" },
    { id: 3, icon: "🍎", label: "Resistí una tentación", color: "#10B981" },
    { id: 4, icon: "🧠", label: "Aprendí algo nuevo", color: "#8B5CF6" },
    { id: 5, icon: "⏰", label: "Me levanté temprano", color: "#F59E0B" },
    { id: 6, icon: "🤝", label: "Ayudé a alguien", color: "#EC4899" },
    { id: 7, icon: "📚", label: "Terminé un libro", color: "#6366F1" },
    { id: 8, icon: "🎯", label: "Alcancé una meta pequeña", color: "#14B8A6" },
  ];

  useEffect(() => {
    const loadData = async () => {
      const savedVictories = await AsyncStorage.getItem("victory_log");
      const streakData = await AsyncStorage.getItem("win_streak_data");

      if (savedVictories) {
        try {
          const parsed = JSON.parse(savedVictories);
          setVictories(parsed);

          // Calculate current streak
          const today = new Date().toDateString();
          const lastDate = parsed.length > 0 ?
            new Date(parsed[parsed.length - 1].date).toDateString() : "";

          if (lastDate === today) {
            // Already added today, just load streak
            const data = streakData ? JSON.parse(streakData) : { current: 0, best: 0 };
            setCurrentStreak(data.current);
            setBestStreak(data.best);
          } else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
            // Yesterday - streak continues
            const data = streakData ? JSON.parse(streakData) : { current: 0, best: 0 };
            setCurrentStreak(data.current);
            setBestStreak(data.best);
          } else {
            // Streak broken
            setCurrentStreak(0);
            setBestStreak(Math.max(data.best, 0));
          }
        } catch (e) {
          console.log("Error loading victories:", e);
        }
      }

      // Load streak fire animation state
      const fireData = await AsyncStorage.getItem("streak_fire");
      if (fireData) {
        setStreakFire(JSON.parse(fireData));
      }
    };

    loadData();
  }, []);

  const addVictory = async (victoryId) => {
    const victory = victoryItems.find(v => v.id === victoryId);
    if (!victory) return;

    setIsAdding(true);

    // Fire animation
    fireScale.value = withSpring(0.8);
    setTimeout(() => {
      fireScale.value = withSpring(1.2);
    }, 100);
    setTimeout(() => {
      fireScale.value = withSpring(1.0);
    }, 300);

    const newEntry = {
      id: Date.now(),
      victoryId: victory.id,
      icon: victory.icon,
      label: victory.label,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    setVictories(prev => [newEntry, ...prev]);
    setNewVictory(victory.label);

    // Update streak
    const today = new Date().toDateString();
    const lastDate = lastVictoryDate;

    let newStreak = currentStreak;
    if (lastDate === today) {
      // Already counted today
      newStreak = currentStreak;
    } else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
      // Continues streak
      newStreak = currentStreak + 1;
    } else {
      // New streak
      newStreak = 1;
    }

    setCurrentStreak(newStreak);
    setBestStreak(Math.max(bestStreak, newStreak));
    setLastVictoryDate(today);

    // Save data
    await AsyncStorage.setItem(
      "victory_log",
      JSON.stringify([newEntry, ...victories].slice(0, 50)) // Keep last 50
    );

    await AsyncStorage.setItem(
      "win_streak_data",
      JSON.stringify({ current: newStreak, best: Math.max(bestStreak, newStreak) })
    );

    // Update fire animation
    const newFire = Math.min(10, streakFire + 1);
    setStreakFire(newFire);
    await AsyncStorage.setItem("streak_fire", JSON.stringify(newFire));

    setIsAdding(false);

    // Show motivational message after streak milestone
    if (newStreak > 0 && newStreak % 3 === 0) {
      setTimeout(() => {
        // In a real app, this would show a special message
        console.log(`¡Racha de ${newStreak}! Eres imparable!`);
      }, 1000);
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Cada victoria te hace más fuerte",
      "El éxito se construye día a día",
      "Tu constancia es tu mayor poder",
      "Pequeñas acciones, grandes resultados",
      "No se trata de la perfección, se trata de la persistencia",
      "Cada día que ganas, eres mejor que ayer",
      "El camino de mil millas comienza con un paso",
      "Tu racha de victorias es tu legado",
      "Ganar es un hábito, no un evento",
      "La constancia vence al talento cuando el talento no trabaja duro"
    ];
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>RACHA DE VICTORIAS</Text>
          <Text style={styles.subtitle}>Construye tu imperio victoria por victoria</Text>
        </View>

        <View style={styles.streakContainer}>
          <View style={styles.fireContainer}>
            <Animated.View style={[styles.fireBase, fireScaleStyle]}>
              {streakFire > 0 && (
                <View style={styles.fireFlames}>
                  {[1, 2, 3, 4, 5].map((i, index) => (
                    <View key={index} style={[
                      styles.flame,
                      {
                        opacity: streakFire >= (index + 1) * 2 ? 0.8 : 0.3,
                        transform: [{
                          translateY: streakFire >= (index + 1) * 2 ? -index * 2 : 0,
                          scaleX: streakFire >= (index + 1) * 2 ? 1 : 0.7
                        }]
                      }
                    ]} />
                  ))}
                </View>
              )}
              <Text style={styles.fireText}>
                {currentStreak}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>RACHA ACTUAL</Text>
            <Text style={styles.streakNumber}>{currentStreak} días</Text>
            <Text style={styles.bestLabel}>MEJOR RACHA</Text>
            <Text style={styles.bestNumber}>{bestStreak} días</Text>
          </View>
        </View>

        <View style={styles.victoryGrid}>
          {victoryItems.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.victoryCard,
                isAdding && styles.victoryCardDisabled
              ]}
              onPress={() => !isAdding && addVictory(item.id)}
              disabled={isAdding}
            >
              <View style={styles.victoryIconBg}>
                <Text style={styles.victoryIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.victoryLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {newVictory && (
          <View style={styles.victoryConfirm}>
            <Text style={styles.victoryConfirmText}>
              ¡{newVictory}! +1 a tu racha
            </Text>
          </View>
        )}

        <View style={styles.streakTip}>
          <Text style={styles.tipText}>
            💡 {getMotivationalMessage()}
          </Text>
        </View>

        <View style={styles.recentVictories}>
          <Text style={styles.sectionTitle}>ÚLTIMAS VICTORIAS</Text>
          {victories.length === 0 ? (
            <Text style={styles.emptyState}>
              Aún no tienes victorias registradas.
              ¡Comienza tu racha hoy!
            </Text>
          ) : (
            <FlatList
              data={victories.slice(0, 5)}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.victoryItem}>
                  <View style={[
                    styles.victoryDot,
                    { backgroundColor: victoryItems.find(v => v.id === item.victoryId)?.color || "#6B7280" }
                  ]} />
                  <View style={styles.victoryItemText}>
                    <Text style={styles.victoryItemLabel}>{item.label}</Text>
                    <Text style={styles.victoryItemDate}>
                      {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyState}>
                  Sigue agregando victorias para ver tu historial
                </Text>
              }
            />
          )}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.backButtonText}>← Volver al inicio</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
  },
  streakContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  fireContainer: {
    position: "relative",
    width: 120,
    height: 160,
  },
  fireBase: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 20,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
  },
  fireFlames: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
  },
  flame: {
    position: "absolute",
    width: 8,
    height: 12,
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    opacity: 0.6,
  },
  fireText: {
    position: "absolute",
    bottom: 10,
    fontSize: 36,
    fontWeight: "900",
    color: "#FBBF24",
  },
  streakInfo: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  streakLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FBBF24",
    marginTop: 4,
  },
  bestLabel: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bestNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 4,
  },
  victoryGrid: {
    width: "100%",
    marginBottom: 24,
  },
  victoryCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    padding: 16,
    margin: 8,
    alignItems: "center",
  },
  victoryCardDisabled: {
    opacity: 0.5,
  },
  victoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  victoryIcon: {
    fontSize: 24,
  },
  victoryLabel: {
    fontSize: 14,
    color: "#F8FAFC",
    textAlign: "center",
    maxWidth: 80,
  },
  victoryConfirm: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  victoryConfirmText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    textAlign: "center",
  },
  streakTip: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  tipText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    fontStyle: "italic",
  },
  recentVictories: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 12,
    textAlign: "left",
  },
  emptyState: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    padding: 24,
    fontStyle: "italic",
  },
  victoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 12,
    marginVertical: 4,
  },
  victoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  victoryItemText: {
    flex: 1,
  },
  victoryItemLabel: {
    fontSize: 14,
    color: "#F8FAFC",
  },
  victoryItemDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 41, 59, 0.2)",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 12,
  },
  backButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
};
import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, Image } from "react-native";
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

export default function ConfrontationModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [newChallenge, setNewChallenge] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [progress, setProgress] = useState(0);

  const impactScale = useSharedValue(1);
  const impactStyle = useAnimatedStyle(() => ({
    transform: [{ scale: impactScale.value }],
  }));

  const defaultChallenges = [
    { id: 1, type: "past_self", label: "Mi versión de hace 6 meses", icon: "🔄" },
    { id: 2, type: "rival", label: "Ese compañero que siempre me supera", icon: "⚔️" },
    { id: 3, type: "goal", label: "Correr un maratón", icon: "🏃‍♂️" },
    { id: 4, type: "fear", label: "Mi miedo al fracaso", icon: "😨" },
    { id: 5, type: "habit", label: "Mi procrastinación crónica", icon: "⏳" },
  ];

  useEffect(() => {
    const loadChallenges = async () => {
      const saved = await AsyncStorage.getItem("confrontation_challenges");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChallenges(parsed);

          // Load active challenge and progress
          const activeId = await AsyncStorage.getItem("active_challenge");
          if (activeId) {
            setActiveChallengeId(activeId);

            const progressData = await AsyncStorage.getItem(`challenge_progress_${activeId}`);
            if (progressData) {
              setProgress(JSON.parse(progressData));
            }
          }
        } catch (e) {
          console.log("Error loading challenges:", e);
          setChallenges(defaultChallenges.slice(0, 3));
        }
      } else {
        // Set defaults
        setChallenges(defaultChallenges.slice(0, 3));
        await AsyncStorage.setItem("confrontation_challenges", JSON.stringify(defaultChallenges.slice(0, 3)));
      }
    };

    loadChallenges();
  }, []);

  useEffect(() => {
    // Save challenges when they change
    if (challenges.length > 0) {
      AsyncStorage.setItem("confrontation_challenges", JSON.stringify(challenges));
    }
  }, [challenges]);

  useEffect(() => {
    // Save active challenge and progress
    if (activeChallengeId) {
      AsyncStorage.setItem("active_challenge", activeChallengeId);
      AsyncStorage.setItem(`challenge_progress_${activeChallengeId}`, JSON.stringify(progress));
    }
  }, [activeChallengeId, progress]);

  const startImpact = () => {
    impactScale.value = withSpring(0.8);
    setTimeout(() => {
      impactScale.value = withSpring(1.3);
    }, 100);
    setTimeout(() => {
      impactScale.value = withSpring(1.0);
    }, 300);
  };

  const addChallenge = () => {
    if (newChallenge.trim() !== "") {
      const newId = Date.now();
      setChallenges(prev => [
        ...prev,
        {
          id: newId,
          type: "custom",
          label: newChallenge.trim(),
          icon: "🎯",
        }
      ]);
      setNewChallenge("");
    }
  };

  const updateChallenge = (index) => {
    setEditingIndex(index);
    setNewChallenge(challenges[index].label);
  };

  const saveChallenge = (index) => {
    if (newChallenge.trim() !== "") {
      const updated = [...challenges];
      updated[index] = {
        ...updated[index],
        label: newChallenge.trim(),
      };
      setChallenges(updated);
      setNewChallenge("");
      setEditingIndex(-1);
    }
  };

  const deleteChallenge = (index) => {
    const updated = challenges.filter((_, i) => i !== index);
    setChallenges(updated);
    if (editingIndex === index) {
      setNewChallenge("");
      setEditingIndex(-1);
    }

    // If deleting active challenge, reset
    if (activeChallengeId === challenges[index].id) {
      setActiveChallengeId(null);
      setProgress(0);
      AsyncStorage.removeItem("active_challenge");
      AsyncStorage.removeItem(`challenge_progress_${challenges[index].id}`);
    }
  };

  const selectChallenge = (challengeId) => {
    setActiveChallengeId(challengeId);
    // Load progress for this challenge
    AsyncStorage.getItem(`challenge_progress_${challengeId}`).then((saved) => {
      if (saved) {
        try {
          setProgress(JSON.parse(saved));
        } catch (e) {
          setProgress(0);
        }
      } else {
        setProgress(0);
      }
    });
  };

  const advanceProgress = () => {
    if (activeChallengeId && progress < 100) {
      const newProgress = Math.min(100, progress + 10);
      setProgress(newProgress);

      // Impact animation
      startImpact();

      // Save progress
      AsyncStorage.setItem(`challenge_progress_${activeChallengeId}`, JSON.stringify(newProgress));

      // Check if completed
      if (newProgress >= 100) {
        setTimeout(() => {
          // In a real app, show victory celebration
          console.log("¡Desafío completado! Has superado tu reto.");
        }, 1000);
      }
    }
  };

  const getChallengeTypeLabel = (type) => {
    const labels = {
      past_self: "Versión Pasada de Ti Mismo",
      rival: "Rival o Competidor",
      goal: "Meta o Objetivo",
      fear: "Miedo o Limitación",
      habit: "Hábito Negativo",
      custom: "Desafío Personalizado"
    };
    return labels[type] || type;
  };

  const getChallengeTypeColor = (type) => {
    const colors = {
      past_self: "#8B5CF6",
      rival: "#EC4899",
      goal: "#10B981",
      fear: "#F59E0B",
      habit: "#EF4444",
      custom: "#6366F1"
    };
    return colors[type] || "#6B7280";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>MODO CONFRONTACIÓN</Text>
          <Text style={styles.subtitle}>
            Visualiza y supera tus rivales y retos
          </Text>
        </View>

        {activeChallengeId ? (
          <View style={activeChallengeContainer}>
            <View style={activeChallengeHeader}>
              <Text style={activeChallengeTitle}>DESAFÍO ACTIVO</Text>
              <Pressable style={closeButton} onPress={() => {
                setActiveChallengeId(null);
                setProgress(0);
              }}>
                <Text style={closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={challengeInfo}>
              <View style={challengeIconBg}>
                <Text style={challengeIcon}>
                  {challenges.find(c => c.id === activeChallengeId)?.icon || "❓"}
                </Text>
              </View>
              <View style={challengeDetails}>
                <Text style={challengeLabel}>
                  {challenges.find(c => c.id === activeChallengeId)?.label || "Desafío desconocido"}
                </Text>
                <Text style={challengeType}>
                  ({getChallengeTypeLabel(challenges.find(c => c.id === activeChallengeId)?.type || "")})
                </Text>
              </View>
            </View>

            <View style={progressContainer}>
              <Text style={progressLabel}>PROGRESO</Text>
              <View style={progressBarBackground}>
                <View style={[
                  progressBarFill,
                  { width: `${progress}%` }
                ]} />
              </View>
              <Text style={progressText}>
                {progress}%
              </Text>
            </View>

            <View style={impactContainer}>
              <Animated.View style={[impactCircle, impactStyle]}>
                <Text style={impactText}>⚡</Text>
              </Animated.View>
              <Text style={impactLabel}>
                Impacto de superación
              </Text>
            </View>

            <Pressable style={advanceButton} onPress={advanceProgress}>
              <Text style={advanceButtonText}>
                AVANZAR (+10%)
              </Text>
            </Pressable>

            {progress >= 100 && (
              <View style={victoryBanner}>
                <Text style={victoryText}>
                  ¡DESAFÍO SUPERADO!
                </Text>
                <Text style={victorySubtext}>
                  Has ganado terreno en tu batalla interna
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={challengesListContainer}>
            <Text style={sectionTitle}>
              TUS DESAFÍOS Y RIVALES
            </Text>
            <Text style={sectionSubtitle}>
              Elige a quién o qué quieres superar
            </Text>

            <View style={challengeInputContainer}>
              <TextInput
                placeholder="Describe tu reto o rival (ej: Mi versión perezosa, Ese colega que me supera)"
                value={newChallenge}
                onChangeText={setNewChallenge}
                style={challengeInput}
                autoFocus={editingIndex === -1}
                placeholderTextColor="#64748B"
              />
              {editingIndex !== -1 ? (
                <View style={buttonGroup}>
                  <Pressable style={updateButton} onPress={() => saveChallenge(editingIndex)}>
                    <Text style={buttonText}>Guardar</Text>
                  </Pressable>
                  <Pressable style={cancelButton} onPress={() => {
                    setNewChallenge("");
                    setEditingIndex(-1);
                  }}>
                    <Text style={buttonText}>Cancelar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={addButton} onPress={addChallenge}>
                  <Text style={buttonText}>
                    {challenges.length >= 5 ? "Máximo alcanzado" : "Agregar desafío"}
                  </Text>
                </Pressable>
              )}
            </View>

            {challenges.length > 0 && (
              <View style={challengesList}>
                <FlatList
                  data={challenges}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={challengeItem}>
                      <View style={[
                        challengeIconContainer,
                        {
                          backgroundColor: challengeItem.type === "past_self" ? "rgba(139, 92, 246, 0.2)" :
                                        challengeItem.type === "rival" ? "rgba(236, 72, 153, 0.2)" :
                                        challengeItem.type === "goal" ? "rgba(16, 185, 129, 0.2)" :
                                        challengeItem.type === "fear" ? "rgba(245, 158, 11, 0.2)" :
                                        challengeItem.type === "habit" ? "rgba(239, 68, 68, 0.2)" :
                                        "rgba(99, 102, 241, 0.2)"
                        }
                      ]}>
                        <Text style={challengeIcon}>
                          {item.icon}
                        </Text>
                      </View>
                      <View style={challengeInfoText}>
                        <Text style={challengeItemLabel}>
                          {item.label}
                        </Text>
                        <Text style={challengeItemType}>
                          ({getChallengeTypeLabel(item.type)})
                        </Text>
                      </View>
                      <Pressable style={selectButton} onPress={() => selectChallenge(item.id)}>
                        <Text style={selectButtonText}>
                          SELECCIONAR
                        </Text>
                      </Pressable>
                      {editingIndex === index ? null : (
                        <View style={challengeActions}>
                          <Pressable style={editButton} onPress={() => updateChallenge(index)}>
                            <Text style={buttonTextSmall}>Editar</Text>
                          </Pressable>
                          <Pressable style={deleteButton} onPress={() => deleteChallenge(index)}>
                            <Text style={buttonTextSmall}>Eliminar</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                  ListEmptyComponent={
                    <View style={emptyState}>
                      <Text style={emptyText}>
                        Aún no tienes desafíos definidos
                      </Text>
                    </View>
                  }
                >
              </FlatList>
              )
            )}

            <Text style={challengesLimit}>
              Máximo 5 desafíos ({challenges.length}/5)
            </Text>
          )}
        )}

        <View style={footer}>
          <Pressable style={backButton} onPress={() => router.replace("/(tabs)")}>
            <Text style={backButtonText}>← Volver al inicio</Text>
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
  activeChallengeContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  activeChallengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeChallengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#94A3B8",
  },
  challengeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  challengeIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeDetails: {
    flex: 1,
  },
  challengeLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  challengeType: {
    fontSize: 14,
    color: "#94A3B8",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 8,
    textAlign: "left",
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    textAlign: "center",
  },
  impactContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  impactCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  impactText: {
    fontSize: 24,
    color: "#EC4899",
  },
  impactLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
  },
  advanceButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  advanceButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  victoryBanner: {
    backgroundColor: "linear-gradient(135deg, #10B981, #059669)",
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    alignItems: "center",
  },
  victoryText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  victorySubtext: {
    fontSize: 14,
    color: "#D1FAE5",
    textAlign: "center",
  },
  challengesListContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 16,
    textAlign: "center",
  },
  challengeInputContainer: {
    marginBottom: 16,
  },
  challengeInput: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 12,
    padding: 16,
    color: "#F8FAFC",
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  updateButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: "#64748B",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  challengesList: {
    marginBottom: 20,
  },
  challengeItem: {
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
  },
  challengeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  challengeIcon: {
    fontSize: 20,
  },
  challengeInfoText: {
    flex: 1,
  },
  challengeItemLabel: {
    fontSize: 14,
    color: "#F8FAFC",
  },
  challengeItemType: {
    fontSize: 12,
    color: "#94A3B8",
  },
  selectButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "600",
  },
  challengeActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  buttonTextSmall: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    padding: 24,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    fontStyle: "italic",
  },
  challengesLimit: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
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
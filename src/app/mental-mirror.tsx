import { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, Switch } from "react-native";
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
  cancelAnimation,
} from "react-native-reanimated";

export default function MentalMirrorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [affirmations, setAffirmations] = useState([]);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const defaultAffirmations = [
    "Soy disciplinado y constante en mis acciones",
    "Mi mente es enfocada y poderosa",
    "Tomo el control de mis emociones y reacciones",
    "Soy capaz de superar cualquier desafío",
    "Mi concentración es láser y mi productividad es alta",
    "Confío plenamente en mi capacidad para tener éxito",
    "Cada día soy más fuerte y más resiliente",
    "Atraigo oportunidades y éxito de forma natural",
    "Soy el arquitecto de mi propio destino",
    "Mi voluntad es inquebrantable y mi enfoque es total"
  ];

  useEffect(() => {
    const loadAffirmations = async () => {
      const saved = await AsyncStorage.getItem("mental_affirmations");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAffirmations(parsed);
        } catch (e) {
          console.log("Error loading affirmations:", e);
          setAffirmations(defaultAffirmations.slice(0, 5));
        }
      } else {
        // Set defaults
        setAffirmations(defaultAffirmations.slice(0, 5));
        await AsyncStorage.setItem("mental_affirmations", JSON.stringify(defaultAffirmations.slice(0, 5)));
      }

      // Load settings
      const notifications = await AsyncStorage.getItem("mirror_notifications");
      setNotificationsEnabled(notifications === "true");

      const widget = await AsyncStorage.getItem("mirror_widget");
      setWidgetEnabled(widget === "true");
    };

    loadAffirmations();
  }, []);

  useEffect(() => {
    // Save affirmations when they change
    if (affirmations.length > 0) {
      AsyncStorage.setItem("mental_affirmations", JSON.stringify(affirmations));
    }
  }, [affirmations]);

  useEffect(() => {
    // Save settings
    AsyncStorage.setItem("mirror_notifications", notificationsEnabled.toString());
    AsyncStorage.setItem("mirror_widget", widgetEnabled.toString());
  }, [notificationsEnabled, widgetEnabled]);

  const startPulse = () => {
    pulseScale.value = withTiming(1.2, { duration: 800 });
    pulseScale.value = withTiming(1.0, { duration: 800 });
  };

  const addAffirmation = () => {
    if (newAffirmation.trim() !== "") {
      setAffirmations(prev => [...prev, newAffirmation.trim()]);
      setNewAffirmation("");
      startPulse();
    }
  };

  const updateAffirmation = (index) => {
    setEditingIndex(index);
    setNewAffirmation(affirmations[index]);
  };

  const saveAffirmation = (index) => {
    if (newAffirmation.trim() !== "") {
      const updated = [...affirmations];
      updated[index] = newAffirmation.trim();
      setAffirmations(updated);
      setNewAffirmation("");
      setEditingIndex(-1);
      startPulse();
    }
  };

  const deleteAffirmation = (index) => {
    const updated = affirmations.filter((_, i) => i !== index);
    setAffirmations(updated);
    if (editingIndex === index) {
      setNewAffirmation("");
      setEditingIndex(-1);
    }
  };

  const getRandomAffirmation = () => {
    if (affirmations.length === 0) return "Soy capaz de lograr grandes cosas";
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    return affirmations[randomIndex];
  };

  const showAffirmationPopup = () => {
    // In a real app, this would show a overlay or notification
    const affirmation = getRandomAffirmation();
    console.log(`💭 Espejo Mental: "${affirmation}"`);
    // Would trigger a nice animation overlay here
  };

  // Simulate periodic affirmations (in real app would use background task or push notifications)
  useEffect(() => {
    if (notificationsEnabled && affirmations.length > 0) {
      const interval = setInterval(() => {
        showAffirmationPopup();
      }, 300000); // Every 5 minutes for demo
      return () => clearInterval(interval);
    }
    return undefined;
  }, [notificationsEnabled, affirmations.length]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ESPEJO MENTAL</Text>
          <Text style={styles.subtitle}>
            Afirmaciones personalizadas que te transforman
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            Cómo funciona:
          </Text>
          <Text style={styles.instructionText}>
            Elige 3-5 afirmaciones que representen quién quieres ser.
            El espejo mental te mostrará estas frases en momentos clave
            del día para reforzar tu identidad y mindset ganador.
          </Text>
        </View>

        <View style={settingsSection}>
          <Text style={settingsTitle}>CONFIGURACIÓN</Text>

          <View style={settingsRow}>
            <Text style={settingsLabel}>Notificaciones</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              style={{ width: 40, height: 20 }}
              thumbColor={notificationsEnabled ? "#10B981" : "#94A3B8"}
              trackColor={{ false: "#64748B", true: "#8B5CF6" }}
            />
          </View>

          <View style={settingsRow}>
            <Text style={settingsLabel}>Widget de pantalla de bloqueo</Text>
            <Switch
              value={widgetEnabled}
              onValueChange={setWidgetEnabled}
              style={{ width: 40, height: 20 }}
              thumbColor={widgetEnabled ? "#10B981" : "#94A3B8"}
              trackColor={{ false: "#64748B", true: "#8B5CF6" }}
            />
          </View>

          <Text style={settingsNote}>
            *(En una app real, esto requeriría permisos específicos)*
          </Text>
        </View>

        <View style={affirmationsSection}>
          <Text style={sectionTitle}>TUS AFIRMACIONES PERSONALIZADAS</Text>
          <Text style={sectionSubtitle}>
            Máximo 5 afirmaciones para máxima efectividad
          </Text>

          <View style={affirmationInputContainer}>
            <TextInput
              placeholder="Escribe tu afirmación personal (ej: Soy disciplinado y enfocado)"
              value={newAffirmation}
              onChangeText={setNewAffirmation}
              style={affirmationInput}
              autoFocus={editingIndex === -1}
              placeholderTextColor="#64748B"
            />
            {editingIndex !== -1 ? (
              <View style={buttonGroup}>
                <Pressable style={updateButton} onPress={() => saveAffirmation(editingIndex)}>
                  <Text style={buttonText}>Guardar</Text>
                </Pressable>
                <Pressable style={cancelButton} onPress={() => {
                  setNewAffirmation("");
                  setEditingIndex(-1);
                }}>
                  <Text style={buttonText}>Cancelar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={addButton} onPress={addAffirmation}>
                <Text style={buttonText}>
                  {affirmations.length >= 5 ? "Máximo alcanzado" : "Agregar afirmación"}
                </Text>
              </Pressable>
            )}
          </View>

          {affirmations.length > 0 && (
            <View style={affirmationsList}>
              <FlatList
                data={affirmations}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={affirmationItem}>
                    <View style={affirmationTextContainer}>
                      <Text style={affirmationText}>
                        "{item}"
                      </Text>
                    </View>
                    {editingIndex === index ? null : (
                      <View style={affirmationActions}>
                        <Pressable style={editButton} onPress={() => updateAffirmation(index)}>
                          <Text style={buttonTextSmall}>Editar</Text>
                        </Pressable>
                        <Pressable style={deleteButton} onPress={() => deleteAffirmation(index)}>
                          <Text style={buttonTextSmall}>Eliminar</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <View style={emptyState}>
                    <Text style={emptyText}>
                      Aún no tienes afirmaciones personalizadas
                    </Text>
                  </View>
                }
                >
              </FlatList>
            )}
          )}

          {affirmations.length > 0 && (
            <View style={previewCard}>
              <Text style={previewTitle}>PREVIEW DE AFIRMACIÓN</Text>
              <View style={pulseContainer}>
                <Animated.View style={[pulseCircle, pulseStyle]}>
                  <Text style={previewAffirmation}>
                    "{getRandomAffirmation()}"
                  </Text>
                </Animated.View>
              </View>
              <Text style={previewNote}>
                Así se vería en un momento clave del día
              </Text>
            </View>
          )}

          <Text style={affirmationsLimit}>
            Máximo 5 afirmaciones ({affirmations.length}/5)
          </Text>
        </View>

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
  instructionCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#CBD5E1",
    lineHeight: 20,
  },
  settingsSection: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30, 41, 59, 0.2)",
  },
  settingsLabel: {
    fontSize: 14,
    color: "#E2E8F0",
  },
  settingsNote: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  affirmationsSection: {
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
  affirmationInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  affirmationInput: {
    flex: 1,
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
  affirmationsList: {
    marginBottom: 20,
  },
  affirmationItem: {
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
  },
  affirmationTextContainer: {
    flex: 1,
  },
  affirmationText: {
    fontSize: 14,
    color: "#F8FAFC",
    lineHeight: 20,
  },
  affirmationActions: {
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
  previewCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  pulseContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  pulseCircle: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewAffirmation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    textAlign: "center",
    maxWidth: 80,
  },
  previewNote: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  affirmationsLimit: {
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
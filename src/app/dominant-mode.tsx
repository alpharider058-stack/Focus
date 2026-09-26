import { useEffect, useState } from "react";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInUp,
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

export default function DominantModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dailyCommitment, setDailyCommitment] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState("inhale");
  const [breathingTime, setBreathingTime] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const breathScale = useSharedValue(1);
  const breathScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const powerPhrases = [
    "Soy imparable y poderoso",
    "Mi mente es una fuerza imparable",
    "Cada célula de mi cuerpo vibra con energía",
    "Atraigo éxito y abundancia naturalmente",
    "Soy dueño de mi destino y mi poder",
    "Mi confianza es inquebrantable",
    "Radiando poder y determinación",
    "Soy la versión más fuerte de mí mismo"
  ];

  const breathingPatterns = [
    { phase: "inhale", duration: 4, text: "Inhala profundamente... sentir el poder entrando" },
    { phase: "hold", duration: 4, text: "Mantén... siente la energía acumulándose" },
    { phase: "exhale", duration: 6, text: "Exhala lentamente... liberando toda duda" },
    { phase: "hold", duration: 2, text: "Mantén vacío... preparándote para el siguiente ciclo" }
  ];

  useEffect(() => {
    const checkIfAlreadyDoneToday = async () => {
      const lastDone = await AsyncStorage.getItem("dominant_mode_last_done");
      const today = new Date().toDateString();
      if (lastDone === today) {
        // Already done today, go to main app
        router.replace("/(tabs)");
      }
    };

    checkIfAlreadyDoneToday();
  }, [router]);

  useEffect(() => {
    if (step === 1 && powerPhrases.length > 0) {
      // Auto-advance power phrases after 3 seconds each
      const phraseInterval = setInterval(() => {
        setStep(prev => Math.min(prev + 1, powerPhrases.length));
      }, 3000);
      return () => clearInterval(phraseInterval);
    }

    if (step >= 1 + powerPhrases.length && step < 1 + powerPhrases.length + breathingPatterns.length * 2) {
      // Handle breathing exercise
      const breathInterval = setInterval(() => {
        setBreathingTime(prev => prev + 1);
        const currentPatternIndex = Math.floor((step - 1 - powerPhrases.length) / 2);
        const pattern = breathingPatterns[currentPatternIndex];
        const phaseIndex = (step - 1 - powerPhrases.length) % 2;

        if (phaseIndex === 0) {
          setBreathingPhase(pattern.phase);
          if (pattern.phase === "inhale") {
            breathScale.value = withSpring(1.2);
          } else if (pattern.phase === "exhale") {
            breathScale.value = withSpring(1.0);
          }
        }

        if (breathingTime >= pattern.duration) {
          setStep(prev => prev + 1);
          setBreathingTime(0);
        }
      }, 1000);

      return () => clearInterval(breathInterval);
    }
  }, [step, breathingTime, powerPhrases.length, breathingPatterns.length]);

  useEffect(() => {
    if (step >= 1 + powerPhrases.length + breathingPatterns.length * 2) {
      // Final step - commitment and completion
      const today = new Date().toDateString();
      AsyncStorage.setItem("dominant_mode_last_done", today);

      // Auto-complete after 5 seconds on final step
      const finishTimer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 5000);
      return () => clearTimeout(finishTimer);
    }
  }, [step, router]);

  const handleCommitmentPress = async () => {
    if (dailyCommitment.trim() !== "") {
      await AsyncStorage.setItem("daily_commitment", dailyCommitment);
      setStep(prev => prev + 1);
    }
  };

  const handleVoicePress = () => {
    setIsVoiceRecording(!isVoiceRecording);
    if (isVoiceRecording) {
      // Stop recording and save
      setDailyCommitment("Grabado por voz: [implementar grabación real]");
      setIsVoiceRecording(false);
    }
  };

  if (step === 0) {
    // Initial screen - activation
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>MODO DOMINANTE</Text>
          <Text style={styles.subtitle}>Activación Matutina de Poder</Text>
          <View style={styles.powerCircle}>
            <Animated.View style={[styles.powerGlow, breathScaleStyle]}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          <Text style={styles.instruction}>
            Prepárate para activar tu estado máximo de poder y concentración
          </Text>
          <Pressable style={styles.button} onPress={() => setStep(1)}>
            <Text style={styles.buttonText}>ACTIVAR PODER</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (step >= 1 && step <= powerPhrases.length) {
    // Power phrases display
    const currentPhraseIndex = step - 1;
    const currentPhrase = powerPhrases[currentPhraseIndex] || "";
    const progress = ((currentPhraseIndex) / powerPhrases.length) * 100;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>FRASES DE PODER</Text>
          <Text style={styles.subtitle}>Internaliza estas afirmaciones de poder</Text>

          <View style={styles.phraseContainer}>
            <Text style={styles.powerPhrase}>
              "{currentPhrase}"
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { width: `${progress}%` }]} />
          </View>

          <Text style={styles.progressText}>
            {currentPhraseIndex + 1} de {powerPhrases.length}
          </Text>

          {currentPhraseIndex < powerPhrases.length - 1 ? (
            <Text style={styles.phraseInstruction}>
              Siente cada palabra... cada sílaba...
            </Text>) : (
              <Text style={styles.phraseInstruction}>
                Ahora respira con este poder...
              </Text>
            )}
        </View>
      </View>
    );
  }

  if (step > powerPhrases.length && step <= powerPhrases.length + breathingPatterns.length * 2) {
    // Breathing exercise
    const currentPatternIndex = Math.floor((step - 1 - powerPhrases.length) / 2);
    const pattern = breathingPatterns[currentPatternIndex] || breathingPatterns[0];
    const phaseIndex = (step - 1 - powerPhrases.length) % 2;
    const totalBreathingSteps = breathingPatterns.length * 2;
    const currentBreathingStep = (step - 1 - powerPhrases.length) + 1;
    const progress = (currentBreathingStep / totalBreathingSteps) * 100;

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>RESPIRACIÓN DE PODER</Text>
          <Text style={styles.subtitle}>{pattern.text}</Text>

          <View style={styles.breathingCircle}>
            <Animated.View style={[styles.breathingRing, breathScaleStyle]}>
              <View style={styles.breathingCenter}>
                <Text style={styles.breathingText}>
                  {breathingPhase.toUpperCase()}
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.breathingInstruction}>
            {pattern.phase === "inhale" && "Llena tus pulmones de energía"}
            {pattern.phase === "hold" && "Mantén la energía dentro"}
            {pattern.phase === "exhale" && "Libera todo lo que te limita"}
            {pattern.phase === "hold" && "Prepárate para el siguiente ciclo"}
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { width: `${progress}%` }]} />
          </View>

          <Text style={styles.progressText}>
            {Math.ceil(pattern.duration - breathingTime)}s
          </Text>
        </View>
      </View>
    );
  }

  // Final step - commitment and completion
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TU COMPROMISO DEL DÍA</Text>
        <Text style={styles.subtitle}>
          Declara en voz alta o escribe tu intención poderosa para hoy
        </Text>

        <View style={styles.commitmentInputContainer}>
          <TextInput
            placeholder="Ej: Hoy conquistaré mis miedos y avanzaré hacia mis metas"
            value={dailyCommitment}
            onChangeText={setDailyCommitment}
            style={styles.commitmentInput}
            autoFocus
          />
          {isVoiceRecording ? (
            <Pressable style={styles.voiceButton} onPress={handleVoicePress}>
              <Text style={styles.voiceButtonText}>■ Detener grabación</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.voiceButton} onPress={handleVoicePress}>
              <Text style={styles.voiceButtonText}>🎤 Grabar voz</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.commitmentButton, dailyCommitment.trim() === "" && styles.buttonDisabled]}
          onPress={handleCommitmentPress}
          disabled={dailyCommitment.trim() === ""}
        >
          <Text style={styles.commitmentButtonText}>
            {dailyCommitment.trim() === "" ? "Escribe tu compromiso" : "CONFIRMAR COMPROMISO"}
          </Text>
        </Pressable>

        <Text style={styles.completionNote}>
          Tu compromiso queda registrado para hoy. ¡Ve y conquista tu día!
        </Text>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
    padding: 20,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#CBD5E1",
    marginBottom: 24,
    textAlign: "center",
  },
  powerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  powerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  logo: {
    width: 80,
    height: 80,
    position: "relative",
    zIndex: 2,
  },
  instruction: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 280,
  },
  button: {
    backgroundColor: "#8B5CF6",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "60%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  phraseContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    width: "80%",
  },
  powerPhrase: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
    lineHeight: 32,
  },
  progressBarContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(30, 41, 59, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 16,
  },
  progressBarBg: {
    height: "100%",
    backgroundColor: "#8B5CF6",
  },
  progressText: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  phraseInstruction: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontStyle: "italic",
  },
  breathingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 24,
    overflow: "hidden",
  },
  breathingRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 90,
    backgroundColor: "rgba(236, 72, 153, 0.3)",
  },
  breathingCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  breathingText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  breathingInstruction: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: 16,
  },
  commitmentInputContainer: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  commitmentInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 18,
    backgroundColor: "transparent",
  },
  voiceButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  voiceButtonText: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  commitmentButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 50,
    paddingVertical: 16,
    width: "70%",
  },
  commitmentButtonDisabled: {
    backgroundColor: "#64748B",
  },
  commitmentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  completionNote: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
};
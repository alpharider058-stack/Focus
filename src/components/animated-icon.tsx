import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  Keyframe,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const BG = "#08080C";
const EMBER = "#FF5A1F";
const VIOLET = "#8B7CFF";
const LETTERS = ["F", "O", "C", "U", "S"];

/**
 * Cinematic intro shown every time the app opens:
 * ember glow blooms, logo springs in, two shockwaves ripple out,
 * the wordmark drops in letter by letter and the whole scene zooms away.
 */
export function AnimatedSplashOverlay() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);

  const glow = useSharedValue(0);
  const logo = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const line = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!started) return;
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(setVisible, false);
    };

    if (reduceMotion) {
      glow.value = 1;
      logo.value = 1;
      line.value = 1;
      exit.value = withDelay(600, withTiming(1, { duration: 300 }, done));
      return;
    }

    const easeOut = Easing.out(Easing.cubic);
    glow.value = withTiming(1, { duration: 1200, easing: easeOut });
    logo.value = withDelay(150, withSpring(1, { damping: 11, stiffness: 120, mass: 0.9 }));
    ring1.value = withDelay(450, withTiming(1, { duration: 1150, easing: Easing.out(Easing.quad) }));
    ring2.value = withDelay(780, withTiming(1, { duration: 1150, easing: Easing.out(Easing.quad) }));
    line.value = withDelay(1150, withTiming(1, { duration: 650, easing: easeOut }));
    exit.value = withDelay(2400, withTiming(1, { duration: 520, easing: Easing.in(Easing.cubic) }, done));
  }, [started, reduceMotion, glow, logo, ring1, ring2, line, exit]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const stageStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + exit.value * 0.14 }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.5,
    transform: [{ scale: 0.4 + glow.value * 0.6 }],
  }));
  const glowInnerStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.35,
    transform: [{ scale: 0.6 + glow.value * 0.4 }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, logo.value),
    transform: [{ scale: 0.5 + logo.value * 0.5 }, { rotate: `${(1 - logo.value) * -14}deg` }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1.value > 0 ? (1 - ring1.value) * 0.8 : 0,
    transform: [{ scale: 0.5 + ring1.value * 2.1 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2.value > 0 ? (1 - ring2.value) * 0.6 : 0,
    transform: [{ scale: 0.5 + ring2.value * 2.6 }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    opacity: line.value,
    transform: [{ scaleX: line.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      onLayout={
        started
          ? undefined
          : () => {
              SplashScreen.hideAsync().finally(() => setStarted(true));
            }
      }
    >
      <Animated.View style={[styles.center, stageStyle]}>
        <View style={styles.logoStage}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={[styles.glowInner, glowInnerStyle]} />
          <Animated.View style={[styles.ring, ring1Style]} />
          <Animated.View style={[styles.ring, styles.ringViolet, ring2Style]} />
          <Animated.View style={logoStyle}>
            <Image source={require("../../Logo.png")} style={styles.logo} contentFit="contain" />
          </Animated.View>
        </View>

        <View style={styles.word}>
          {started
            ? LETTERS.map((letter, index) => (
                <Animated.Text
                  key={`${letter}-${index}`}
                  entering={FadeInDown.delay(reduceMotion ? 0 : 700 + index * 75)
                    .springify()
                    .damping(12)}
                  style={styles.letter}
                >
                  {letter}
                </Animated.Text>
              ))
            : null}
        </View>

        <Animated.View style={[styles.line, lineStyle]} />

        <View style={styles.taglineSlot}>
          {started ? (
            <Animated.Text entering={FadeIn.delay(reduceMotion ? 0 : 1350).duration(550)} style={styles.tagline}>
              DISCIPLINA {"\u00B7"} ENFOQUE {"\u00B7"} EGO
            </Animated.Text>
          ) : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const INITIAL_SCALE_FACTOR = Dimensions.get("screen").height / 90;
const DURATION = 600;

const keyframe = new Keyframe({
  0: { transform: [{ scale: INITIAL_SCALE_FACTOR }] },
  100: { transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

const logoKeyframe = new Keyframe({
  0: { transform: [{ scale: 1.3 }], opacity: 0 },
  40: { transform: [{ scale: 1.3 }], opacity: 0, easing: Easing.elastic(0.7) },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

const glowKeyframe = new Keyframe({
  0: { transform: [{ rotateZ: "0deg" }] },
  100: { transform: [{ rotateZ: "7200deg" }] },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.iconGlow}>
        <Image style={styles.iconGlow} source={require("@/assets/images/logo-glow.png")} />
      </Animated.View>
      <Animated.View entering={keyframe.duration(DURATION)} style={styles.iconBackground} />
      <Animated.View style={styles.iconImageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.iconImage} source={require("@/assets/images/expo-logo.png")} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  center: { alignItems: "center", justifyContent: "center" },
  logoStage: { width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 440, height: 440, borderRadius: 220, backgroundColor: EMBER },
  glowInner: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "#FF8A5B" },
  ring: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: EMBER,
  },
  ringViolet: { borderColor: VIOLET },
  logo: { width: 132, height: 132 },
  word: { flexDirection: "row", height: 56, marginTop: 18, alignItems: "center" },
  letter: { color: "#F5F5F7", fontSize: 42, fontWeight: "900", letterSpacing: 10, marginHorizontal: 1 },
  line: { width: 140, height: 3, borderRadius: 2, backgroundColor: EMBER, marginTop: 10 },
  taglineSlot: { height: 24, marginTop: 14, justifyContent: "center" },
  tagline: { color: "#A1A1AE", fontSize: 12, fontWeight: "800", letterSpacing: 3 },
  iconContainer: { justifyContent: "center", alignItems: "center", width: 128, height: 128, zIndex: 100 },
  iconGlow: { width: 201, height: 201, position: "absolute" },
  iconBackground: { borderRadius: 40, backgroundColor: "#FFFFFF", width: 128, height: 128, position: "absolute" },
  iconImageContainer: { justifyContent: "center", alignItems: "center" },
  iconImage: { width: 76, height: 71 },
});

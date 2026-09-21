import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import type {
    LiveActivityEnvironment,
    LiveActivityFactory,
} from "expo-widgets";

export type RoutineActivityProps = {
  routineName: string;
  exerciseName: string;
  completed: number;
  total: number;
};

const RoutineLiveActivity = (
  props: RoutineActivityProps,
  environment: LiveActivityEnvironment,
) => {
  "widget";

  const accent = environment.isLuminanceReduced ? "#FFFFFF" : "#34C759";
  const islandText = "#FFFFFF";
  const bannerText = environment.colorScheme === "dark" ? "#FFFFFF" : "#111113";
  const progress = `${props.completed}/${props.total}`;

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[padding({ all: 14 })]}
      >
        <Text
          modifiers={[
            font({ weight: "bold", size: 17 }),
            foregroundStyle(accent),
          ]}
        >
          {props.routineName}
        </Text>
        <Text modifiers={[foregroundStyle(bannerText)]}>
          {props.exerciseName}
        </Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle("#777782")]}>
          {progress} ejercicios completados
        </Text>
      </VStack>
    ),
    compactLeading: (
      <Text modifiers={[font({ weight: "bold" }), foregroundStyle(accent)]}>
        PULSE
      </Text>
    ),
    compactTrailing: (
      <Text modifiers={[foregroundStyle(islandText)]}>{progress}</Text>
    ),
    minimal: <Text modifiers={[foregroundStyle(accent)]}>P</Text>,
    expandedLeading: (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[padding({ all: 10 })]}
      >
        <Text modifiers={[font({ weight: "bold" }), foregroundStyle(accent)]}>
          PULSE
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(islandText)]}>
          Entrenando
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack
        alignment="trailing"
        spacing={4}
        modifiers={[padding({ all: 10 })]}
      >
        <Text
          modifiers={[
            font({ weight: "bold", size: 20 }),
            foregroundStyle(islandText),
          ]}
        >
          {progress}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(islandText)]}>
          completados
        </Text>
      </VStack>
    ),
    expandedBottom: (
      <HStack spacing={8} modifiers={[padding({ all: 10 })]}>
        <Text
          modifiers={[font({ weight: "bold" }), foregroundStyle(islandText)]}
        >
          {props.exerciseName}
        </Text>
        <Text modifiers={[foregroundStyle("#A7A7AD")]}>
          Siguiente ejercicio
        </Text>
      </HStack>
    ),
  };
};

let routineActivity: LiveActivityFactory<RoutineActivityProps> | null = null;

export function getRoutineActivity() {
  if (!routineActivity) {
    const { createLiveActivity } =
      require("expo-widgets") as typeof import("expo-widgets");
    routineActivity = createLiveActivity<RoutineActivityProps>(
      "RoutineLiveActivity",
      RoutineLiveActivity,
    );
  }

  return routineActivity;
}

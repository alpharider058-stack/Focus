export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
};

const movementVariants = [
  "Press banca",
  "Press inclinado",
  "Press declinado",
  "Press militar",
  "Aperturas",
  "Fondos",
  "Cruce de poleas",
  "Remo con barra",
  "Remo con mancuerna",
  "Remo en polea",
  "Jalon al pecho",
  "Dominadas",
  "Pullover",
  "Curl con barra",
  "Curl con mancuerna",
  "Curl martillo",
  "Extension de triceps",
  "Patada de triceps",
  "Sentadilla",
  "Prensa de piernas",
  "Peso muerto",
  "Peso muerto rumano",
  "Zancadas",
  "Bulgaras",
  "Hip thrust",
  "Puente de gluteo",
  "Extension de pierna",
  "Curl femoral",
  "Elevacion de gemelos",
  "Abduccion de cadera",
  "Plancha",
  "Crunch",
  "Elevacion de piernas",
  "Pallof press",
  "Russian twist",
  "Mountain climbers",
  "Burpees",
  "Kettlebell swing",
  "Turkish get-up",
  "Farmer walk",
];

const muscles = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Biceps",
  "Triceps",
  "Piernas",
  "Gluteos",
  "Core",
];
const equipment = ["Barra", "Mancuernas", "Polea", "Maquina"];

export const EXERCISES: Exercise[] = movementVariants.flatMap((name, index) =>
  ["base", "unilateral", "tempo controlado", "en maquina"].map(
    (variation, variationIndex) => ({
      id: `exercise-${index * 4 + variationIndex + 1}`,
      name: variation === "base" ? name : `${name} ${variation}`,
      muscle: muscles[index % muscles.length],
      equipment: equipment[(index + variationIndex) % equipment.length],
    }),
  ),
);

export const EXERCISE_COUNT = EXERCISES.length;

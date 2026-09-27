export const AFFIRMATIONS: string[] = [
  "Soy alguien que cumple su palabra, sobre todo la que se da a sí mismo.",
  "No necesito ganas. Tengo disciplina.",
  "Mi valor no depende de la opinión de nadie.",
  "Hoy hago lo difícil primero.",
  "Cada promesa que cumplo me hace más fuerte.",
  "Estoy construyendo una versión de mí que respeto.",
  "Mis excusas no tienen voto.",
  "Soy capaz de mucho más de lo que creía ayer.",
  "La incomodidad es el precio de mi crecimiento y lo pago con gusto.",
  "No compito con nadie. Supero a quien fui ayer.",
  "Mi tiempo es valioso y lo trato como tal.",
  "Hablo de mí con respeto, dentro y fuera de mi cabeza.",
  "Soy constante cuando nadie mira.",
  "Me merezco la vida que estoy construyendo.",
  "Termino lo que empiezo.",
  "Mi mente obedece a mis objetivos, no a mis impulsos.",
  "Cada día gano pequeñas batallas que nadie ve.",
  "Soy el tipo de persona que no se rinde.",
  "Mi energía va a lo que importa.",
  "Confío en mí porque me he demostrado que puedo.",
  "El miedo me avisa. No me detiene.",
  "Soy suficiente y aun así voy a por más.",
  "Mi disciplina de hoy es mi libertad de mañana.",
  "No espero el momento perfecto. Lo creo.",
  "Mi palabra vale oro, empezando por la que me doy.",
  "Acepto el reto. Para eso estoy aquí.",
  "Soy dueño de mis decisiones y de sus resultados.",
  "Elijo el esfuerzo antes que el arrepentimiento.",
  "Mi progreso es lento, pero es imparable.",
  "Camino con la cabeza alta porque hago el trabajo.",
  "No necesito aprobación para avanzar.",
  "Hoy me demuestro de qué estoy hecho.",
  "Mis hábitos me definen más que mis palabras.",
  "Estoy orgulloso de la persona en la que me estoy convirtiendo.",
  "Cuando quiero parar, doy un paso más.",
  "El respeto propio se gana cada mañana.",
  "Soy firme en mis objetivos y flexible en el camino.",
  "Donde otros ven un límite, yo veo el siguiente nivel.",
  "Mi mejor versión no es un sueño. Es un hábito.",
  "Hoy no negocio conmigo mismo.",
];

function hashKey(key: string): number {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Deterministic affirmation for a given date key, shifted by an optional offset. */
export function affirmationFor(dateKey: string, offset = 0): string {
  const length = AFFIRMATIONS.length;
  const index = (((hashKey(dateKey) + offset) % length) + length) % length;
  return AFFIRMATIONS[index] ?? AFFIRMATIONS[0] ?? "";
}

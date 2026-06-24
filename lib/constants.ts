import type { PlanCategory } from "./types";

// Curated, non-childish palette for habits / goals / events.
export const PALETTE: { name: string; value: string }[] = [
  { name: "Azul", value: "#4f8cff" },
  { name: "Índigo", value: "#6e7ff2" },
  { name: "Violeta", value: "#a855f7" },
  { name: "Esmeralda", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Ámbar", value: "#f59e0b" },
  { name: "Rosa", value: "#f472b6" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Cian", value: "#38bdf8" },
  { name: "Lima", value: "#84cc16" },
];

export const HABIT_CATEGORIES = [
  "Salud",
  "Ejercicio",
  "Estudio",
  "Trabajo",
  "Mente",
  "Finanzas",
  "Creatividad",
  "Social",
  "Hogar",
  "Otro",
];

export const GOAL_CATEGORIES = [
  "Salud",
  "Carrera",
  "Aprendizaje",
  "Finanzas",
  "Hábitos",
  "Personal",
  "Otro",
];

export const PLAN_CATEGORY_META: Record<
  PlanCategory,
  { label: string; color: string }
> = {
  work: { label: "Trabajo", color: "#4f8cff" },
  study: { label: "Estudio", color: "#6e7ff2" },
  exercise: { label: "Ejercicio", color: "#22c55e" },
  leisure: { label: "Ocio", color: "#f59e0b" },
  personal: { label: "Personal", color: "#a855f7" },
  other: { label: "Otro", color: "#94a3b8" },
};

export const BLOCK_META: Record<string, { label: string; color: string }> = {
  meal: { label: "Comida", color: "#f472b6" },
  break: { label: "Descanso", color: "#38bdf8" },
  leisure: { label: "Ocio", color: "#f59e0b" },
  free: { label: "Tiempo libre", color: "#94a3b8" },
  "sleep-buffer": { label: "Preparación", color: "#64748b" },
};

// One distinct, professional line per day of the year (no generic fluff).
export const QUOTES: { text: string; author: string }[] = [
  { text: "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.", author: "Augusta F. Kantra" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
  { text: "La calidad no es un acto, es un hábito.", author: "Aristóteles" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
  { text: "Lo que haces todos los días importa más que lo que haces de vez en cuando.", author: "Gretchen Rubin" },
  { text: "Primero formamos hábitos, luego ellos nos forman a nosotros.", author: "John Dryden" },
  { text: "La motivación te pone en marcha, el hábito te mantiene en movimiento.", author: "Jim Ryun" },
  { text: "Un objetivo sin un plan es solo un deseo.", author: "Antoine de Saint-Exupéry" },
  { text: "Pequeños cambios producen resultados notables.", author: "James Clear" },
  { text: "El secreto de avanzar es comenzar.", author: "Mark Twain" },
  { text: "No tienes que ser extraordinario para empezar, pero tienes que empezar para ser extraordinario.", author: "Zig Ziglar" },
  { text: "La constancia es el lenguaje del compromiso.", author: "Anónimo" },
  { text: "Hazlo aburrido, hazlo simple, hazlo siempre.", author: "Anónimo" },
  { text: "El progreso, no la perfección.", author: "Anónimo" },
  { text: "Cada acción es un voto por la persona en la que te quieres convertir.", author: "James Clear" },
  { text: "El tiempo que disfrutas perdiendo no es tiempo perdido.", author: "Bertrand Russell" },
  { text: "La energía y la persistencia conquistan todas las cosas.", author: "Benjamin Franklin" },
  { text: "Lo importante es no dejar de hacerse preguntas.", author: "Albert Einstein" },
  { text: "El que tiene un porqué para vivir puede soportar casi cualquier cómo.", author: "Friedrich Nietzsche" },
  { text: "Bien hecho es mejor que bien dicho.", author: "Benjamin Franklin" },
  { text: "La paciencia y la perseverancia tienen un efecto mágico.", author: "John Quincy Adams" },
  { text: "Empieza donde estás, usa lo que tienes, haz lo que puedas.", author: "Arthur Ashe" },
  { text: "El orden y la simplificación son los primeros pasos hacia el dominio.", author: "Thomas Mann" },
  { text: "La acción es la clave fundamental de todo éxito.", author: "Pablo Picasso" },
  { text: "No esperes. El momento nunca será el justo.", author: "Napoleon Hill" },
  { text: "La excelencia es un arte que se gana con entrenamiento y hábito.", author: "Aristóteles" },
  { text: "Tu futuro se crea por lo que haces hoy, no mañana.", author: "Robert Kiyosaki" },
  { text: "Concéntrate en ser productivo, no en estar ocupado.", author: "Tim Ferriss" },
  { text: "Hay una sola forma de evitar las críticas: no hacer nada.", author: "Aristóteles" },
  { text: "La constancia vence lo que la dicha no alcanza.", author: "Johann W. Goethe" },
  { text: "El descanso es parte del trabajo, no su ausencia.", author: "Anónimo" },
];

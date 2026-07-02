export const DEFAULT_SCHEDULE_BLOCKS = [
  { id: "DESAYUNO", label: "Desayuno", start: "06:30", end: "08:00" },
  { id: "MANANA", label: "Turno mañana", start: "08:00", end: "12:30" },
  { id: "ALMUERZO", label: "Almuerzo", start: "12:30", end: "14:00" },
  { id: "TARDE", label: "Turno tarde", start: "14:00", end: "17:00" },
  { id: "CENA", label: "Cena", start: "17:00", end: "18:30" },
  { id: "NOCHE", label: "Turno noche", start: "18:30", end: "22:30" },
];

export const DEFAULT_WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

export function cloneDefaultBlocks() {
  return DEFAULT_SCHEDULE_BLOCKS.map((block) => ({ ...block }));
}

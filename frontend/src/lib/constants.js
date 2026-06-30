export const CYCLES = [
  { id: 1, label: "Ciclo I" },
  { id: 2, label: "Ciclo II" },
  { id: 3, label: "Ciclo III" },
  { id: 4, label: "Ciclo IV" },
  { id: 5, label: "Ciclo V" },
  { id: 6, label: "Ciclo VI" },
  { id: 7, label: "Ciclo VII" },
  { id: 8, label: "Ciclo VIII" },
  { id: 9, label: "Ciclo IX" },
  { id: 10, label: "Ciclo X" },
];

export const EMPLOYMENT_TYPES = [
  { value: "NOMBRADO", label: "Nombrado" },
  { value: "CONTRATADO", label: "Contratado" },
  { value: "INVITADO", label: "Invitado" },
];

export const EMPLOYMENT_TYPE_FILTERS = [
  { value: null, label: "Todos" },
  ...EMPLOYMENT_TYPES,
];

export const COURSE_CATEGORIES = [
  { value: "CARRERA", label: "De carrera" },
  { value: "ESTUDIOS_GENERALES", label: "Estudios generales" },
];

export const COURSE_CATEGORY_FILTERS = [
  { value: null, label: "Todos" },
  ...COURSE_CATEGORIES,
];

export const CYCLE_FILTERS = [
  { value: null, label: "Todos" },
  ...CYCLES.map(({ id, label }) => ({ value: id, label })),
];

export function getEmploymentTypeLabel(value) {
  return EMPLOYMENT_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getCourseCategoryLabel(value) {
  return COURSE_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export function getCycleLabel(cycleId) {
  return CYCLES.find((item) => item.id === cycleId)?.label ?? `Ciclo ${cycleId}`;
}

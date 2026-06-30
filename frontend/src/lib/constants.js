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

export const TEACHER_SHIFTS = [
  { value: "MANANA", label: "Mañana" },
  { value: "TARDE", label: "Tarde" },
  { value: "NOCHE", label: "Noche" },
];

export const TEACHER_SHIFT_FILTERS = [
  { value: null, label: "Todos" },
  ...TEACHER_SHIFTS,
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

export function getTeacherShiftLabel(value) {
  return TEACHER_SHIFTS.find((item) => item.value === value)?.label ?? value;
}

export function getCourseCategoryLabel(value) {
  return COURSE_CATEGORIES.find((item) => item.value === value)?.label ?? value;
}

export function getCycleLabel(cycleId) {
  return CYCLES.find((item) => item.id === cycleId)?.label ?? `Ciclo ${cycleId}`;
}

export const SPACE_TYPES = [
  { value: "AULA", label: "Aula" },
  { value: "LABORATORIO", label: "Laboratorio" },
];

export const SPACE_TYPE_FILTERS = [
  { value: null, label: "Todos" },
  ...SPACE_TYPES,
];

export const AVAILABILITY_STATUSES = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "OCUPADO", label: "Ocupado" },
  { value: "EN_MANTENIMIENTO", label: "En mantenimiento" },
];

export const AVAILABILITY_FILTERS = [
  { value: null, label: "Todos" },
  ...AVAILABILITY_STATUSES,
];

export function getSpaceTypeLabel(value) {
  return SPACE_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getAvailabilityLabel(value) {
  return AVAILABILITY_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export const COURSE_TYPES = [
  { value: "ESTUDIOS_GENERALES", label: "Estudios generales" },
  { value: "DE_CARRERA", label: "De carrera" },
  { value: "LECTIVOS", label: "Lectivos" },
];

export const COURSE_TYPE_FILTERS = [
  { value: null, label: "Todos" },
  ...COURSE_TYPES,
];

export const COURSE_AVAILABILITY = [
  { value: "LIBRE", label: "Libre" },
  { value: "INCOMPLETO", label: "Incompleto" },
  { value: "LLENO", label: "Lleno" },
];

export const COURSE_AVAILABILITY_FILTERS = [
  { value: null, label: "Todos" },
  ...COURSE_AVAILABILITY,
];

export function getCourseTypeLabel(value) {
  return COURSE_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function getCourseAvailabilityLabel(value) {
  return COURSE_AVAILABILITY.find((item) => item.value === value)?.label ?? value;
}

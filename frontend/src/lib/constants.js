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

export const WEEKDAYS = [
  { value: "MONDAY", label: "Lun", longLabel: "Lunes" },
  { value: "TUESDAY", label: "Mar", longLabel: "Martes" },
  { value: "WEDNESDAY", label: "Mié", longLabel: "Miércoles" },
  { value: "THURSDAY", label: "Jue", longLabel: "Jueves" },
  { value: "FRIDAY", label: "Vie", longLabel: "Viernes" },
];

export function getWeekdayLabel(value, long = false) {
  const weekday = WEEKDAYS.find((item) => item.value === value);
  return long ? weekday?.longLabel ?? value : weekday?.label ?? value;
}

export const NIGHT_ONLY_CYCLES = [9, 10];

export const LAB_SUB_SHIFT_CYCLES = [8, 9, 10];

export function isNightOnlyCycle(cycleId) {
  return NIGHT_ONLY_CYCLES.includes(cycleId);
}

export function isLabSubShiftCycle(cycleId) {
  return LAB_SUB_SHIFT_CYCLES.includes(Number(cycleId));
}

export function allowedSubShiftsForCycle(cycleId, shift, requiredSpaceType) {
  const cycle = Number(cycleId);
  if (!cycle || !shift || !requiredSpaceType) {
    return [];
  }
  if (requiredSpaceType === "LABORATORIO") {
    if (isDayOnlyCycle(cycle)) {
      if (shift === "MANANA") return ["A1", "A2"];
      if (shift === "TARDE") return ["B1", "B2"];
    }
    if (NIGHT_ONLY_CYCLES.includes(cycle) && shift === "NOCHE") {
      return ["NA1", "NA2", "NB1", "NB2"];
    }
    return [];
  }
  if (requiredSpaceType === "AULA") {
    if (NIGHT_ONLY_CYCLES.includes(cycle) && shift === "NOCHE") {
      return ["NA", "NB"];
    }
    return [];
  }
  return [];
}

export function requiresSubShift(course, shift) {
  if (!course) {
    return false;
  }
  return allowedSubShiftsForCycle(course.cycle, shift, course.requiredSpaceType).length > 0;
}

export const SUB_SHIFT_LABELS = {
  A1: "A1",
  A2: "A2",
  B1: "B1",
  B2: "B2",
  NA: "NA",
  NB: "NB",
  NA1: "NA1",
  NA2: "NA2",
  NB1: "NB1",
  NB2: "NB2",
};

export function getSubShiftLabel(value) {
  if (!value) {
    return null;
  }
  return SUB_SHIFT_LABELS[value] ?? value;
}

export function isDayOnlyCycle(cycleId) {
  return Number.isInteger(cycleId) && cycleId >= 1 && cycleId <= 8;
}

export function allowedShiftsForCycle(cycleId) {
  if (isNightOnlyCycle(cycleId)) {
    return ["NOCHE"];
  }
  if (isDayOnlyCycle(cycleId)) {
    return ["MANANA", "TARDE"];
  }
  return ["MANANA", "TARDE", "NOCHE"];
}

export const EMPLOYMENT_TYPES = [
  { value: "NOMBRADO", label: "Nombrado" },
  { value: "CONTRATADO", label: "Contratado" },
  { value: "ESTUDIOS_GENERALES", label: "Estudios generales" },
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

export function getCourseCategoryForEmploymentType(employmentType) {
  return employmentType === "ESTUDIOS_GENERALES" ? "ESTUDIOS_GENERALES" : "CARRERA";
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
];

export const COURSE_LECTIVO_LABEL = "Lectivo";

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

export function isCourseLectivo(course) {
  if (course?.lectivo) {
    return true;
  }
  return course?.type === "LECTIVOS";
}

export function getCourseAvailabilityLabel(value) {
  return COURSE_AVAILABILITY.find((item) => item.value === value)?.label ?? value;
}

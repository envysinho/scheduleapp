import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import CourseSearchInput from "@/components/spaces/CourseSearchInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import { listCourses, listPracticeHeads } from "@/lib/api";
import { normalizeSearchText } from "@/lib/search";
import {
  allowedShiftsForCycle,
  allowedSubShiftsForCycle,
  AVAILABILITY_STATUSES,
  getAvailabilityLabel,
  getCycleLabel,
  getSpaceTypeLabel,
  getSubShiftLabel,
  getTeacherShiftLabel,
  requiresSubShift,
  SPACE_TYPES,
  TEACHER_SHIFTS,
} from "@/lib/constants";

const EMPTY_ASSIGNMENT = {
  courseName: "",
  cycle: null,
  shift: null,
  subShift: null,
};

const UNASSIGNED_MANAGER_LABEL = "Sin encargado";

const EMPTY_FORM = {
  name: "",
  spaceType: "AULA",
  availability: "DISPONIBLE",
  managerName: "",
  managerPhone: "",
  assignments: [{ ...EMPTY_ASSIGNMENT }],
};

function spaceToForm(space) {
  if (!space) {
    return EMPTY_FORM;
  }

  return {
    name: space.name ?? "",
    spaceType: space.spaceType ?? "AULA",
    availability: space.availability ?? "DISPONIBLE",
    managerName: space.managerName ?? "",
    managerPhone: space.managerPhone ?? "",
    assignments:
      space.assignments?.length > 0
        ? space.assignments.map((assignment) => ({
            courseName: assignment.courseName ?? "",
            cycle: assignment.cycle ?? null,
            shift: assignment.shift ?? null,
            subShift: assignment.subShift ?? null,
          }))
        : [{ ...EMPTY_ASSIGNMENT }],
  };
}

function findCourseByName(courses, courseName) {
  const normalized = normalizeSearchText(courseName);
  if (!normalized) {
    return null;
  }
  return courses.find((course) => normalizeSearchText(course.name) === normalized) ?? null;
}

function SpaceForm({ space, onSubmit, onCancel, isSubmitting, error }) {
  const { logout } = useAuth();
  const { semester } = useSemester();
  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);
  const [practiceHeads, setPracticeHeads] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingPracticeHeads, setIsLoadingPracticeHeads] = useState(true);
  const spaceTypeAnchor = useComboboxAnchor();
  const availabilityAnchor = useComboboxAnchor();
  const managerAnchor = useComboboxAnchor();

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCourses(true);
    listCourses({ semester }, logout)
      .then((data) => {
        if (!cancelled) {
          setCourses(data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourses([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCourses(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [semester, logout]);

  useEffect(() => {
    setForm(spaceToForm(space));
  }, [space]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingPracticeHeads(true);
    listPracticeHeads({ semester }, logout)
      .then((data) => {
        if (!cancelled) {
          setPracticeHeads(data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPracticeHeads([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPracticeHeads(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [semester, logout]);

  useEffect(() => {
    if (!form.managerName || isLoadingPracticeHeads) {
      return;
    }
    const selectedExists = practiceHeads.some(
      (practiceHead) => practiceHead.fullName === form.managerName
    );
    if (!selectedExists) {
      setForm((current) => ({
        ...current,
        managerName: "",
        managerPhone: "",
      }));
    }
  }, [form.managerName, isLoadingPracticeHeads, practiceHeads]);

  const hasInvalidCourses = form.assignments.some((assignment) => {
    const normalized = normalizeSearchText(assignment.courseName);
    if (!normalized) {
      return false;
    }
    return !findCourseByName(courses, assignment.courseName);
  });

  const hasMissingSubShift = form.assignments.some((assignment) => {
    const matchedCourse = findCourseByName(courses, assignment.courseName);
    return requiresSubShift(matchedCourse, assignment.shift) && !assignment.subShift;
  });

  const handleAssignmentChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.map((assignment, itemIndex) =>
        itemIndex === index ? { ...assignment, [field]: value } : assignment
      ),
    }));
  };

  const addAssignment = () => {
    setForm((current) => ({
      ...current,
      assignments: [...current.assignments, { ...EMPTY_ASSIGNMENT }],
    }));
  };

  const removeAssignment = (index) => {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      spaceType: form.spaceType,
      availability: form.availability,
      managerName: form.managerName.trim() || null,
      managerPhone: form.managerPhone.trim() || null,
      assignments: form.assignments
        .filter((assignment) => findCourseByName(courses, assignment.courseName))
        .map((assignment) => {
          const matchedCourse = findCourseByName(courses, assignment.courseName);
          const subShift = requiresSubShift(matchedCourse, assignment.shift)
            ? assignment.subShift
            : null;
          return {
            courseName: matchedCourse.name,
            cycle: matchedCourse.cycle == null ? null : Number(matchedCourse.cycle),
            shift: assignment.shift ?? null,
            ...(subShift ? { subShift } : {}),
          };
        }),
    };

    await onSubmit(payload);
  };

  const isEditing = Boolean(space?.id);
  const selectedPracticeHead =
    practiceHeads.find((practiceHead) => practiceHead.fullName === form.managerName) ?? null;
  const managerOptions = [
    UNASSIGNED_MANAGER_LABEL,
    ...practiceHeads.map((practiceHead) => practiceHead.fullName),
  ];

  return (
    <form className="flex flex-col gap-6 pb-6" onSubmit={handleSubmit}>
      <Button
        type="button"
        variant="ghost"
        className="w-fit gap-2 px-0 hover:bg-transparent"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        <ArrowLeft className="size-4" />
        Volver a ambientes
      </Button>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="space-name">Nombre del ambiente</Label>
          <Input
            id="space-name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-type">Tipo de ambiente</Label>
            <div ref={spaceTypeAnchor} className="w-full">
              <Combobox
                items={SPACE_TYPES.map((item) => item.label)}
                value={getSpaceTypeLabel(form.spaceType)}
                onValueChange={(label) => {
                  const item = SPACE_TYPES.find((option) => option.label === label);
                  setForm((current) => ({
                    ...current,
                    spaceType: item?.value ?? "AULA",
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput
                  id="space-type"
                  placeholder="Seleccionar tipo"
                  readOnly
                />
                <ComboboxContent anchor={spaceTypeAnchor}>
                  <ComboboxEmpty>Sin opciones.</ComboboxEmpty>
                  <ComboboxList>
                    {(label) => (
                      <ComboboxItem key={label} value={label}>
                        {label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="space-availability">Disponibilidad</Label>
            <div ref={availabilityAnchor} className="w-full">
              <Combobox
                items={AVAILABILITY_STATUSES.map((item) => item.label)}
                value={getAvailabilityLabel(form.availability)}
                onValueChange={(label) => {
                  const item = AVAILABILITY_STATUSES.find((option) => option.label === label);
                  setForm((current) => ({
                    ...current,
                    availability: item?.value ?? "DISPONIBLE",
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput
                  id="space-availability"
                  placeholder="Seleccionar disponibilidad"
                  readOnly
                />
                <ComboboxContent anchor={availabilityAnchor}>
                  <ComboboxEmpty>Sin opciones.</ComboboxEmpty>
                  <ComboboxList>
                    {(label) => (
                      <ComboboxItem key={label} value={label}>
                        {label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-manager-name">Encargado</Label>
            <div ref={managerAnchor} className="w-full">
              <Combobox
                items={managerOptions}
                value={selectedPracticeHead?.fullName ?? UNASSIGNED_MANAGER_LABEL}
                onValueChange={(label) => {
                  if (label === UNASSIGNED_MANAGER_LABEL) {
                    setForm((current) => ({
                      ...current,
                      managerName: "",
                      managerPhone: "",
                    }));
                    return;
                  }
                  const practiceHead = practiceHeads.find((item) => item.fullName === label);
                  setForm((current) => ({
                    ...current,
                    managerName: practiceHead?.fullName ?? "",
                    managerPhone: practiceHead?.phone ?? "",
                  }));
                }}
                disabled={isSubmitting || isLoadingPracticeHeads}
              >
                <ComboboxInput
                  id="space-manager-name"
                  placeholder="Seleccionar encargado"
                  readOnly
                />
                <ComboboxContent anchor={managerAnchor}>
                  <ComboboxEmpty>Sin jefes de práctica.</ComboboxEmpty>
                  <ComboboxList>
                    {(label) => (
                      <ComboboxItem key={label} value={label}>
                        {label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-manager-phone">Teléfono del encargado</Label>
            <Input
              id="space-manager-phone"
              value={form.managerPhone}
              readOnly
              disabled={isSubmitting}
              placeholder="Sin teléfono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Cursos asignados</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAssignment}
              disabled={isSubmitting}
            >
              <Plus className="size-4" />
              Añadir curso
            </Button>
          </div>

          {form.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cursos asignados.</p>
          ) : (
            form.assignments.map((assignment, index) => (
              <AssignmentRow
                key={`assignment-${index}`}
                assignment={assignment}
                index={index}
                canRemove={true}
                disabled={isSubmitting || isLoadingCourses}
                courses={courses}
                onChange={handleAssignmentChange}
                onRemove={removeAssignment}
              />
            ))
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || hasInvalidCourses || hasMissingSubShift}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

function getFirstAllowedShift(cycle) {
  const [first] = allowedShiftsForCycle(cycle);
  return first ?? null;
}

function AssignmentRow({ assignment, index, canRemove, disabled, courses, onChange, onRemove }) {
  const selectedCourse = findCourseByName(courses, assignment.courseName);
  const cycleValue = selectedCourse?.cycle ?? assignment.cycle;
  const cycleLabel = cycleValue == null ? "Sin asignar" : getCycleLabel(cycleValue);
  const allowedSubShifts = selectedCourse
    ? allowedSubShiftsForCycle(selectedCourse.cycle, assignment.shift, selectedCourse.requiredSpaceType)
    : [];
  const showSubShifts = Boolean(selectedCourse)
    && allowedSubShifts.length > 0;
  const subShiftMissing = showSubShifts && !assignment.subShift;

  function resolveSubShift(course, shift, currentSubShift) {
    const allowed = allowedSubShiftsForCycle(course?.cycle, shift, course?.requiredSpaceType);
    if (allowed.length === 0) {
      return null;
    }
    if (currentSubShift && allowed.includes(currentSubShift)) {
      return currentSubShift;
    }
    return null;
  }

  const handleCourseSelect = (course) => {
    const nextCourseName = course?.name ?? "";
    const nextCycle = course?.cycle ?? assignment.cycle;
    const nextAllowedShifts = allowedShiftsForCycle(nextCycle);
    const nextShift = assignment.shift && nextAllowedShifts.includes(assignment.shift)
      ? assignment.shift
      : getFirstAllowedShift(nextCycle);
    const nextSubShift = resolveSubShift(course, nextShift, assignment.subShift);
    onChange(index, "courseName", nextCourseName);
    if (course) {
      onChange(index, "cycle", nextCycle);
      onChange(index, "shift", nextShift);
      onChange(index, "subShift", nextSubShift);
    }
  };

  const handleShiftChange = (shift) => {
    const nextSubShift = resolveSubShift(selectedCourse, shift, assignment.subShift);
    onChange(index, "shift", shift);
    onChange(index, "subShift", nextSubShift);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Curso {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(index)}
            disabled={disabled}
            aria-label={`Quitar curso ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`assignment-course-${index}`}>Nombre del curso</Label>
          <CourseSearchInput
            inputId={`assignment-course-${index}`}
            value={selectedCourse}
            onSelect={handleCourseSelect}
            disabled={disabled}
            courses={courses}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`assignment-cycle-${index}`}>Ciclo</Label>
          <Input
            id={`assignment-cycle-${index}`}
            value={cycleLabel}
            readOnly
            disabled={disabled || !selectedCourse}
            placeholder="Selecciona un curso"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Label>Turno</Label>
        <div className="flex flex-wrap gap-1">
          {TEACHER_SHIFTS.filter((item) => {
            const allowed = allowedShiftsForCycle(assignment.cycle);
            return allowed.includes(item.value);
          }).map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={assignment.shift === item.value ? "default" : "outline"}
              onClick={() => handleShiftChange(item.value)}
              disabled={disabled}
            >
              {getTeacherShiftLabel(item.value)}
            </Button>
          ))}
        </div>
      </div>

      {showSubShifts && (
        <div className="mt-3 flex flex-col gap-2">
          <Label>Sub-turno</Label>
          <div className="flex flex-wrap gap-1">
            {allowedSubShifts.map((value) => (
              <Button
                key={value}
                type="button"
                variant={assignment.subShift === value ? "default" : "outline"}
                onClick={() => onChange(index, "subShift", value)}
                disabled={disabled}
              >
                {getSubShiftLabel(value)}
              </Button>
            ))}
          </div>
          {subShiftMissing && (
            <p className="text-sm text-destructive" role="alert">
              Selecciona un sub-turno para este curso de laboratorio.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SpaceForm;

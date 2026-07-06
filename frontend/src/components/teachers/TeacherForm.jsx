import { useCallback, useEffect, useState } from "react";
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
import {
  allowedShiftsForCycle,
  EMPLOYMENT_TYPES,
  TEACHER_SHIFTS,
  getCycleLabel,
  getEmploymentTypeLabel,
  getTeacherShiftLabel,
} from "@/lib/constants";
import { listCourses } from "@/lib/api";

function getFirstAllowedShift(cycle) {
  const [first] = allowedShiftsForCycle(cycle);
  return first ?? "MANANA";
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employmentType: "NOMBRADO",
  courseAssignments: [],
};

function teacherToForm(teacher) {
  if (!teacher) {
    return EMPTY_FORM;
  }

  return {
    firstName: teacher.firstName ?? "",
    lastName: teacher.lastName ?? "",
    email: teacher.email ?? "",
    phone: teacher.phone ?? "",
    employmentType: teacher.employmentType ?? "NOMBRADO",
    courseAssignments:
      teacher.courseAssignments?.length > 0
        ? teacher.courseAssignments.map((assignment) => ({
            courseId: assignment.courseId,
            shift: assignment.shift ?? getFirstAllowedShift(assignment.cycle),
          }))
        : [],
  };
}

function TeacherForm({ teacher, onSubmit, onCancel, isSubmitting, error, onUnauthorized }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);

  const employmentAnchor = useComboboxAnchor();

  const loadCourses = useCallback(async () => {
    try {
      const data = await listCourses({}, onUnauthorized);
      setCourses(data);
    } catch (err) {
      // ignore — keep previous list
    }
  }, [onUnauthorized]);

  useEffect(() => {
    setForm(teacherToForm(teacher));
  }, [teacher]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleEmploymentTypeChange = (value) => {
    const employmentType = value ?? "NOMBRADO";
    setForm((current) => ({ ...current, employmentType }));
  };

  const handleAssignmentChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      courseAssignments: current.courseAssignments.map((assignment, itemIndex) =>
        itemIndex === index ? { ...assignment, [field]: value } : assignment
      ),
    }));
  };

  const addAssignment = () => {
    setForm((current) => ({
      ...current,
      courseAssignments: [
        ...current.courseAssignments,
        { courseId: null, shift: "MANANA" },
      ],
    }));
  };

  const handleCourseSelect = (index, course) => {
    const nextCourseId = course?.id ?? null;
    const nextCycle = course?.cycle ?? null;
    const nextAllowedShifts = allowedShiftsForCycle(nextCycle);
    const currentShift = form.courseAssignments[index]?.shift;
    const nextShift = currentShift && nextAllowedShifts.includes(currentShift)
      ? currentShift
      : getFirstAllowedShift(nextCycle);
    setForm((current) => ({
      ...current,
      courseAssignments: current.courseAssignments.map((assignment, itemIndex) =>
        itemIndex === index
          ? { ...assignment, courseId: nextCourseId, shift: nextShift }
          : assignment
      ),
    }));
  };

  const removeAssignment = (index) => {
    setForm((current) => ({
      ...current,
      courseAssignments: current.courseAssignments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const courseAssignments = form.courseAssignments
      .filter((assignment) => assignment.courseId)
      .map((assignment) => ({
        courseId: Number(assignment.courseId),
        shift: assignment.shift,
      }));

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      employmentType: form.employmentType,
      courseAssignments,
    };

    await onSubmit(payload);
  };

  const isEditing = Boolean(teacher?.id);

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
        Volver a docentes
      </Button>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="teacher-first-name">Nombre</Label>
            <Input
              id="teacher-first-name"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="teacher-last-name">Apellido</Label>
            <Input
              id="teacher-last-name"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="teacher-email">Email</Label>
            <Input
              id="teacher-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="teacher-phone">Teléfono</Label>
            <Input
              id="teacher-phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="teacher-employment-type">Tipo de docente</Label>
            <div ref={employmentAnchor} className="w-full">
              <Combobox
                items={EMPLOYMENT_TYPES.map((item) => item.label)}
                value={getEmploymentTypeLabel(form.employmentType)}
                onValueChange={(label) => {
                  const item = EMPLOYMENT_TYPES.find((option) => option.label === label);
                  handleEmploymentTypeChange(item?.value ?? "NOMBRADO");
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput
                  id="teacher-employment-type"
                  placeholder="Seleccionar tipo"
                  readOnly
                />
                <ComboboxContent anchor={employmentAnchor}>
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

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Cursos asignados</Label>
              <p className="text-xs text-muted-foreground">
                Cada curso se asigna con su propio turno (máx. 2 turnos por docente).
              </p>
            </div>
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

          {form.courseAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cursos asignados.</p>
          ) : (
            form.courseAssignments.map((assignment, index) => (
              <AssignmentRow
                key={`assignment-${index}`}
                assignment={assignment}
                index={index}
                canRemove={true}
                disabled={isSubmitting}
                courses={courses}
                onChange={handleAssignmentChange}
                onCourseSelect={handleCourseSelect}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

function AssignmentRow({
  assignment,
  index,
  canRemove,
  disabled,
  courses,
  onChange,
  onCourseSelect,
  onRemove,
}) {
  const selectedCourse = courses.find((c) => c.id === assignment.courseId) ?? null;

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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`assignment-course-${index}`}>Curso</Label>
          <CourseSearchInput
            inputId={`assignment-course-${index}`}
            value={selectedCourse}
            onSelect={(course) => onCourseSelect(index, course)}
            disabled={disabled}
            courses={courses}
            placeholder="Buscar curso…"
            getLabel={(course) => `${course.code} · ${course.name}`}
            getSecondary={(course) => getCycleLabel(course.cycle)}
          />
          {selectedCourse && (
            <p className="text-xs text-muted-foreground">
              {getCycleLabel(selectedCourse.cycle)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Turno</Label>
          <div className="flex flex-wrap gap-1">
            {TEACHER_SHIFTS.filter((item) =>
              allowedShiftsForCycle(selectedCourse?.cycle).includes(item.value)
            ).map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={assignment.shift === item.value ? "default" : "outline"}
                onClick={() => onChange(index, "shift", item.value)}
                disabled={disabled}
              >
                {getTeacherShiftLabel(item.value)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherForm;

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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
  CYCLES,
  EMPLOYMENT_TYPES,
  TEACHER_SHIFTS,
  getCourseCategoryForEmploymentType,
  getCycleLabel,
  getEmploymentTypeLabel,
} from "@/lib/constants";

function createEmptyAssignment(employmentType) {
  return {
    courseName: "",
    courseCategory: getCourseCategoryForEmploymentType(employmentType),
    cycle: 1,
  };
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employmentType: "NOMBRADO",
  shifts: ["MANANA"],
  assignments: [createEmptyAssignment("NOMBRADO")],
};

function normalizeEmploymentType(value) {
  if (value === "INVITADO") {
    return "ESTUDIOS_GENERALES";
  }
  return value ?? "NOMBRADO";
}

function teacherToForm(teacher) {
  if (!teacher) {
    return EMPTY_FORM;
  }

  const employmentType = normalizeEmploymentType(teacher.employmentType);
  const courseCategory = getCourseCategoryForEmploymentType(employmentType);

  return {
    firstName: teacher.firstName ?? "",
    lastName: teacher.lastName ?? "",
    email: teacher.email ?? "",
    phone: teacher.phone ?? "",
    employmentType,
    shifts:
      teacher.shifts?.length > 0
        ? [...teacher.shifts]
        : teacher.shift
          ? [teacher.shift]
          : ["MANANA"],
    assignments:
      teacher.assignments?.length > 0
        ? teacher.assignments.map((assignment) => ({
            courseName: assignment.courseName ?? "",
            courseCategory,
            cycle: assignment.cycle ?? 1,
          }))
        : [createEmptyAssignment(employmentType)],
  };
}

function TeacherForm({ teacher, onSubmit, onCancel, isSubmitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const employmentAnchor = useComboboxAnchor();

  useEffect(() => {
    setForm(teacherToForm(teacher));
  }, [teacher]);

  const handleEmploymentTypeChange = (value) => {
    const employmentType = value ?? "NOMBRADO";
    const courseCategory = getCourseCategoryForEmploymentType(employmentType);
    setForm((current) => ({
      ...current,
      employmentType,
      assignments: current.assignments.map((assignment) => ({
        ...assignment,
        courseCategory,
      })),
    }));
  };

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
      assignments: [
        ...current.assignments,
        createEmptyAssignment(current.employmentType),
      ],
    }));
  };

  const removeAssignment = (index) => {
    setForm((current) => ({
      ...current,
      assignments: current.assignments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const toggleShift = (shift) => {
    setForm((current) => {
      const isSelected = current.shifts.includes(shift);
      if (isSelected) {
        if (current.shifts.length === 1) {
          return current;
        }
        return {
          ...current,
          shifts: current.shifts.filter((item) => item !== shift),
        };
      }
      return {
        ...current,
        shifts: [...current.shifts, shift],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.shifts.length === 0) {
      return;
    }
    const courseCategory = getCourseCategoryForEmploymentType(form.employmentType);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      employmentType: form.employmentType,
      shifts: form.shifts,
      assignments: form.assignments
        .filter((assignment) => assignment.courseName.trim())
        .map((assignment) => ({
          courseName: assignment.courseName.trim(),
          courseCategory,
          cycle: Number(assignment.cycle),
        })),
    };

    if (payload.assignments.length === 0) {
      return;
    }

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

          <div className="flex flex-col gap-2">
            <Label>Turno</Label>
            <div className="flex flex-wrap gap-1">
              {TEACHER_SHIFTS.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={form.shifts.includes(item.value) ? "default" : "outline"}
                  onClick={() => toggleShift(item.value)}
                  disabled={isSubmitting}
                >
                  {item.label}
                </Button>
              ))}
            </div>
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

          {form.assignments.map((assignment, index) => (
            <AssignmentRow
              key={`assignment-${index}`}
              assignment={assignment}
              index={index}
              canRemove={form.assignments.length > 1}
              disabled={isSubmitting}
              onChange={handleAssignmentChange}
              onRemove={removeAssignment}
            />
          ))}
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
  onChange,
  onRemove,
}) {
  const cycleAnchor = useComboboxAnchor();

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
          <Label htmlFor={`assignment-course-${index}`}>Nombre del curso</Label>
          <Input
            id={`assignment-course-${index}`}
            value={assignment.courseName}
            onChange={(event) => onChange(index, "courseName", event.target.value)}
            required
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`assignment-cycle-${index}`}>Ciclo</Label>
          <div ref={cycleAnchor} className="w-full">
            <Combobox
              items={CYCLES.map((item) => item.label)}
              value={getCycleLabel(assignment.cycle)}
              onValueChange={(label) => {
                const item = CYCLES.find((option) => option.label === label);
                onChange(index, "cycle", item?.id ?? 1);
              }}
              disabled={disabled}
            >
              <ComboboxInput
                id={`assignment-cycle-${index}`}
                placeholder="Ciclo"
                readOnly
              />
              <ComboboxContent anchor={cycleAnchor}>
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
    </div>
  );
}

export default TeacherForm;

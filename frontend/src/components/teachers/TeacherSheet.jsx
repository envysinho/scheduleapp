import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  COURSE_CATEGORIES,
  CYCLES,
  EMPLOYMENT_TYPES,
  getCourseCategoryLabel,
  getCycleLabel,
  getEmploymentTypeLabel,
} from "@/lib/constants";

const EMPTY_ASSIGNMENT = {
  courseName: "",
  courseCategory: "CARRERA",
  cycle: 1,
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employmentType: "NOMBRADO",
  assignments: [{ ...EMPTY_ASSIGNMENT }],
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
    assignments:
      teacher.assignments?.length > 0
        ? teacher.assignments.map((assignment) => ({
            courseName: assignment.courseName ?? "",
            courseCategory: assignment.courseCategory ?? "CARRERA",
            cycle: assignment.cycle ?? 1,
          }))
        : [{ ...EMPTY_ASSIGNMENT }],
  };
}

function TeacherSheet({
  open,
  onOpenChange,
  teacher,
  onSubmit,
  isSubmitting,
  error,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const employmentAnchor = useComboboxAnchor();

  useEffect(() => {
    if (open) {
      setForm(teacherToForm(teacher));
    }
  }, [open, teacher]);

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
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      employmentType: form.employmentType,
      assignments: form.assignments
        .filter((assignment) => assignment.courseName.trim())
        .map((assignment) => ({
          courseName: assignment.courseName.trim(),
          courseCategory: assignment.courseCategory,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? "Editar docente" : "Añadir docente"}</SheetTitle>
            <SheetDescription>
              Complete los datos del docente y sus cursos asignados.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="teacher-employment-type">Tipo de docente</Label>
              <div ref={employmentAnchor} className="w-full">
                <Combobox
                  items={EMPLOYMENT_TYPES.map((item) => item.label)}
                  value={getEmploymentTypeLabel(form.employmentType)}
                  onValueChange={(label) => {
                    const item = EMPLOYMENT_TYPES.find((option) => option.label === label);
                    setForm((current) => ({
                      ...current,
                      employmentType: item?.value ?? "NOMBRADO",
                    }));
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

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
  const categoryAnchor = useComboboxAnchor();
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`assignment-category-${index}`}>Categoría</Label>
            <div ref={categoryAnchor} className="w-full">
              <Combobox
                items={COURSE_CATEGORIES.map((item) => item.label)}
                value={getCourseCategoryLabel(assignment.courseCategory)}
                onValueChange={(label) => {
                  const item = COURSE_CATEGORIES.find((option) => option.label === label);
                  onChange(index, "courseCategory", item?.value ?? "CARRERA");
                }}
                disabled={disabled}
              >
                <ComboboxInput
                  id={`assignment-category-${index}`}
                  placeholder="Categoría"
                  readOnly
                />
                <ComboboxContent anchor={categoryAnchor}>
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
    </div>
  );
}

export default TeacherSheet;

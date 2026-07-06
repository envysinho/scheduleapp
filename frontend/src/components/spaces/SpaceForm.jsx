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
import { listCourses } from "@/lib/api";
import {
  AVAILABILITY_STATUSES,
  CYCLES,
  SPACE_TYPES,
  getAvailabilityLabel,
  getCycleLabel,
  getSpaceTypeLabel,
} from "@/lib/constants";

const EMPTY_ASSIGNMENT = {
  courseName: "",
  cycle: 1,
};

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
            cycle: assignment.cycle ?? 1,
          }))
        : [{ ...EMPTY_ASSIGNMENT }],
  };
}

function SpaceForm({ space, onSubmit, onCancel, isSubmitting, error }) {
  const { logout } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const spaceTypeAnchor = useComboboxAnchor();
  const availabilityAnchor = useComboboxAnchor();

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCourses(true);
    listCourses({}, logout)
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
  }, [logout]);

  useEffect(() => {
    setForm(spaceToForm(space));
  }, [space]);

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
      managerName: form.managerName.trim(),
      managerPhone: form.managerPhone.trim() || null,
      assignments: form.assignments
        .filter((assignment) => assignment.courseName.trim())
        .map((assignment) => ({
          courseName: assignment.courseName.trim(),
          cycle: Number(assignment.cycle),
        })),
    };

    if (payload.assignments.length === 0) {
      return;
    }

    await onSubmit(payload);
  };

  const isEditing = Boolean(space?.id);

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
            <Label htmlFor="space-manager-name">Nombre del encargado</Label>
            <Input
              id="space-manager-name"
              value={form.managerName}
              onChange={(event) =>
                setForm((current) => ({ ...current, managerName: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="space-manager-phone">Teléfono del encargado</Label>
            <Input
              id="space-manager-phone"
              value={form.managerPhone}
              onChange={(event) =>
                setForm((current) => ({ ...current, managerPhone: event.target.value }))
              }
              disabled={isSubmitting}
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

          {form.assignments.map((assignment, index) => (
            <AssignmentRow
              key={`assignment-${index}`}
              assignment={assignment}
              index={index}
              canRemove={form.assignments.length > 1}
              disabled={isSubmitting || isLoadingCourses}
              courses={courses}
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

function AssignmentRow({ assignment, index, canRemove, disabled, courses, onChange, onRemove }) {
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`assignment-course-${index}`}>Nombre del curso</Label>
            <CourseSearchInput
              value={assignment.courseName}
              onChange={(value) => onChange(index, "courseName", value)}
              disabled={disabled}
              courses={courses}
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

export default SpaceForm;

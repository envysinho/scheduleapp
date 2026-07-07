import { useCallback, useEffect, useState } from "react";
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
  COURSE_TYPES,
  CYCLES,
  SPACE_TYPES,
  allowedSubShiftsForCycle,
  getCourseTypeLabel,
  getCycleLabel,
  getSpaceTypeLabel,
  getSubShiftLabel,
  getTeacherShiftLabel,
  isNightOnlyCycle,
} from "@/lib/constants";
import { listSpaces } from "@/lib/api";

const EMPTY_SPACE_ASSIGNMENT = {
  spaceId: null,
};

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "DE_CARRERA",
  lectivo: false,
  cycle: 1,
  requiredSpaceType: "AULA",
  spaceAssignments: [],
};

const UNASSIGNED_LABEL = "Sin asignar";

function withUnassignedOption(labels) {
  return [UNASSIGNED_LABEL, ...labels];
}

function resolveSpaceSelection(label, spaces) {
  if (label === UNASSIGNED_LABEL) {
    return null;
  }
  return spaces.find((space) => space.name === label)?.id ?? null;
}

function courseToForm(course) {
  if (!course) {
    return EMPTY_FORM;
  }

  const isLegacyLectivo = course.type === "LECTIVOS";

  return {
    name: course.name ?? "",
    code: course.code ?? "",
    type: isLegacyLectivo ? "DE_CARRERA" : (course.type ?? "DE_CARRERA"),
    lectivo: course.lectivo ?? isLegacyLectivo,
    cycle: course.cycle ?? 1,
    requiredSpaceType: course.requiredSpaceType ?? "AULA",
    spaceAssignments:
      course.spaceAssignments?.length > 0
        ? course.spaceAssignments.map((assignment) => ({
            spaceId: assignment.spaceId,
          }))
        : [],
  };
}

function CourseForm({ course, onSubmit, onCancel, isSubmitting, error, onUnauthorized }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [spaces, setSpaces] = useState([]);

  const typeAnchor = useComboboxAnchor();
  const cycleAnchor = useComboboxAnchor();
  const requiredSpaceTypeAnchor = useComboboxAnchor();

  const loadOptions = useCallback(async () => {
    const spacesData = await listSpaces({}, onUnauthorized);
    setSpaces(spacesData);
  }, [onUnauthorized]);

  useEffect(() => {
    setForm(courseToForm(course));
  }, [course]);

  useEffect(() => {
    loadOptions().catch(() => {});
  }, [loadOptions]);

  const spaceLabels = spaces.map((space) => space.name);
  const nightOnly = isNightOnlyCycle(form.cycle);
  const requiredSpaceType = form.requiredSpaceType;

  const labSubShifts = (() => {
    const shifts = nightOnly ? ["NOCHE"] : ["MANANA", "TARDE"];
    return shifts.flatMap((shift) =>
      allowedSubShiftsForCycle(form.cycle, shift, requiredSpaceType).map((subShift) => ({
        shift,
        subShift,
        teacher:
          course?.teacherAssignments?.find(
            (assignment) =>
              assignment.shift === shift && assignment.subShift === subShift
          )?.teacherName ?? null,
      }))
    );
  })();
  const hasLabSubShifts = labSubShifts.length > 0;

  const spaceMismatch = form.spaceAssignments
    .map((assignment, index) => {
      if (assignment.spaceId == null) {
        return null;
      }
      const space = spaces.find((item) => item.id === assignment.spaceId);
      if (!space || space.spaceType === requiredSpaceType) {
        return null;
      }
      return { index, spaceName: space.name, spaceType: space.spaceType };
    })
    .filter(Boolean);
  const hasSpaceMismatch = spaceMismatch.length > 0;

  const handleSpaceAssignmentChange = (index, spaceId) => {
    setForm((current) => ({
      ...current,
      spaceAssignments: current.spaceAssignments.map((assignment, itemIndex) =>
        itemIndex === index ? { spaceId } : assignment
      ),
    }));
  };

  const addSpaceAssignment = () => {
    setForm((current) => ({
      ...current,
      spaceAssignments: [...current.spaceAssignments, { ...EMPTY_SPACE_ASSIGNMENT }],
    }));
  };

  const removeSpaceAssignment = (index) => {
    setForm((current) => ({
      ...current,
      spaceAssignments: current.spaceAssignments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      type: form.type,
      lectivo: form.lectivo,
      cycle: Number(form.cycle),
      requiredSpaceType: form.requiredSpaceType,
      spaceAssignments: form.spaceAssignments
        .filter((assignment) => assignment.spaceId)
        .map((assignment) => ({ spaceId: assignment.spaceId })),
    };

    await onSubmit(payload);
  };

  const isEditing = Boolean(course?.id);

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
        Volver a cursos
      </Button>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-name">Nombre del curso</Label>
            <Input
              id="course-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-code">Código del curso</Label>
            <Input
              id="course-code"
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              required
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-type">Tipo de curso</Label>
            <div ref={typeAnchor} className="w-full">
              <Combobox
                items={COURSE_TYPES.map((item) => item.label)}
                value={getCourseTypeLabel(form.type)}
                onValueChange={(label) => {
                  const item = COURSE_TYPES.find((option) => option.label === label);
                  setForm((current) => ({
                    ...current,
                    type: item?.value ?? "DE_CARRERA",
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput id="course-type" placeholder="Seleccionar tipo" readOnly />
                <ComboboxContent anchor={typeAnchor}>
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
            <div className="flex items-center gap-2">
              <input
                id="course-lectivo"
                type="checkbox"
                checked={form.lectivo}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lectivo: event.target.checked }))
                }
                disabled={isSubmitting}
                className="size-4 rounded border"
              />
              <Label htmlFor="course-lectivo">Curso lectivo</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="course-cycle">Ciclo</Label>
            <div ref={cycleAnchor} className="w-full">
              <Combobox
                items={CYCLES.map((item) => item.label)}
                value={getCycleLabel(form.cycle)}
                onValueChange={(label) => {
                  const item = CYCLES.find((option) => option.label === label);
                  setForm((current) => ({
                    ...current,
                    cycle: item?.id ?? 1,
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput id="course-cycle" placeholder="Ciclo" readOnly />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="course-required-space-type">Ambiente requerido</Label>
            <div ref={requiredSpaceTypeAnchor} className="w-full">
              <Combobox
                items={SPACE_TYPES.map((item) => item.label)}
                value={getSpaceTypeLabel(form.requiredSpaceType)}
                onValueChange={(label) => {
                  const item = SPACE_TYPES.find((option) => option.label === label);
                  setForm((current) => ({
                    ...current,
                    requiredSpaceType: item?.value ?? "AULA",
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput
                  id="course-required-space-type"
                  placeholder="Seleccionar ambiente"
                  readOnly
                />
                <ComboboxContent anchor={requiredSpaceTypeAnchor}>
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

        {nightOnly && (
          <p className="text-sm text-muted-foreground">
            Los cursos de Ciclo IX y X son solo turno noche.
          </p>
        )}

        {hasLabSubShifts && (
          <div className="flex flex-col gap-2 rounded-md border p-3">
            <div>
              <Label>Sub-turnos</Label>
              <p className="text-xs text-muted-foreground">
                Docentes asignados por sub-turno (se asignan desde la pestaña Docentes).
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {labSubShifts.map(({ shift, subShift, teacher }) => (
                <div
                  key={`${shift}-${subShift}`}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                >
                  <span className="font-medium">
                    {getSubShiftLabel(subShift)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({getTeacherShiftLabel(shift)})
                    </span>
                  </span>
                  <span className={teacher ? "" : "text-muted-foreground"}>
                    {teacher ?? "Sin asignar"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Ambientes asignados</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSpaceAssignment}
              disabled={isSubmitting}
            >
              <Plus className="size-4" />
              Añadir ambiente
            </Button>
          </div>

          {form.spaceAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ambientes asignados.</p>
          ) : (
            form.spaceAssignments.map((assignment, index) => (
              <SpaceAssignmentRow
                key={`space-${index}`}
                assignment={assignment}
                index={index}
                spaceLabels={spaceLabels}
                spaces={spaces}
                requiredSpaceType={requiredSpaceType}
                disabled={isSubmitting}
                onChange={handleSpaceAssignmentChange}
                onRemove={removeSpaceAssignment}
              />
            ))
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {hasSpaceMismatch && (
          <p className="text-sm text-destructive" role="alert">
            Corrige los ambientes que no coincen con el tipo requerido antes de
            guardar.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || hasSpaceMismatch}>
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}

function SpaceAssignmentRow({
  assignment,
  index,
  spaceLabels,
  spaces,
  requiredSpaceType,
  disabled,
  onChange,
  onRemove,
}) {
  const spaceAnchor = useComboboxAnchor();
  const selectedSpace =
    assignment.spaceId == null
      ? null
      : (spaces.find((space) => space.id === assignment.spaceId) ?? null);
  const selectedLabel = selectedSpace?.name ?? UNASSIGNED_LABEL;
  const mismatch =
    selectedSpace != null && selectedSpace.spaceType !== requiredSpaceType;

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Ambiente {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          aria-label={`Quitar ambiente ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`space-assignment-${index}`}>Ambiente</Label>
        <div ref={spaceAnchor} className="w-full">
          <Combobox
            items={withUnassignedOption(spaceLabels)}
            value={selectedLabel}
            onValueChange={(label) => {
              onChange(index, resolveSpaceSelection(label, spaces));
            }}
            disabled={disabled}
          >
            <ComboboxInput
              id={`space-assignment-${index}`}
              placeholder="Sin asignar"
              readOnly
            />
            <ComboboxContent anchor={spaceAnchor}>
              <ComboboxEmpty>Sin ambientes.</ComboboxEmpty>
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
        {mismatch && (
          <p className="text-sm text-destructive" role="alert">
            Este curso requiere un ambiente de tipo{" "}
            {getSpaceTypeLabel(requiredSpaceType).toLowerCase()}, pero
            &quot;{selectedSpace.name}&quot; es{" "}
            {getSpaceTypeLabel(selectedSpace.spaceType).toLowerCase()}.
          </p>
        )}
      </div>
    </div>
  );
}

export default CourseForm;

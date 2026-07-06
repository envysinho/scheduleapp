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
  getCourseTypeLabel,
  getCycleLabel,
  isNightOnlyCycle,
} from "@/lib/constants";
import { listSpaces, listTeachers } from "@/lib/api";

const EMPTY_SPACE_ASSIGNMENT = {
  spaceId: null,
};

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "DE_CARRERA",
  lectivo: false,
  cycle: 1,
  sameTeacher: true,
  morningTeacherId: null,
  afternoonTeacherId: null,
  nightTeacherId: null,
  spaceAssignments: [],
};

const UNASSIGNED_LABEL = "Sin asignar";

function withUnassignedOption(labels) {
  return [UNASSIGNED_LABEL, ...labels];
}

function resolveTeacherSelection(label, teachers) {
  if (label === UNASSIGNED_LABEL) {
    return null;
  }
  return teachers.find((teacher) => teacher.fullName === label)?.id ?? null;
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

  const sameTeacher =
    course.morningTeacher &&
    course.afternoonTeacher &&
    course.morningTeacher.id === course.afternoonTeacher.id;

  const isLegacyLectivo = course.type === "LECTIVOS";
  const cycle = course.cycle ?? 1;
  const nightOnly = isNightOnlyCycle(cycle);

  return {
    name: course.name ?? "",
    code: course.code ?? "",
    type: isLegacyLectivo ? "DE_CARRERA" : (course.type ?? "DE_CARRERA"),
    lectivo: course.lectivo ?? isLegacyLectivo,
    cycle,
    sameTeacher: nightOnly
      ? true
      : sameTeacher || (!course.afternoonTeacher && Boolean(course.morningTeacher)),
    morningTeacherId: nightOnly ? null : (course.morningTeacher?.id ?? null),
    afternoonTeacherId: nightOnly ? null : (course.afternoonTeacher?.id ?? null),
    nightTeacherId: course.nightTeacher?.id ?? null,
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
  const [teachers, setTeachers] = useState([]);
  const [spaces, setSpaces] = useState([]);

  const typeAnchor = useComboboxAnchor();
  const cycleAnchor = useComboboxAnchor();
  const morningTeacherAnchor = useComboboxAnchor();
  const afternoonTeacherAnchor = useComboboxAnchor();
  const nightTeacherAnchor = useComboboxAnchor();

  const loadOptions = useCallback(async () => {
    const [teachersData, spacesData] = await Promise.all([
      listTeachers({}, onUnauthorized),
      listSpaces({}, onUnauthorized),
    ]);
    setTeachers(teachersData);
    setSpaces(spacesData);
  }, [onUnauthorized]);

  useEffect(() => {
    setForm(courseToForm(course));
  }, [course]);

  useEffect(() => {
    loadOptions().catch(() => {});
  }, [loadOptions]);

  const morningTeachers = teachers;
  const afternoonTeachers = teachers;
  const nightTeachers = teachers;

  const morningTeacherLabels = morningTeachers.map((teacher) => teacher.fullName);
  const afternoonTeacherLabels = afternoonTeachers.map((teacher) => teacher.fullName);
  const nightTeacherLabels = nightTeachers.map((teacher) => teacher.fullName);
  const spaceLabels = spaces.map((space) => space.name);
  const nightOnly = isNightOnlyCycle(form.cycle);

  const getTeacherLabel = (teacherId) => {
    if (teacherId == null) {
      return UNASSIGNED_LABEL;
    }
    return teachers.find((teacher) => teacher.id === teacherId)?.fullName ?? "";
  };

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

    const morningTeacherId = nightOnly ? null : form.morningTeacherId;
    const afternoonTeacherId = nightOnly
      ? null
      : form.sameTeacher
        ? form.morningTeacherId
        : form.afternoonTeacherId;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      type: form.type,
      lectivo: form.lectivo,
      cycle: Number(form.cycle),
      morningTeacherId: morningTeacherId || null,
      afternoonTeacherId: afternoonTeacherId || null,
      nightTeacherId: form.nightTeacherId || null,
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
                  const cycle = item?.id ?? 1;
                  setForm((current) => ({
                    ...current,
                    cycle,
                    ...(isNightOnlyCycle(cycle)
                      ? {
                          morningTeacherId: null,
                          afternoonTeacherId: null,
                          sameTeacher: true,
                        }
                      : {}),
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

        <div className="flex flex-col gap-3">
          {nightOnly && (
            <p className="text-sm text-muted-foreground">
              Los cursos de Ciclo IX y X son solo turno noche.
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              id="same-teacher"
              type="checkbox"
              checked={form.sameTeacher}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sameTeacher: event.target.checked,
                  afternoonTeacherId: event.target.checked
                    ? current.morningTeacherId
                    : current.afternoonTeacherId,
                }))
              }
              disabled={isSubmitting || nightOnly}
              className="size-4 rounded border"
            />
            <Label htmlFor="same-teacher">Mismo docente en ambos turnos</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="morning-teacher">
                {form.sameTeacher ? "Docente" : "Docente 1 (Mañana)"}
              </Label>
              <div ref={morningTeacherAnchor} className="w-full">
                <Combobox
                  items={withUnassignedOption(morningTeacherLabels)}
                  value={getTeacherLabel(form.morningTeacherId)}
                  onValueChange={(label) => {
                    const teacherId = resolveTeacherSelection(label, morningTeachers);
                    setForm((current) => ({
                      ...current,
                      morningTeacherId: teacherId,
                      afternoonTeacherId: current.sameTeacher
                        ? teacherId
                        : current.afternoonTeacherId,
                    }));
                  }}
                  disabled={isSubmitting || nightOnly}
                >
                  <ComboboxInput
                    id="morning-teacher"
                    placeholder="Sin asignar"
                    readOnly
                  />
                  <ComboboxContent anchor={morningTeacherAnchor}>
                    <ComboboxEmpty>Sin docentes.</ComboboxEmpty>
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

            {!form.sameTeacher && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="afternoon-teacher">Docente 2 (Tarde)</Label>
                <div ref={afternoonTeacherAnchor} className="w-full">
                  <Combobox
                    items={withUnassignedOption(afternoonTeacherLabels)}
                    value={getTeacherLabel(form.afternoonTeacherId)}
                    onValueChange={(label) => {
                      const teacherId = resolveTeacherSelection(label, afternoonTeachers);
                      setForm((current) => ({
                        ...current,
                        afternoonTeacherId: teacherId,
                      }));
                    }}
                    disabled={isSubmitting || nightOnly}
                  >
                    <ComboboxInput
                      id="afternoon-teacher"
                      placeholder="Sin asignar"
                      readOnly
                    />
                    <ComboboxContent anchor={afternoonTeacherAnchor}>
                      <ComboboxEmpty>Sin docentes.</ComboboxEmpty>
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
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="night-teacher">Docente (Noche)</Label>
            <div ref={nightTeacherAnchor} className="w-full">
              <Combobox
                items={withUnassignedOption(nightTeacherLabels)}
                value={getTeacherLabel(form.nightTeacherId)}
                onValueChange={(label) => {
                  const teacherId = resolveTeacherSelection(label, nightTeachers);
                  setForm((current) => ({
                    ...current,
                    nightTeacherId: teacherId,
                  }));
                }}
                disabled={isSubmitting}
              >
                <ComboboxInput
                  id="night-teacher"
                  placeholder="Sin asignar"
                  readOnly
                />
                <ComboboxContent anchor={nightTeacherAnchor}>
                  <ComboboxEmpty>Sin docentes de noche.</ComboboxEmpty>
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

function SpaceAssignmentRow({
  assignment,
  index,
  spaceLabels,
  spaces,
  disabled,
  onChange,
  onRemove,
}) {
  const spaceAnchor = useComboboxAnchor();
  const selectedLabel =
    assignment.spaceId == null
      ? UNASSIGNED_LABEL
      : (spaces.find((space) => space.id === assignment.spaceId)?.name ?? "");

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
      </div>
    </div>
  );
}

export default CourseForm;

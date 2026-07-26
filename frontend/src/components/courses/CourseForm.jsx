import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "DE_CARRERA",
  lectivo: false,
  cycle: 1,
  requiredSpaceType: "AULA",
};

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
  };
}

function CourseForm({ course, onSubmit, onCancel, isSubmitting, error }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const typeAnchor = useComboboxAnchor();
  const cycleAnchor = useComboboxAnchor();
  const requiredSpaceTypeAnchor = useComboboxAnchor();

  useEffect(() => {
    setForm(courseToForm(course));
  }, [course]);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      type: form.type,
      lectivo: form.lectivo,
      cycle: Number(form.cycle),
      requiredSpaceType: form.requiredSpaceType,
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
            <p className="text-xs text-muted-foreground">
              Marca esta opción si el curso debe considerarse lectivo dentro de la planificación.
            </p>
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
            <Label htmlFor="course-required-space-type">Tipo de ambiente que necesita el curso</Label>
            <p className="text-xs text-muted-foreground">
              Define el tipo de ambiente adecuado para poder asignarlo correctamente.
            </p>
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

        <div className="rounded-md border p-3">
          <Label>Asignación de ambientes</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            La asignación concreta de aulas y laboratorios se gestiona desde la sección
            `Ambientes`.
          </p>
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

export default CourseForm;

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listSpaces } from "@/lib/api";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  labAssignments: [],
};

function practiceHeadToForm(practiceHead) {
  if (!practiceHead) {
    return EMPTY_FORM;
  }

  return {
    firstName: practiceHead.firstName ?? "",
    lastName: practiceHead.lastName ?? "",
    email: practiceHead.email ?? "",
    phone: practiceHead.phone ?? "",
    labAssignments:
      practiceHead.labAssignments?.length > 0
        ? practiceHead.labAssignments.map((assignment) => ({
            spaceId: assignment.spaceId,
          }))
        : [],
  };
}

function PracticeHeadForm({ practiceHead, onSubmit, onCancel, isSubmitting, error, onUnauthorized }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [labs, setLabs] = useState([]);

  const loadLabs = useCallback(async () => {
    try {
      const data = await listSpaces({}, onUnauthorized);
      setLabs(data.filter((space) => space.spaceType === "LABORATORIO"));
    } catch (err) {
      // ignore, keep previous list
    }
  }, [onUnauthorized]);

  useEffect(() => {
    setForm(practiceHeadToForm(practiceHead));
  }, [practiceHead]);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const addLabAssignment = () => {
    setForm((current) => ({
      ...current,
      labAssignments: [...current.labAssignments, { spaceId: null }],
    }));
  };

  const updateLabAssignment = (index, spaceId) => {
    setForm((current) => ({
      ...current,
      labAssignments: current.labAssignments.map((assignment, itemIndex) =>
        itemIndex === index ? { ...assignment, spaceId } : assignment
      ),
    }));
  };

  const removeLabAssignment = (index) => {
    setForm((current) => ({
      ...current,
      labAssignments: current.labAssignments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const labAssignments = form.labAssignments
      .filter((assignment) => assignment.spaceId)
      .map((assignment) => ({ spaceId: Number(assignment.spaceId) }));

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      labAssignments,
    };

    await onSubmit(payload);
  };

  const isEditing = Boolean(practiceHead?.id);

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
        Volver a jefes de práctica
      </Button>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="practice-head-first-name">Nombre</Label>
            <Input
              id="practice-head-first-name"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="practice-head-last-name">Apellido</Label>
            <Input
              id="practice-head-last-name"
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
            <Label htmlFor="practice-head-email">Email</Label>
            <Input
              id="practice-head-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="practice-head-phone">Teléfono</Label>
            <Input
              id="practice-head-phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Laboratorios asignados</Label>
              <p className="text-xs text-muted-foreground">
                Asigna uno o más laboratorios al jefe de práctica.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLabAssignment}
              disabled={isSubmitting}
            >
              <Plus className="size-4" />
              Añadir laboratorio
            </Button>
          </div>

          {form.labAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin laboratorios asignados.</p>
          ) : (
            form.labAssignments.map((assignment, index) => (
              <LabAssignmentRow
                key={`lab-assignment-${index}`}
                assignment={assignment}
                index={index}
                labs={labs}
                disabled={isSubmitting}
                onChange={updateLabAssignment}
                onRemove={removeLabAssignment}
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

function LabAssignmentRow({ assignment, index, labs, disabled, onChange, onRemove }) {
  const anchor = useComboboxAnchor();
  const selectedLab = labs.find((lab) => lab.id === assignment.spaceId) ?? null;

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Laboratorio {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          aria-label={`Quitar laboratorio ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`practice-head-lab-${index}`}>Laboratorio</Label>
        <div ref={anchor} className="w-full">
          <Combobox
            items={labs.map((lab) => lab.name)}
            value={selectedLab?.name ?? ""}
            onValueChange={(name) => {
              const lab = labs.find((item) => item.name === name);
              onChange(index, lab?.id ?? null);
            }}
            disabled={disabled}
          >
            <ComboboxInput
              id={`practice-head-lab-${index}`}
              placeholder="Seleccionar laboratorio"
              readOnly
            />
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>Sin laboratorios.</ComboboxEmpty>
              <ComboboxList>
                {(name) => (
                  <ComboboxItem key={name} value={name}>
                    {name}
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

export default PracticeHeadForm;

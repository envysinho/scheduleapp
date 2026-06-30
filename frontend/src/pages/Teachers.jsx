import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, List, UserPlus } from "lucide-react";
import PageCard from "@/components/PageCard";
import TeacherCard from "@/components/teachers/TeacherCard";
import TeacherForm from "@/components/teachers/TeacherForm";
import { Button } from "@/components/ui/button";
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
import {
  CYCLE_FILTERS,
  EMPLOYMENT_TYPE_FILTERS,
  TEACHER_SHIFT_FILTERS,
} from "@/lib/constants";
import {
  createTeacher,
  deleteTeacher,
  listTeachers,
  updateTeacher,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function Teachers() {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [teachers, setTeachers] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [employmentType, setEmploymentType] = useState(null);
  const [shift, setShift] = useState(null);
  const [cycle, setCycle] = useState(null);

  const [pageView, setPageView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employmentAnchor = useComboboxAnchor();
  const cycleAnchor = useComboboxAnchor();

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadTeachers = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await listTeachers(
        { employmentType, shift, cycle },
        handleUnauthorized
      );
      setTeachers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar docentes");
    } finally {
      setIsLoading(false);
    }
  }, [employmentType, shift, cycle, handleUnauthorized]);

  useEffect(() => {
    if (pageView === "list") {
      loadTeachers();
    }
  }, [loadTeachers, pageView]);

  const closeForm = () => {
    setPageView("list");
    setEditingTeacher(null);
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingTeacher(null);
    setFormError(null);
    setPageView("form");
  };

  const openEditForm = (teacher) => {
    setEditingTeacher(teacher);
    setFormError(null);
    setPageView("form");
  };

  const handleFormSubmit = async (payload) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (editingTeacher?.id) {
        await updateTeacher(editingTeacher.id, payload, handleUnauthorized);
      } else {
        await createTeacher(payload, handleUnauthorized);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar docente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teacher) => {
    const confirmed = window.confirm(
      `¿Eliminar a "${teacher.fullName}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteTeacher(teacher.id, handleUnauthorized);
      if (editingTeacher?.id === teacher.id) {
        closeForm();
      }
      await loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar docente");
    }
  };

  const resetFormOnFilterChange = () => {
    if (pageView === "form") {
      closeForm();
    }
  };

  const handleEmploymentFilter = (value) => {
    setEmploymentType(value);
    resetFormOnFilterChange();
  };

  const handleShiftFilter = (value) => {
    setShift(value);
    resetFormOnFilterChange();
  };

  const selectedEmploymentType =
    EMPLOYMENT_TYPE_FILTERS.find((item) => item.value === employmentType) ??
    EMPLOYMENT_TYPE_FILTERS[0];

  const selectedCycle =
    CYCLE_FILTERS.find((item) => item.value === cycle) ?? CYCLE_FILTERS[0];

  const isFormView = pageView === "form";
  const pageTitle = isFormView
    ? editingTeacher
      ? "Editar docente"
      : "Añadir docente"
    : "Docentes";

  const pageDescription = isFormView
    ? "Complete los datos del docente y sus cursos asignados."
    : "Gestión y consulta de docentes por tipo, turno y ciclo.";

  return (
    <PageCard title={pageTitle} description={pageDescription}>
      {isFormView ? (
        <TeacherForm
          teacher={editingTeacher}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          error={formError}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[180px] flex-col gap-2">
              <Label htmlFor="filter-employment-type">Tipo de docente</Label>
              <div ref={employmentAnchor} className="w-full">
                <Combobox
                  items={EMPLOYMENT_TYPE_FILTERS.map((item) => item.label)}
                  value={selectedEmploymentType.label}
                  onValueChange={(label) => {
                    const item = EMPLOYMENT_TYPE_FILTERS.find(
                      (option) => option.label === label
                    );
                    handleEmploymentFilter(item?.value ?? null);
                  }}
                >
                  <ComboboxInput
                    id="filter-employment-type"
                    placeholder="Todos"
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
                {TEACHER_SHIFT_FILTERS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={shift === item.value ? "default" : "outline"}
                    onClick={() => handleShiftFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex min-w-[160px] flex-col gap-2">
              <Label htmlFor="filter-cycle">Ciclo</Label>
              <div ref={cycleAnchor} className="w-full">
                <Combobox
                  items={CYCLE_FILTERS.map((item) => item.label)}
                  value={selectedCycle.label}
                  onValueChange={(label) => {
                    const item = CYCLE_FILTERS.find((option) => option.label === label);
                    setCycle(item?.value ?? null);
                    resetFormOnFilterChange();
                  }}
                >
                  <ComboboxInput
                    id="filter-cycle"
                    placeholder="Todos"
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

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  aria-label="Vista en cuadrícula"
                  title="Vista en cuadrícula"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  aria-label="Vista en lista"
                  title="Vista en lista"
                >
                  <List className="size-4" />
                </Button>
              </div>

              {isAdmin && (
                <Button type="button" onClick={openCreateForm}>
                  <UserPlus className="size-4" />
                  Añadir docente
                </Button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando docentes...</p>
          ) : teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay docentes que coincidan con los filtros seleccionados.
            </p>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4"
                  : "flex flex-col gap-3 pb-6"
              )}
            >
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  viewMode={viewMode}
                  isAdmin={isAdmin}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PageCard>
  );
}

export default Teachers;

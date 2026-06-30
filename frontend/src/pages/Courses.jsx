import { useCallback, useEffect, useState } from "react";
import { BookPlus, LayoutGrid, List } from "lucide-react";
import PageCard from "@/components/PageCard";
import CourseCard from "@/components/courses/CourseCard";
import CourseForm from "@/components/courses/CourseForm";
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
  COURSE_AVAILABILITY_FILTERS,
  COURSE_TYPE_FILTERS,
  CYCLE_FILTERS,
  TEACHER_SHIFT_FILTERS,
} from "@/lib/constants";
import {
  createCourse,
  deleteCourse,
  listCourses,
  updateCourse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function Courses() {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [type, setType] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [shift, setShift] = useState(null);
  const [cycle, setCycle] = useState(null);

  const [pageView, setPageView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeAnchor = useComboboxAnchor();
  const cycleAnchor = useComboboxAnchor();

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadCourses = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await listCourses(
        { type, availability, shift, cycle },
        handleUnauthorized
      );
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cursos");
    } finally {
      setIsLoading(false);
    }
  }, [type, availability, shift, cycle, handleUnauthorized]);

  useEffect(() => {
    if (pageView === "list") {
      loadCourses();
    }
  }, [loadCourses, pageView]);

  const closeForm = () => {
    setPageView("list");
    setEditingCourse(null);
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingCourse(null);
    setFormError(null);
    setPageView("form");
  };

  const openEditForm = (course) => {
    setEditingCourse(course);
    setFormError(null);
    setPageView("form");
  };

  const handleFormSubmit = async (payload) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (editingCourse?.id) {
        await updateCourse(editingCourse.id, payload, handleUnauthorized);
      } else {
        await createCourse(payload, handleUnauthorized);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar curso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `¿Eliminar "${course.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteCourse(course.id, handleUnauthorized);
      if (editingCourse?.id === course.id) {
        closeForm();
      }
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar curso");
    }
  };

  const resetFormOnFilterChange = () => {
    if (pageView === "form") {
      closeForm();
    }
  };

  const selectedType =
    COURSE_TYPE_FILTERS.find((item) => item.value === type) ?? COURSE_TYPE_FILTERS[0];

  const selectedCycle =
    CYCLE_FILTERS.find((item) => item.value === cycle) ?? CYCLE_FILTERS[0];

  const isFormView = pageView === "form";
  const pageTitle = isFormView
    ? editingCourse
      ? "Editar curso"
      : "Añadir curso"
    : "Cursos";

  const pageDescription = isFormView
    ? "Complete los datos del curso, docentes por turno y espacios asignados."
    : "Gestión y consulta de cursos por tipo, disponibilidad, turno y ciclo.";

  return (
    <PageCard title={pageTitle} description={pageDescription}>
      {isFormView ? (
        <CourseForm
          course={editingCourse}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          error={formError}
          onUnauthorized={handleUnauthorized}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[180px] flex-col gap-2">
              <Label htmlFor="filter-course-type">Tipo de curso</Label>
              <div ref={typeAnchor} className="w-full">
                <Combobox
                  items={COURSE_TYPE_FILTERS.map((item) => item.label)}
                  value={selectedType.label}
                  onValueChange={(label) => {
                    const item = COURSE_TYPE_FILTERS.find((option) => option.label === label);
                    setType(item?.value ?? null);
                    resetFormOnFilterChange();
                  }}
                >
                  <ComboboxInput id="filter-course-type" placeholder="Todos" readOnly />
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
            </div>

            <div className="flex flex-col gap-2">
              <Label>Disponibilidad</Label>
              <div className="flex flex-wrap gap-1">
                {COURSE_AVAILABILITY_FILTERS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={availability === item.value ? "default" : "outline"}
                    onClick={() => {
                      setAvailability(item.value);
                      resetFormOnFilterChange();
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
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
                    onClick={() => {
                      setShift(item.value);
                      resetFormOnFilterChange();
                    }}
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
                  <ComboboxInput id="filter-cycle" placeholder="Todos" readOnly />
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
                  <BookPlus className="size-4" />
                  Añadir curso
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
            <p className="text-sm text-muted-foreground">Cargando cursos...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cursos que coincidan con los filtros seleccionados.
            </p>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4"
                  : "flex flex-col gap-3 pb-6"
              )}
            >
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
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

export default Courses;

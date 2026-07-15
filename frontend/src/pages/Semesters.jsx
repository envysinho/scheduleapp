import { useCallback, useEffect, useMemo, useState } from "react";
import PageCard from "@/components/PageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import { listCourses } from "@/lib/api";
import { CYCLES } from "@/lib/constants";
import { CURRENT_SEMESTER, getSemesterLabel, SEMESTER_OPTIONS } from "@/lib/semesters";

const SEMESTER_META = {
  "26-I": {
    status: "Anterior",
    description: "Ambientes disponibles; sin cursos, docentes ni jefes cargados.",
  },
  "26-II": {
    status: "Actual",
    description: "Semestre activo con cursos, docentes, reglas y jefes asignados.",
  },
  "27-I": {
    status: "Próximo",
    description: "Preparado para una nueva carga académica independiente.",
  },
};

function Semesters() {
  const { logout } = useAuth();
  const { semester, setSemester } = useSemester();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadCourses = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await listCourses({ semester }, handleUnauthorized);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cursos");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [semester, handleUnauthorized]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    window.addEventListener("courses-updated", loadCourses);
    window.addEventListener("teachers-updated", loadCourses);
    return () => {
      window.removeEventListener("courses-updated", loadCourses);
      window.removeEventListener("teachers-updated", loadCourses);
    };
  }, [loadCourses]);

  const coursesByCycle = useMemo(() => {
    const grouped = new Map(CYCLES.map(({ id }) => [id, []]));

    for (const course of courses) {
      const cycleCourses = grouped.get(course.cycle);
      if (cycleCourses) {
        cycleCourses.push(course);
      }
    }

    for (const cycleCourses of grouped.values()) {
      cycleCourses.sort((left, right) => {
        const codeDiff = (left.code ?? "").localeCompare(right.code ?? "");
        return codeDiff !== 0 ? codeDiff : left.name.localeCompare(right.name);
      });
    }

    return grouped;
  }, [courses]);

  return (
    <PageCard
      title="Semestres"
      description="Cada semestre mantiene sus propios cursos, docentes, jefes de práctica y reglas."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {SEMESTER_OPTIONS.map((value) => {
          const meta = SEMESTER_META[value];
          const isSelected = semester === value;

          return (
            <div
              key={value}
              className="flex min-h-40 flex-col justify-between rounded-md border bg-card p-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{getSemesterLabel(value)}</h3>
                  <Badge variant={value === CURRENT_SEMESTER ? "default" : "secondary"}>
                    {meta.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>
              <Button
                type="button"
                variant={isSelected ? "default" : "outline"}
                className="mt-4 w-full"
                onClick={() => setSemester(value)}
              >
                {isSelected ? "Seleccionado" : "Seleccionar"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            Cursos por ciclo - {getSemesterLabel(semester)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Relación de cursos con sus docentes asignados.
          </p>
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
            No hay cursos registrados para este semestre.
          </p>
        ) : (
          <div className="space-y-5">
            {CYCLES.map(({ id, label }) => {
              const cycleCourses = coursesByCycle.get(id) ?? [];

              return (
                <section key={id} className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-normal">
                    {getCycleTitle(label)}
                  </h4>

                  {cycleCourses.length === 0 ? (
                    <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      Sin cursos registrados.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {cycleCourses.map((course) => (
                        <li
                          key={course.id}
                          className="px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 font-medium">
                            <span className="text-muted-foreground">{course.code}</span>
                            {" · "}
                            {course.name}
                            {" - "}
                            <span className="font-normal text-muted-foreground">
                              {getCourseTeachersText(course)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PageCard>
  );
}

function getCourseTeachersText(course) {
  const teachers = new Set(
    (course.teacherAssignments ?? [])
      .map((assignment) => assignment.teacherName)
      .filter(Boolean)
  );

  return teachers.size > 0 ? Array.from(teachers).sort().join(", ") : "Sin docente";
}

function getCycleTitle(label) {
  return `${label.replace("Ciclo ", "")} CICLO`;
}

export default Semesters;

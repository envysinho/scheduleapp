import PageCard from "@/components/PageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSemester } from "@/contexts/SemesterContext";
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
  const { semester, setSemester } = useSemester();

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
    </PageCard>
  );
}

export default Semesters;

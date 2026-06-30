import PageCard from "@/components/PageCard";
import { CYCLES } from "@/lib/constants";

function Horarios({ cycle = 1 }) {
  const cycleLabel =
    CYCLES.find((item) => item.id === cycle)?.label ?? `Ciclo ${cycle}`;

  return (
    <PageCard title={`Horarios — ${cycleLabel}`}>
      <p>Contenido del horario del {cycleLabel} aquí</p>
    </PageCard>
  );
}

export default Horarios;

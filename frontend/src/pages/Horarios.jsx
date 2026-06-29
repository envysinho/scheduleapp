import PageCard from "@/components/PageCard";

const CYCLES = [
  { id: 1, label: "Ciclo I" },
  { id: 2, label: "Ciclo II" },
  { id: 3, label: "Ciclo III" },
  { id: 4, label: "Ciclo IV" },
  { id: 5, label: "Ciclo V" },
  { id: 6, label: "Ciclo VI" },
  { id: 7, label: "Ciclo VII" },
  { id: 8, label: "Ciclo VIII" },
  { id: 9, label: "Ciclo IX" },
  { id: 10, label: "Ciclo X" },
];

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
export { CYCLES };

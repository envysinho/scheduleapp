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

function HorariosSection({ title, children }) {
  return (
    <div className="view-container">
      <h1>Horarios — {title}</h1>
      {children}
    </div>
  );
}

function HorariosCicloI() {
  return (
    <HorariosSection title="Ciclo I">
      <p>Contenido del horario del Ciclo I aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloII() {
  return (
    <HorariosSection title="Ciclo II">
      <p>Contenido del horario del Ciclo II aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloIII() {
  return (
    <HorariosSection title="Ciclo III">
      <p>Contenido del horario del Ciclo III aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloIV() {
  return (
    <HorariosSection title="Ciclo IV">
      <p>Contenido del horario del Ciclo IV aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloV() {
  return (
    <HorariosSection title="Ciclo V">
      <p>Contenido del horario del Ciclo V aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloVI() {
  return (
    <HorariosSection title="Ciclo VI">
      <p>Contenido del horario del Ciclo VI aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloVII() {
  return (
    <HorariosSection title="Ciclo VII">
      <p>Contenido del horario del Ciclo VII aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloVIII() {
  return (
    <HorariosSection title="Ciclo VIII">
      <p>Contenido del horario del Ciclo VIII aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloIX() {
  return (
    <HorariosSection title="Ciclo IX">
      <p>Contenido del horario del Ciclo IX aquí</p>
    </HorariosSection>
  );
}

function HorariosCicloX() {
  return (
    <HorariosSection title="Ciclo X">
      <p>Contenido del horario del Ciclo X aquí</p>
    </HorariosSection>
  );
}

const CYCLE_SECTIONS = {
  1: HorariosCicloI,
  2: HorariosCicloII,
  3: HorariosCicloIII,
  4: HorariosCicloIV,
  5: HorariosCicloV,
  6: HorariosCicloVI,
  7: HorariosCicloVII,
  8: HorariosCicloVIII,
  9: HorariosCicloIX,
  10: HorariosCicloX,
};

function Horarios({ cycle = 1 }) {
  const Section = CYCLE_SECTIONS[cycle] ?? HorariosCicloI;
  return <Section />;
}

export default Horarios;
export { CYCLES };

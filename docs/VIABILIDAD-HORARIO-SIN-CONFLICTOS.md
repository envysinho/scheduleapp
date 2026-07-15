# Viabilidad de horario sin conflictos

## Conclusión

Sí es viable **de forma condicionada**.

Si se registran los docentes de estudios generales y los contratados necesarios, y todos los cursos quedan cubiertos con su turno y sub-turno correcto, se puede plantear un horario sin conflictos para los ciclos diurnos y nocturnos. Con cena de 15 minutos y noche `17:15-22:30`, los ciclos IX y X sí alcanzan capacidad semanal.

Además, la aplicación valida asignaciones por curso, docente, turno, sub-turno y ambiente. Desde la primera implementación del motor, la pantalla `frontend/src/pages/Horarios.jsx` ya calcula una propuesta viva por ciclo usando las reglas activas.

## Reglas consideradas

Fuentes revisadas:

- `docs/CONDICIONES-DOCENTES.md`
- `docs/TURNOS-HORARIOS.md`
- `docs/REGLAS-HORARIOS-CONFIGURABLES.md`
- `backend/src/main/java/com/example/schedule/model/CourseCycleRules.java`
- `backend/src/main/java/com/example/schedule/service/TeacherService.java`
- `backend/src/main/java/com/example/schedule/service/SpaceService.java`
- `frontend/src/pages/Horarios.jsx`

Reglas base:

- Las clases van de lunes a viernes.
- No hay clases en desayuno, almuerzo ni cena.
- Turno mañana: `08:00-12:30` = 4.5 h por día.
- Turno tarde: `14:00-17:00` = 3 h por día.
- Turno noche: `17:15-22:30` = 5 h 15 min por día.
- Ciclos I-VIII: solo `MANANA` o `TARDE`.
- Ciclos IX-X: solo `NOCHE`.
- Cursos de laboratorio pueden requerir sub-turnos:
  - Día: `A1`, `A2`, `B1`, `B2`.
  - Noche laboratorio: `NA1`, `NA2`, `NB1`, `NB2`.
  - Noche aula: `NA`, `NB`.
- Docentes `NOMBRADO` y `CONTRATADO`: cursos de carrera.
- Docentes `ESTUDIOS_GENERALES`: cursos de estudios generales.

## Análisis de capacidad

Capacidad semanal por ciclo según reglas actuales:

| Tipo de ciclo | Turnos permitidos | Capacidad semanal |
|---|---:|---:|
| I-VIII | Mañana + tarde | 37.5 h reales |
| IX-X | Noche | 26.25 h reales |

Carga semanal del plan:

| Ciclo | Carga real semanal | Resultado |
|---|---:|---|
| I | 24.00 h | Viable |
| II | 24.00 h | Viable |
| III | 23.25 h | Viable |
| IV | 24.00 h | Viable |
| V | 25.50 h | Viable |
| VI | 25.50 h | Viable |
| VII | 25.50 h | Viable |
| VIII | 25.50 h | Viable |
| IX | 24.00 h | Viable |
| X | 23.25 h | Viable |

Por capacidad pura, los ciclos I-X pueden organizarse sin invadir desayuno, almuerzo ni cena. La cena reducida a 15 minutos permite que IX y X cubran su carga dentro del turno noche.

## Estado actual del sistema

Lo que ya existe:

- Validación de turno por ciclo en backend.
- Validación de tipo de docente contra tipo de curso.
- Validación de sub-turnos para cursos que lo requieren.
- Configuración de bloques del día desde Reglas.
- Seed de los 62 cursos del plan.
- Endpoint `GET /api/schedules` para calcular la propuesta actual del ciclo.
- Matriz visible aunque no haya docentes asignados.
- Dos vistas en `Horarios`: matriz textual y vista de color por franjas.
- La propuesta se recalcula al consultar, por lo que se va llenando conforme se asignan docentes, cursos y ambientes.

Lo que falta para una garantía completa:

- Orquestación automática de fases: nombrados -> estudios generales -> contratados.
- Confirmar todas las asignaciones reales de docentes EG, contratados y ambientes.
- Mejorar el criterio pedagógico de partición de bloques si se requieren patrones institucionales específicos.

## Dictamen

Con docentes EG y contratados suficientes, **sí se puede cubrir la matriz de cursos/asignaciones** siguiendo la lógica actual.

El sistema ya puede generar una propuesta sin solapes directos de docente, ambiente y ciclo/sub-turno. A nivel académico, la parte diurna y nocturna son viables con la cena de 15 minutos y el turno noche `17:15-22:30`.

Para que sea viable operativamente, deben completarse las asignaciones reales de docentes, ambientes y sub-turnos.

## Recomendación

Mantener `CENA` en `17:00-17:15` y `NOCHE` en `17:15-22:30` permite cubrir IX y X y ubicar cursos de 6 horas académicas en un solo día de noche.

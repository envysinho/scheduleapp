# Plan: Asignación de cursos con turno y validación por ciclo

## Objetivo
1. En **Spaces** (`SpaceForm.jsx` / `AssignmentRow`): al asignar un curso a un ambiente, además del curso se debe seleccionar el **turno**.
2. En **Teachers** (`TeacherForm.jsx` / `AssignmentRow`): el selector de curso debe ser un **combobox editable tipo searchbox** (filtrado al escribir) igual al que ya existe en Spaces, y la selección de turno debe respetar la regla por ciclo.
3. Validación (frontend + backend) de la regla:
   - Ciclos **I–VIII (1–8)**: solo turnos **MAÑANA** o **TARDE**.
   - Ciclos **IX–X (9–10)**: solo turno **NOCHE**.

## Estado actual

### Backend
- `TeacherShift` (enum): `MANANA`, `TARDE`, `NOCHE`.
- `CourseCycleRules.isNightOnlyCycle(Integer)`: `true` para 9 y 10.
- `CourseTeacherAssignment` tiene `course` + `shift` (`TeacherShift`).
- `CourseTeacherAssignmentRequest`: `courseId` + `shift` (validado `@NotNull`).
- `SpaceAssignment` **NO** tiene turno: solo `courseName`, `cycle`, `space`.
- `SpaceAssignmentRequest`: `courseName`, `cycle` (nullable ya).
- `TeacherService.validateAssignments`: rechaza ciclo nocturno con `shift != NOCHE`. **No** rechaza ciclo 1–8 con `shift == NOCHE`.
- `SpaceService.toAssignment`: no setea turno (no existe campo).

### Frontend
- `constants.js`:
  - `TEACHER_SHIFTS = [MANANA, TARDE, NOCHE]`.
  - `isNightOnlyCycle(cycleId)`.
  - `getTeacherShiftLabel`.
- `TeacherForm.jsx` (`AssignmentRow`):
  - Combobox de curso `readOnly` con todos los cursos + "Sin asignar" (NO es searchbox editable).
  - Filtrado de turnos: si `cycleNightOnly` → solo `NOCHE`; si no → **los 3** (MAÑANA, TARDE, NOCHE). ❌ Falta restringir 1–8 a MAÑANA/TARDE.
  - `canRemove = length > 1` (no permite vaciar).
- `SpaceForm.jsx` (`AssignmentRow`):
  - Selector de curso: `CourseSearchInput` (searchbox editable). ✓
  - Selector de ciclo: combobox con "Sin asignar". ✓
  - **No** tiene selector de turno.
  - Ya permite lista vacía de assignments.

## Cambios planificados

### 1) Backend

#### 1.1) Extender `CourseCycleRules`
Archivo: `backend/src/main/java/com/example/schedule/model/CourseCycleRules.java`
- Añadir constante `DAY_ONLY_CYCLES = Set.of(1..8)` o, mejor, un helper:
  - `public static boolean isDayOnlyCycle(Integer cycle)` → `true` para 1–8.
- Mantener `isNightOnlyCycle` para 9–10.
- (Opcional) `allowedShiftsForCycle(Integer cycle)` que devuelva `List<TeacherShift>` según la regla — reutilizable por las dos validaciones.

#### 1.2) Espacio: añadir campo `shift` a `SpaceAssignment`
Archivo: `backend/src/main/java/com/example/schedule/entity/SpaceAssignment.java`
- Nuevo campo:
  ```java
  @Enumerated(EnumType.STRING)
  @Column(name = "shift")
  private TeacherShift shift;
  ```
- Nullable por ahora (para no romper datos existentes).
- Getter/setter.

> Hibernate `ddl-auto=update` añadirá la columna automáticamente (no hace Flyway/Liquibase).

#### 1.3) DTO de Space
- `SpaceAssignmentRequest`: añadir `TeacherShift shift` (sin `@NotNull` para permitir nulo; si se quiere obligatorio, `@NotNull`). Decisión: **nullable** para no romper migración.
- `SpaceAssignmentResponse`: añadir `TeacherShift shift`.
- `SpaceService.toAssignment`: `assignment.setShift(request.shift())`.

#### 1.4) Validación en backend

**Teachers** (`TeacherService.validateAssignments`):
- Ampliar el bloque del `for` que recorre assignments. además de la validación nocturna existente, añadir:
  ```java
  if (!isNightOnlyCycle(course.getCycle()) && req.shift() == TeacherShift.NOCHE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "El curso " + course.getCode() + " es de ciclo diurno (I–VIII), solo turnos MAÑANA o TARDE");
  }
  ```
- Reutilizar `CourseCycleRules`.

**Spaces** (`SpaceService.create` / `update` o un nuevo `validateAssignments`):
- Recorrer `request.assignments()` y para cada assignment con `shift` no nulo:
  - Si `isNightOnlyCycle(cycle)` y `shift != NOCHE` → 400.
  - Si `isDayOnlyCycle(cycle)` (1–8) y `shift == NOCHE` → 400.
  - Si `cycle` es null → permitir cualquier shift (o ninguno).
- Como `SpaceAssignmentRequest.cycle` puede ser null, solo validar cuando `cycle != null`.

### 2) Frontend

#### 2.1) `constants.js`
- Añadir helper `isDayOnlyCycle(cycleId)` (1–8).
- Añadir `allowedShiftsForCycle(cycleId)` → array de valores permitidos (reutilizable por Teachers y Spaces).

#### 2.2) `TeacherForm.jsx` — searchbox de curso
- Reemplazar el `Combobox` readOnly del `AssignmentRow` por `CourseSearchInput` (mismo componente de Spaces) — pero adaptado:
  - En Teachers el valor es `courseId` (no `courseName`). Hay dos opciones:
    - **(A)** Generalizar `CourseSearchInput` para aceptar `value` como `courseId` y notificar `onChange(course)` en vez de solo el nombre.
    - **(B)** Crear un componente paralelo `CourseSearchInputById` específico para Teachers.
  - **Decisión recomendada: (A)** — refactor `CourseSearchInput` para Trabaje con ID + callback `onSelect(course)`. Spaces lo adapta para quedarse con `course.name`; Teachers con `course.id`.
- Migrar `AssignmentRow`:
  - `courseId` se setea al seleccionar un curso del searchbox.
  - Mantener opción "Sin asignar" como acción/limpiar (botón "x" o entrada especial).
  - Mostrar `code · name` como etiqueta principal y `cycle` como secundaria.
- Submit: ya filtra `courseId` truthy.

#### 2.3) `TeacherForm.jsx` — regla de turnos
- En `AssignmentRow`, al filtrar `TEACHER_SHIFTS`, usar `allowedShiftsForCycle(selectedCourse.cycle)`:
  - 1–8 → `["MANANA","TARDE"]`
  - 9–10 → `["NOCHE"]`
  - null/sin curso → los 3 (preview).
- Si el turno seleccionado deja de estar permitido al cambiar de curso, resetear `shift` al primero permitido (en `handleAssignmentChange`/`onSelect`).

#### 2.4) `SpaceForm.jsx` — selector de turno
- En `AssignmentRow` añadir una columna/bloque "Turno" debajo del Ciclo (o al lado):
  - Botones estilo `.flex.flex-wrap.gap-1` (igual que Teachers).
  - Filtrar `TEACHER_SHIFTS` por `allowedShiftsForCycle(assignment.cycle ?? selectedCourse?.cycle)`.
  - Si `cycle` es null o "Sin asignar" → permitir los 3 (o ninguno seleccionable).
- Estado: `assignment.shift` (default `null`).
- Si al cambiar el ciclo el turno actual queda fuera de los permitidos → resetear a `null` o al primero permitido.
- En `handleSubmit` añadir `shift: assignment.shift ?? null` al payload.
- `spaceToForm`: `shift: assignment.shift ?? null`.

### 3) Build / verificación
- Backend: `mvn compile` (en `backend/`). No ejecutar tests sin permiso.
- Frontend: `pnpm build` (en `frontend/`).
- Pruebas manuales sugeridas:
  - Space: crear con curso ciclo 5 + turno NOCHE → debe rechazarse.
  - Space: curso ciclo 9 + turno MAÑANA → debe rechazarse.
  - Teacher: searchbox filtra al escribir ≥1 char; seleccionar curso ciclo 3 → solo Mañana/Tarde; seleccionar ciclo 9 → solo Noche.

## Decisiones confirmadas
1. **`shift` en SpaceAssignment**: **nullable** (permite null/legacy y respeta "Sin asignar").
2. **`CourseSearchInput`**: **unificado** — un componente que trabaja con el objeto `Course` y notifica vía callback; Spaces y Teachers lo adaptan a `name`/`id` respectivamente.
3. En Spaces, selector de turno **siempre visible**; si ciclo es null permite los 3 turnos.
4. Reset de turno inválido: **al primero permitido** (sin fricción).

## Detalle de implementación por componente

### CourseSearchInput unificado (nueva API)
- Props:
  - `value: Course | null` (objeto completo; null = sin selección)
  - `onSelect: (course: Course | null) => void`
  - `disabled: boolean`
  - `courses: Course[]` (lista cacheada)
  - `placeholder?: string`
  - `getId?: (course) => string | number` (default: `course.id`)
  - `getLabel?: (course) => string` (default: `course.name`; en Teachers podría ser `code · name`)
  - `getSecondary?: (course) => string` (default: `course.code`)
- Internamente mantiene `query` sincronizado con `value?.id`.
- Si `onSelect(null)` → limpia (botón "x" o entrada "Sin asignar").

### Spaces.jsx — adaptación
- `AssignmentRow`:
  - `courseName` se deriva de `selectedCourse?.name` (se guarda `courseName` en el form para no romper el payload, pero la selección pasa por `CourseSearchInput` con `value={selectedCourse}`).
  - Si hoy se guardaba `courseName` como String libre, se mantiene para compatibilidad retroactiva: al `onSelect(course)` setea `courseName: course.name` (igual que antes).
  - Añade `shift: TeacherShift | null` al assignment.
  - Selector de turno con `TEACHER_SHIFTS.filter((s) => allowedShiftsForCycle(assignment.cycle)?.includes(s.value))`; si ciclo null → los 3.
  - Reset de turno al cambiar ciclo/curso si queda inválido.

### Teachers.jsx — adaptación
- `AssignmentRow`:
  - Reemplaza el `Combobox` readOnly por `CourseSearchInput` unificado con `getLabel = c => `${c.code} · ${c.name}``.
  - `onSelect(course)` → `onChange(index, "courseId", course?.id ?? null)` + reset de `shift` si queda inválido.
  - Mantener opción "Sin asignar": `CourseSearchInput` con `value=null` muestra placeholder; se puede añadir botón "x" para deseleleccionar.
  - Filtrado de turnos ya existe; solo cambiar la condición `return true` por `allowedShiftsForCycle(selectedCourse.cycle)?.includes(item.value)`.

### constants.js — helpers
```js
export function isDayOnlyCycle(cycleId) {
  return Number.isInteger(cycleId) && cycleId >= 1 && cycleId <= 8;
}

export function allowedShiftsForCycle(cycleId) {
  if (cycleId == null) return ["MANANA", "TARDE", "NOCHE"];
  if (isNightOnlyCycle(cycleId)) return ["NOCHE"];
  if (isDayOnlyCycle(cycleId)) return ["MANANA", "TARDE"];
  return ["MANANA", "TARDE", "NOCHE"]; // fallback
}
```

### Backend — archivos a tocar
1. `CourseCycleRules.java`: añadir `isDayOnlyCycle` y opcional `allowedShiftsForCycle`.
2. `SpaceAssignment.java`: añadir `shift` (nullable, `@Enumerated(STRING)`).
3. `SpaceAssignmentRequest.java`: añadir `TeacherShift shift` (sin `@NotNull`).
4. `SpaceAssignmentResponse.java`: añadir `TeacherShift shift`.
5. `SpaceService.toAssignment`: `setShift(request.shift())`; nueva validación en `create`/`update` (método `validateAssignments`):
   - Recorrer assignments; para cada uno con `cycle != null` y `shift != null`:
     - `isNightOnlyCycle(cycle) && shift != NOCHE` → 400.
     - `isDayOnlyCycle(cycle) && shift == NOCHE` → 400.
6. `TeacherService.validateAssignments`: añadir la rama diurna (1–8) que rechace `NOCHE`.

## Orden de implementación sugerido
1. Backend: reglas + entidad + DTO + validaciones.
2. Frontend: `constants.js` helpers.
3. Frontend: refactor `CourseSearchInput` unificado + adaptar `Spaces.jsx`.
4. Frontend: adaptar `Teachers.jsx` a `CourseSearchInput` + nueva regla de turnos.
5. Builds: `mvn compile` + `pnpm build`.
6. Pruebas manuales sugeridas en el MD.

## Pruebas manuales sugeridas
- Spaces: crea/Editar con curso ciclo 5 + turno NOCHE →Debe rechazarse.
- Spaces: curso ciclo 9 + turno MAÑANA →Debe rechazarse.
- Spaces: ciclo "Sin asignar" + cualquier turno → Aceptado.
- Teachers: searchbox filtra al escribir; selecionar curso ciclo 3 → solo Mañana/Tarde.
- Teachers: selecionar curso ciclo 9 → solo Noche.
- Teachers: cambiar de ciclo 3 a ciclo 9 → resetea shift a NOCHE.
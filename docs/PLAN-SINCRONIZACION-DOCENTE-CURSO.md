# Plan de implementación — Sincronización docente↔curso

Objetivo: al añadir un curso a un docente en `Teachers.jsx`, la card del curso en `Courses.jsx` muestra al docente con su turno. De forma recíproca, al añadir un docente a un curso en `Courses.jsx`, la card del docente en `Teachers.jsx` muestra el curso con su turno.

## Estado actual

- Backend: `CourseTeacherAssignment(teacher, course, shift)` es la fuente de verdad. Al guardar docente o curso, `Course.deriveShiftTeachers()` recalcula `morning/afternoon/nightTeacher`. La BD ya queda sincronizada.
- Frontend: al volver del formulario (`closeForm` → `pageView="list"`), `useEffect` dispara `loadTeachers`/`loadCourses`. **Solo se refresca la página actual, no la otra.**
- Problema: si añades un curso a un docente y luego abres `Courses.jsx` sin recargar la app, la card del curso **no** muestra al docente hasta que navegues y fuerces un reload.

## Cambios necesarios

### Frontend

1. **`Teachers.jsx`**
   - En `handleFormSubmit`, tras `await createTeacher`/`updateTeacher`, **no solo** refrescar `teachers`. También invalidar la caché de cursos (ver paso 3).
   - En `useEffect` de mount, escuchar un evento `teachers-updated` que dispare `loadCourses` en `Courses.jsx`.

2. **`Courses.jsx`**
   - En `handleFormSubmit`, tras `await createCourse`/`updateCourse`, **no solo** refrescar `courses`. También invalidar la caché de docentes.
   - En `useEffect` de mount, escuchar un evento `courses-updated` que dispare `loadTeachers` en `Teachers.jsx`.

3. **Comunicación entre páginas (sin contexto global nuevo)**
   - Opción A (recomendada): `window.dispatchEvent(new CustomEvent("courses-updated"))` al guardar curso, y `window.dispatchEvent(new CustomEvent("teachers-updated"))` al guardar docente. Cada página escucha el evento que le interesa en un `useEffect`.
   - Opción B: crear un `StoreContext` con un contador `dataVersion` que se incrementa al guardar; las páginas lo consumen y refrescan en su `useEffect`.
   - Opción A es más simple y suficiente para dos páginas.

4. **`TeacherCard.jsx`**
   - Ya muestra `courseAssignments` con `assignment.shift`. Verificar que la data que llega desde el backend incluye `courseCode`, `courseName`, `cycle`, `shift`. **No requiere cambios.**

5. **`CourseCard.jsx`**
   - Ya muestra `morningTeacher`, `afternoonTeacher`, `nightTeacher` con su turno. **No requiere cambios.**

### Backend

- **No requiere cambios.** La sincronización en BD ya funciona.

## Pasos de implementación

1. En `Teachers.jsx`:
   - Añadir `useEffect` que escuche `window.addEventListener("courses-updated", loadTeachers)`.
   - En `handleFormSubmit`, tras guardar, hacer `window.dispatchEvent(new CustomEvent("teachers-updated"))`.

2. En `Courses.jsx`:
   - Añadir `useEffect` que escuche `window.addEventListener("teachers-updated", loadCourses)`.
   - En `handleFormSubmit`, tras guardar, hacer `window.dispatchEvent(new CustomEvent("courses-updated"))`.

3. Verificar que `loadTeachers` y `loadCourses` estén memoizados con `useCallback` y dependencias estables para evitar loops.

4. Pruebas manuales:
   - Crear un docente con curso X en MAÑANA → abrir `Courses.jsx` → la card de X muestra al docente en MAÑANA sin recargar.
   - Editar un curso Y asignando docente Z en TARDE → abrir `Teachers.jsx` → la card de Z muestra el curso Y en TARDE sin recargar.

## Casos límite

- Si el usuario tiene `Courses.jsx` abierta en otra pestaña/ventana de Electron, el evento `window` no cruza. Para multi-ventana se necesitaría `localStorage` events o websockets. **Fuera de alcance** de este plan.
- Si se guarda un docente y se navega a `Courses.jsx` antes de que termine el `dispatchEvent`, la carga normal al montar la página ya trae los datos actualizados. El evento es solo refresco sobre la marcha.

## Referencias

- `frontend/src/pages/Teachers.jsx` — página docentes
- `frontend/src/pages/Courses.jsx` — página cursos
- `frontend/src/components/teachers/TeacherCard.jsx` — card docente (ya muestra `courseAssignments`)
- `frontend/src/components/courses/CourseCard.jsx` — card curso (ya muestra `morningTeacher/afternoonTeacher/nightTeacher`)
- `backend/.../service/TeacherService.java` — `validateAssignments` + `CourseTeacherAssignment`
- `backend/.../entity/Course.java` — `deriveShiftTeachers()`
- [`docs/CONDICIONES-DOCENTES.md`](CONDICIONES-DOCENTES.md) — regla Opción A/B (mismo curso en mañana y tarde = válido)

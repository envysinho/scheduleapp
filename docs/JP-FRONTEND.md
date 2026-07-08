# Plan: Jefes de Practica persistentes

## Resumen
Implementar la gestion de jefes de practica replicando el estilo de `frontend/src/pages/Teachers.jsx`, pero con persistencia real en base de datos.

Los JP deben poder crearse, editarse, listarse y eliminarse igual que docentes, espacios y cursos. Sus asignaciones a laboratorios tambien deben quedar persistidas.

## Backend

### Entidades y persistencia
- Crear entidad `PracticeHead` con:
  - `id`;
  - `firstName`;
  - `lastName`;
  - `email`;
  - `phone`;
  - `labAssignments`;
  - `createdAt`;
  - `updatedAt`.
- Crear entidad `PracticeHeadLabAssignment` con:
  - `id`;
  - relacion `ManyToOne` hacia `PracticeHead`;
  - relacion `ManyToOne` hacia `Space`;
  - `createdAt`.
- Usar tablas:
  - `practice_heads`;
  - `practice_head_lab_assignments`.
- Configurar la relacion en `PracticeHead` con `cascade = CascadeType.ALL` y `orphanRemoval = true`, igual que las asignaciones de docentes.
- Agregar metodo `replaceLabAssignments(...)` para reemplazar asignaciones al editar.

### Repositorios
- Crear `PracticeHeadRepository extends JpaRepository<PracticeHead, Long>`.
- Ordenar listados por `lastName ASC, firstName ASC`.
- Usar `SpaceRepository` para validar laboratorios asignados.

### DTOs
Crear DTOs equivalentes al flujo de docentes:
- `CreatePracticeHeadRequest`;
- `UpdatePracticeHeadRequest`;
- `PracticeHeadResponse`;
- `PracticeHeadLabAssignmentRequest`;
- `PracticeHeadLabAssignmentResponse`.

Validaciones:
- `firstName`: requerido, maximo 100.
- `lastName`: requerido, maximo 100.
- `email`: opcional, maximo 150.
- `phone`: opcional, maximo 30.
- `labAssignments`: lista opcional, pero cada item valido debe tener `spaceId`.

### Servicio
- Crear `PracticeHeadService`.
- `findAll()` devuelve todos los JP con sus laboratorios.
- `findById(id)` devuelve 404 si no existe.
- `create(request)` valida laboratorios, guarda JP y asignaciones.
- `update(id, request)` reemplaza datos y asignaciones persistidas.
- `delete(id)` elimina JP y sus asignaciones.
- Validar que cada `spaceId` exista y tenga `spaceType == LABORATORIO`.
- Evitar asignaciones duplicadas al mismo laboratorio dentro del mismo JP.

### Controller y seguridad
- Crear `PracticeHeadController` con base path `/api/practice-heads`.
- Endpoints:
  - `GET /api/practice-heads`;
  - `GET /api/practice-heads/{id}`;
  - `POST /api/practice-heads`;
  - `PUT /api/practice-heads/{id}`;
  - `DELETE /api/practice-heads/{id}`.
- Actualizar `SecurityConfig`:
  - `GET /api/practice-heads/**` requiere usuario autenticado;
  - los demas metodos requieren `ADMIN`.

## Contrato de datos

Payload para crear o editar:

```js
{
  firstName: string,
  lastName: string,
  email: string | null,
  phone: string | null,
  labAssignments: [
    { spaceId: number }
  ]
}
```

Respuesta esperada:

```js
{
  id: number,
  firstName: string,
  lastName: string,
  fullName: string,
  email: string | null,
  phone: string | null,
  labAssignments: [
    {
      id: number,
      spaceId: number,
      spaceName: string
    }
  ]
}
```

## Frontend

### API
Agregar en `frontend/src/lib/api.js`:
- `listPracticeHeads(onUnauthorized)`;
- `getPracticeHead(id, onUnauthorized)`;
- `createPracticeHead(data, onUnauthorized)`;
- `updatePracticeHead(id, data, onUnauthorized)`;
- `deletePracticeHead(id, onUnauthorized)`.

### Pagina
- Implementar `frontend/src/pages/PracticeHeads.jsx` siguiendo el patron de `Teachers.jsx`.
- Usar `PageCard`.
- Mantener solo:
  - selector `grid/list`;
  - boton `Anadir personal`;
  - listado de cards.
- No incluir filtros de tipo de jefe, tipo de docente, ciclo, turno ni sub-turno.
- Mantener acciones de admin:
  - crear;
  - editar;
  - eliminar.

### Componentes
- Crear `PracticeHeadCard`, basado en `TeacherCard`.
- Crear `PracticeHeadForm`, basado en `TeacherForm`, simplificado.

La card debe mostrar:
- nombre completo;
- email;
- telefono;
- laboratorios asignados.

El formulario debe contener:
- nombre;
- apellido;
- email;
- telefono;
- laboratorios asignados.

La seccion de laboratorios debe ser repetible:
- boton `Anadir laboratorio`;
- selector de laboratorio por fila;
- boton para quitar fila.

Los laboratorios seleccionables deben obtenerse desde `listSpaces` y filtrarse en frontend por:

```js
space.spaceType === "LABORATORIO"
```

### Estados y mensajes
- Estado de carga: `Cargando jefes de practica...`
- Estado vacio: `No hay jefes de practica registrados.`
- Error de carga: `Error al cargar jefes de practica`
- Error de guardado: `Error al guardar jefe de practica`
- Confirmacion de eliminacion: `Eliminar a "{nombre}"? Esta accion no se puede deshacer.`

### Busqueda global
- Opcional: integrar JP en `GlobalSearch`.
- Si se integra, agregar grupo `Jefes de Practica` y mapearlo a `practiceHeads`.

## Pruebas

### Backend
- Crear JP con un laboratorio valido y confirmar persistencia.
- Crear JP con ambiente que no es laboratorio debe devolver error.
- Editar JP debe reemplazar asignaciones anteriores sin duplicados.
- Eliminar JP debe borrar tambien sus asignaciones.
- Usuario no admin no puede crear, editar ni eliminar.

### Frontend
- La pantalla muestra el titulo y boton `Anadir personal`.
- El selector cambia entre grid y list.
- Las cards muestran contacto y laboratorios asignados.
- El formulario permite crear y editar nombre, apellido, email y telefono.
- El formulario permite anadir y quitar multiples laboratorios.
- No aparece ningun filtro de tipo, ciclo, turno o sub-turno.

## Supuestos
- `frontend/src/pages/PracticeHeads.jsx` es la ruta real de la pantalla.
- Se usara `spring.jpa.hibernate.ddl-auto=update`, como en la configuracion actual.
- No se requiere migracion manual inicial.
- Las asignaciones de JP son solo a laboratorios existentes en `spaces`.
- No se agregan campos extra como tipo de jefe, ciclo, turno, disponibilidad o sub-turno.

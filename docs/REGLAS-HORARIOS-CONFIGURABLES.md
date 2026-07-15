# Reglas de horarios configurables — Schedule

Especificación de la pantalla **Reglas → Horarios del día** para administrar las franjas horarias del día académico EPIS.

Los valores por defecto están en [`TURNOS-HORARIOS.md`](TURNOS-HORARIOS.md). Los valores **activos** se persisten en PostgreSQL y se consultan vía `GET /api/schedule-settings`.

---

## Objetivo

Permitir al administrador ajustar, desde la app, las 6 franjas del día académico:

1. Desayuno  
2. Turno mañana (clases)  
3. Almuerzo  
4. Turno tarde (clases)  
5. Cena  
6. Turno noche (clases)

Estas franjas aplican **de lunes a viernes**. No hay clases ni bloques lectivos sábado ni domingo.

---

## Bloques y defaults

| Orden | Bloque | Código API | Inicio | Fin |
|-------|--------|------------|--------|-----|
| 1 | Desayuno | `DESAYUNO` | 06:30 | 08:00 |
| 2 | Turno mañana | `MANANA` | 08:00 | 12:30 |
| 3 | Almuerzo | `ALMUERZO` | 12:30 | 14:00 |
| 4 | Turno tarde | `TARDE` | 14:00 | 17:00 |
| 5 | Cena | `CENA` | 17:00 | 17:15 |
| 6 | Turno noche | `NOCHE` | 17:15 | 22:30 |

### Tipos de franja

- **Comidas:** `DESAYUNO`, `ALMUERZO`, `CENA` — pausas; no hay clases.
- **Turnos lectivos:** `MANANA`, `TARDE`, `NOCHE` — rango disponible para ubicar cursos en la grilla de horarios por ciclo.

---

## Reglas de validación

1. Debe existir exactamente **6 bloques**, con los IDs anteriores, en ese orden.
2. **Encadenamiento:** `fin(bloque N) = inicio(bloque N+1)` — sin huecos ni solapes.
3. **Duración mínima** por bloque: 15 minutos.
4. **Límites del día:** inicio del desayuno ≥ 05:00; fin del turno noche ≤ 23:59.
5. Formato de hora: `HH:mm` (24 h).

Al mover un límite entre dos bloques adyacentes, se actualizan ambos (fin del superior e inicio del inferior).

---

## Interfaz (Reglas)

Ruta en la app: sidebar **Reglas** → sección **Horarios del día** (solo rol `ADMIN` puede guardar).

### Timeline visual

- Grid con **5 columnas:** Lun, Mar, Mié, Jue, Vie.
- Eje vertical con marcas cada **30 minutos** desde el inicio del desayuno hasta el fin del turno noche (p. ej. 06:30, 07:00, 07:30, …, 22:30).
- **6 bandas coloreadas** repetidas en cada día; solo etiquetas de bloque, **sin cursos**.
- **Handles** arrastrables en los bordes internos entre bloques (snap cada 5 min).

### Campos numéricos

- Lista de los 6 bloques con inputs `type="time"` (inicio y fin).
- Sincronizados en tiempo real con el timeline.

### Acciones

- **Guardar** — `PUT /api/schedule-settings` (ADMIN).
- **Restaurar defaults** — repone valores EPIS y guarda.

---

## API REST

### `GET /api/schedule-settings`

Autenticado (cualquier rol).

```json
{
  "blocks": [
    { "id": "DESAYUNO", "label": "Desayuno", "start": "06:30", "end": "08:00" },
    { "id": "MANANA", "label": "Turno mañana", "start": "08:00", "end": "12:30" },
    { "id": "ALMUERZO", "label": "Almuerzo", "start": "12:30", "end": "14:00" },
    { "id": "TARDE", "label": "Turno tarde", "start": "14:00", "end": "17:00" },
    { "id": "CENA", "label": "Cena", "start": "17:00", "end": "17:15" },
    { "id": "NOCHE", "label": "Turno noche", "start": "17:15", "end": "22:30" }
  ],
  "weekdays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
}
```

### `PUT /api/schedule-settings`

Solo `ADMIN`. Mismo cuerpo que la respuesta (sin `weekdays` en el request; el servidor los devuelve fijos).

Errores de validación: HTTP 400 con `{ "message": "..." }`.

---

## Modelo de datos

Tabla `schedule_block_settings`:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `block_id` | VARCHAR (PK) | Enum: DESAYUNO, MANANA, … |
| `start_time` | TIME | Inicio |
| `end_time` | TIME | Fin |

Seed al arrancar la app si la tabla está vacía (valores de [`TURNOS-HORARIOS.md`](TURNOS-HORARIOS.md)).

---

## Uso futuro

La pantalla **Horarios** por ciclo consumirá estos rangos para:

- Delimitar el eje temporal de la grilla L–V.
- Restringir colocación de cursos a `MANANA`, `TARDE` y `NOCHE`.

---

## Referencias

- [`TURNOS-HORARIOS.md`](TURNOS-HORARIOS.md) — defaults oficiales EPIS  
- [`CONDICIONES-DOCENTES.md`](CONDICIONES-DOCENTES.md) — reglas de asignación de turnos  
- `frontend/src/pages/Rules.jsx` — pantalla de administración  
- `backend/.../ScheduleSettingsController.java` — API

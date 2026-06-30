# Economía de tokens

Guía para agentes y usuarios del proyecto `Schedule`. Objetivo: menos tokens en contexto, herramientas y respuestas.

## Contexto mínimo del repo

| Ruta | Qué es |
|------|--------|
| `backend/` | Spring Boot + Maven, Java en `src/main/java/com/example/schedule` |
| `frontend/` | React + Vite, código en `src/` |
| `desktop/` | Electron wrapper del frontend |

No releer ni resumir el proyecto entero si no hace falta.

---

## Reglas para el agente

### Respuestas
- Español siempre (salvo nombres de archivos/comandos).
- Breve y directo. Acción concreta → resultado, no tutorial.
- Solo archivos editados + fragmentos mínimos + resumen de 1–2 líneas.
- Sin código no solicitado ni repetir contexto ya dado.

### Herramientas (orden recomendado)
1. `grep` / búsqueda → localizar símbolo o archivo.
2. Leer solo el archivo o bloque necesario (no archivos enteros grandes).
3. Editar con patch/replace en bloques concretos, no reescribir archivos completos.

### Qué evitar
- Repetir estructura del proyecto en cada respuesta.
- Leer múltiples archivos “por si acaso”.
- Explicaciones largas cuando el usuario pidió un cambio puntual.
- `npm install`, `mvn`, builds o nuevas dependencias sin permiso explícito.
- Tocar código fuera del área pedida.

---

## Cómo pedir (usuario)

Formular peticiones pequeñas y acotadas ahorra más tokens que cualquier regla del agente.

| Mejor | Peor |
|-------|------|
| “En `TeacherCard.jsx`, quita el botón X” | “Revisa todo el frontend y mejóralo” |
| “Fix: el filtro en Teachers no filtra por nombre” | “Arregla los bugs” |
| “Solo el diff, sin explicación” | (sin acotar → respuesta larga por defecto) |

Incluir cuando aplique: archivo, comportamiento esperado vs actual, scope (“solo frontend”).

---

## Checklist rápido

- [ ] ¿Sé exactamente qué archivo tocar? Si no → buscar primero.
- [ ] ¿Puedo resolver con un patch pequeño? Si sí → no reescribir todo.
- [ ] ¿El usuario pidió explicación? Si no → mínimo texto.
- [ ] ¿Hace falta instalar/build? Si no lo pidió → no ejecutar.

---

## Relación con AGENTS.md

`AGENTS.md` en la raíz es la regla que Cursor carga automáticamente. Este doc amplía la sección de token savings; mantener `AGENTS.md` corto y remitir aquí para detalle.

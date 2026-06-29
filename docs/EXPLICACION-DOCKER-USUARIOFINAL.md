# Explicación: fase final sin Docker (usuario final)

Guía para entender cómo levantar y usar el proyecto **Schedule** en la fase final, **sin Docker** en las PCs de los usuarios.

---

## Visión general

En la **fase final** (producción), varios usuarios usan la app de escritorio (Electron) conectados a **un servidor central** con el backend Java y PostgreSQL.

Docker **no va en cada PC de usuario**. En desarrollo, Docker solo servía para levantar PostgreSQL de forma cómoda en tu máquina. En producción, PostgreSQL y el backend viven en **un servidor**; las PCs de los usuarios solo tienen el cliente Electron.

```text
[PC usuario A — Electron] ──┐
                            ├──► [Servidor: Spring Boot + PostgreSQL nativo]
[PC usuario B — Electron] ──┘
```

---

## Requisitos previos

| Rol | Herramientas |
|-----|--------------|
| **Servidor** | Java 21, Maven, PostgreSQL 16 (instalado en el sistema) |
| **PC de cada usuario** | Solo la app empaquetada (Electron); no necesitan Java, Maven ni PostgreSQL |
| **Quien construye la app** | Node.js + pnpm (para compilar frontend y desktop) |

---

## Parte 1: Servidor central (sin Docker)

### 1. Instalar PostgreSQL nativo

Instalar PostgreSQL 16 desde los paquetes del sistema o desde [postgresql.org](https://www.postgresql.org/download/).

Crear base de datos y usuario equivalentes a los del `docker-compose.yml`:

```sql
CREATE USER schedule WITH PASSWORD 'tu_contraseña_segura';
CREATE DATABASE schedule_db OWNER schedule;
```

Por defecto PostgreSQL escucha en el puerto **5432** (no 5433 como en Docker). Eso es correcto en producción; hay que reflejarlo en la URL de conexión.

### 2. Compilar y desplegar el backend

En la máquina servidor (o en tu PC y luego copiar el JAR):

```bash
cd backend
mvn clean package -DskipTests
```

Eso genera un JAR ejecutable en `backend/target/`. Arrancarlo con variables de entorno:

```bash
export DB_URL="jdbc:postgresql://localhost:5432/schedule_db"
export DB_USER="schedule"
export DB_PASSWORD="tu_contraseña_segura"
export JWT_SECRET="un-secreto-largo-de-al-menos-256-bits"

java -jar target/schedule-backend-0.0.1-SNAPSHOT.jar
```

El backend queda en **`http://localhost:8081`** (puerto definido en `application.properties`).

Para que arranque solo al encender el servidor, lo habitual es un servicio **systemd** que ejecute ese JAR con esas variables. Eso aún no está documentado en el repo; es uno de los pasos pendientes de la fase 2.

### 3. Exponer la API (opcional pero recomendable)

Si los clientes están en otra máquina de la red o en internet:

- Abrir el puerto **8081** en el firewall del servidor, **o**
- Poner un reverse proxy (**nginx** o **Caddy**) con HTTPS delante del backend.

Ejemplo de URL final para los clientes: `https://horarios.institucion.edu/api`.

### 4. Seguridad post-instalación

- Cambiar la contraseña del admin por defecto (`admin` / `admin123`).
- Usar un `JWT_SECRET` distinto al de desarrollo.
- Configurar backups periódicos de PostgreSQL.

---

## Parte 2: App de escritorio en cada PC (sin Docker)

Los usuarios finales **no levantan** backend ni base de datos. Solo instalan y abren Electron.

### 1. Construir el frontend apuntando al servidor

Antes de empaquetar, el frontend debe saber dónde está la API. En `frontend/src/lib/api.js` y `auth.js` se usa:

```javascript
import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8081"
```

Al compilar para producción:

```bash
cd frontend
pnpm install
VITE_API_BASE_URL=https://horarios.institucion.edu pnpm build
```

Eso genera `frontend/dist/` con la UI estática ya configurada para el servidor real.

### 2. Empaquetar Electron

Hoy `desktop/main.js` carga por defecto `http://127.0.0.1:5173` (modo desarrollo). Para la fase final hay que ajustar Electron para que cargue `frontend/dist/index.html` en lugar del servidor de Vite.

Flujo típico de construcción:

```bash
cd desktop
pnpm install
pnpm start   # en desarrollo; en producción sería un instalador .deb/.AppImage/.exe
```

La parte de generar instaladores (electron-builder, etc.) tampoco está terminada en el repo; es trabajo pendiente de la fase 2.

### 3. Uso diario del usuario final

1. Instalar la app de escritorio.
2. Abrirla.
3. Iniciar sesión contra el servidor central (no contra `localhost`).
4. Gestionar usuarios, horarios, etc. — los datos viven en PostgreSQL del servidor.

---

## Modo local en una sola PC (sin Docker)

No es el escenario de producción, pero es viable para pruebas o demo:

1. **PostgreSQL nativo** en el PC (puerto 5432 o 5433).
2. Crear `schedule_db` y usuario `schedule`.
3. Ajustar `DB_URL` si el puerto no es 5433:

   ```bash
   export DB_URL="jdbc:postgresql://localhost:5432/schedule_db"
   ```

4. **Backend:** `cd backend && mvn spring-boot:run`
5. **Frontend:** `cd frontend && pnpm install && pnpm dev` → `http://localhost:5173`
6. **Desktop (opcional):** `cd desktop && pnpm install && pnpm start`

Login inicial: `admin` / `admin123`.

---

## Comparativa rápida

| Componente | Con Docker (desarrollo) | Fase final sin Docker |
|------------|-------------------------|------------------------|
| PostgreSQL | `docker compose up -d` en puerto 5433 | Instalado nativo en el servidor (puerto 5432) |
| Backend | `mvn spring-boot:run` en tu PC | JAR en el servidor con variables de entorno |
| Frontend | `pnpm dev` (Vite en :5173) | `pnpm build` con `VITE_API_BASE_URL` del servidor |
| Desktop | Carga Vite local | Carga `frontend/dist` empaquetado |
| Usuario final | Levanta todo manualmente | Solo abre la app instalada |

---

## Qué hace Docker en desarrollo (referencia)

Docker **no ejecuta la aplicación completa**. Solo corre **PostgreSQL** en tu PC de forma aislada:

| Parámetro | Valor (desarrollo con Docker) |
|-----------|-------------------------------|
| Host | `localhost` |
| Puerto | **5433** |
| Base de datos | `schedule_db` |
| Usuario | `schedule` |
| Contraseña | `schedule` |

Ver [`GUIA-DOCKER.md`](./GUIA-DOCKER.md) para el flujo de desarrollo con Docker.

---

## Documentación relacionada

- [`README.md`](../README.md) — arranque en desarrollo
- [`GUIA-DOCKER.md`](./GUIA-DOCKER.md) — PostgreSQL con Docker Compose
- [`USUARIOS-Y-PERSISTENCIA.md`](./USUARIOS-Y-PERSISTENCIA.md) — arquitectura, API y despliegue

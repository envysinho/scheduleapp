# Schedule Desktop App

Aplicación de escritorio con backend Java Spring Boot, frontend React + Vite y empaquetado con Electron.

## Estructura

- `backend/` - Spring Boot + Maven
- `frontend/` - React + Vite
- `desktop/` - Electron wrapper
- `docker-compose.yml` - PostgreSQL local para desarrollo

## Cómo arrancar

0. En la raíz del proyecto, levantar la base de datos:
   ```bash
   docker compose up -d
   ```
   PostgreSQL queda en `localhost:5433` (puerto 5433 en el host). Comprobar con `docker compose ps`.

1. Abrir una terminal en `backend/` y ejecutar:
   ```bash
   mvn spring-boot:run
   ```
   El backend correrá en `http://localhost:8081`.

   > Si falla con "Port 8081 was already in use", ya hay un backend corriendo. Detén el proceso anterior (`Ctrl+C` en su terminal o `kill <PID>`).

2. Abrir otra terminal en `frontend/` y ejecutar:
   ```bash
   pnpm install
   pnpm dev
   ```

3. Abrir otra terminal en `desktop/` y ejecutar:
   ```bash
   pnpm install
   pnpm start
   ```

## Añadir usuarios (desde la app)

No hace falta abrir PostgreSQL a mano. Los usuarios se gestionan desde la interfaz:

1. Asegúrate de tener Docker, backend y frontend en marcha (pasos anteriores).
2. Al abrir la app verás la pantalla de **Iniciar sesión**.
3. Entra con el admin inicial: `admin` / `admin123`.
4. En el sidebar, entra a **Usuarios** (solo visible para rol ADMIN).
5. Usa el formulario lateral para **crear** un usuario (nombre, contraseña, rol USER o ADMIN).
6. Desde la tabla puedes **editar** (lápiz) o **desactivar** (papelera) cuentas existentes.

Los datos se guardan en PostgreSQL vía el backend; las contraseñas van hasheadas en la base de datos.

## Documentación adicional

- [`docs/GUIA-DOCKER.md`](docs/GUIA-DOCKER.md) — clonar el repo, instalar Docker y levantar PostgreSQL con Compose
- [`docs/USUARIOS-Y-PERSISTENCIA.md`](docs/USUARIOS-Y-PERSISTENCIA.md) — arquitectura, API y despliegue futuro

> Para producción, primero construye el frontend con `pnpm build` y luego ajusta Electron para cargar `frontend/dist/index.html`.

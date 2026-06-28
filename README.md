# Schedule Desktop App

Aplicación de escritorio con backend Java Spring Boot, frontend React + Vite y empaquetado con Electron.

## Estructura

- `backend/` - Spring Boot + Maven
- `frontend/` - React + Vite
- `desktop/` - Electron wrapper

## Cómo arrancar

1. Abrir una terminal en `backend/` y ejecutar:
   ```bash
   mvn spring-boot:run
   ```
   El backend correrá en `http://localhost:8081`.

2. Abrir otra terminal en `frontend/` y ejecutar:
   ```bash
   npm install
   npm run dev
   ```

3. Abrir otra terminal en `desktop/` y ejecutar:
   ```bash
   npm install
   npm start
   ```

> Para producción, primero construye el frontend con `npm run build` y luego ajusta Electron para cargar `frontend/dist/index.html`.

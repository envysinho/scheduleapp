# Documentacion detallada del proyecto Schedule

## 1. Resumen general

`Schedule` es una aplicacion para gestionar programacion academica de la Escuela Profesional de Ingenieria de Sistemas. El sistema integra una API backend, una interfaz web y un contenedor de escritorio.

La arquitectura principal esta dividida en tres partes:

| Carpeta | Tecnologia | Funcion |
|---|---|---|
| `backend/` | Java 21, Spring Boot, Maven | API REST, seguridad, reglas de negocio y persistencia |
| `frontend/` | React, Vite, Tailwind CSS | Interfaz de usuario para administrar docentes, cursos, ambientes, usuarios, reglas y horarios |
| `desktop/` | Electron | Envoltorio de escritorio que carga la interfaz frontend |

La base de datos usada en desarrollo es PostgreSQL 16 levantada con Docker Compose.

---

## 2. Objetivo funcional del sistema

El objetivo de `Schedule` es facilitar la organizacion academica mediante:

- Gestion de usuarios con login real y roles.
- Gestion de docentes.
- Gestion de cursos del plan de estudios.
- Gestion de ambientes o espacios.
- Gestion de jefes de practica.
- Asignacion de docentes a cursos por turno.
- Asignacion de cursos a ambientes.
- Configuracion de franjas horarias del dia academico.
- Generacion de propuestas de horario por ciclo.
- Validacion de reglas academicas para evitar asignaciones incompatibles.
- Persistencia de datos en PostgreSQL.

El sistema no es solo una maqueta visual. El backend guarda datos reales, aplica validaciones y expone endpoints REST protegidos por JWT.

---

## 3. Estructura del repositorio

```text
Schedule/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/example/schedule/
├── frontend/
│   ├── package.json
│   └── src/
├── desktop/
│   ├── package.json
│   └── main.js
├── docs/
├── docker-compose.yml
├── README.md
└── AGENTS.md
```

### 3.1. `backend/`

Contiene la aplicacion Spring Boot. Sus responsabilidades principales son:

- Exponer la API REST.
- Gestionar autenticacion y autorizacion.
- Validar reglas de negocio.
- Persistir entidades con JPA.
- Conectarse a PostgreSQL.
- Inicializar datos base.
- Calcular propuestas de horario.

Paquetes principales:

| Paquete | Uso |
|---|---|
| `config` | Configuracion general, seguridad, seed de datos y manejo global de errores |
| `controller` | Endpoints REST |
| `dto` | Objetos de entrada y salida de la API |
| `entity` | Entidades JPA persistidas en BD |
| `model` | Enums y reglas de dominio |
| `repository` | Repositorios Spring Data JPA |
| `security` | JWT, filtros y usuario autenticado |
| `service` | Logica de negocio |

### 3.2. `frontend/`

Contiene la aplicacion React. Sus responsabilidades principales son:

- Renderizar la interfaz de administracion.
- Consumir la API REST.
- Guardar sesion/token en el navegador.
- Mostrar vistas de cursos, docentes, ambientes, horarios, usuarios y reglas.
- Aplicar validaciones de interfaz antes de enviar datos.

Archivos y carpetas importantes:

| Ruta | Uso |
|---|---|
| `src/App.jsx` | Composicion principal de rutas/vistas |
| `src/components/` | Componentes compartidos |
| `src/contexts/` | Contextos globales de autenticacion y semestre |
| `src/lib/api.js` | Cliente HTTP contra el backend |
| `src/lib/auth.js` | Manejo de sesion local |
| `src/lib/constants.js` | Constantes de dominio |
| `src/pages/` | Pantallas principales |
| `src/styles/` | Estilos globales y por modulo |

### 3.3. `desktop/`

Contiene el wrapper Electron. Su funcion es abrir la aplicacion frontend como app de escritorio.

No reemplaza al backend ni a la base de datos. Para que la aplicacion desktop funcione correctamente en desarrollo, normalmente deben estar levantados:

1. PostgreSQL con Docker.
2. Backend Spring Boot.
3. Frontend Vite.
4. Electron.

### 3.4. `docs/`

Contiene documentacion tecnica y funcional del proyecto. Algunos documentos clave:

| Documento | Tema |
|---|---|
| `ECONOMIA-TOKENS.md` | Reglas para trabajar eficientemente con agentes |
| `GUIA-DOCKER.md` | Uso de Docker y PostgreSQL |
| `USUARIOS-Y-PERSISTENCIA.md` | Login, usuarios, JWT y persistencia |
| `TURNOS-HORARIOS.md` | Franjas horarias academicas |
| `REGLAS-HORARIOS-CONFIGURABLES.md` | Configuracion de bloques horarios desde la app |
| `CONDICIONES-DOCENTES.md` | Reglas de asignacion docente |
| `VIABILIDAD-HORARIO-SIN-CONFLICTOS.md` | Analisis de capacidad y viabilidad |
| `PLAN-ASIGNACION-CURSOS-TURNOS.md` | Plan tecnico de asignacion por curso/turno |
| `PLAN-SINCRONIZACION-DOCENTE-CURSO.md` | Sincronizacion entre cursos y docentes |

---

## 4. Requisitos de entorno

### 4.1. Herramientas principales

| Herramienta | Uso |
|---|---|
| Git | Clonar y versionar el proyecto |
| Docker + Docker Compose | Levantar PostgreSQL |
| Java 21 | Ejecutar el backend |
| Maven | Compilar y ejecutar Spring Boot |
| Node.js | Ejecutar frontend |
| npm o pnpm | Gestionar dependencias frontend/desktop |
| Electron | Ejecutar app de escritorio |

### 4.2. Puertos usados

| Servicio | Puerto |
|---|---:|
| PostgreSQL en host | `5433` |
| PostgreSQL dentro del contenedor | `5432` |
| Backend Spring Boot | `8081` |
| Frontend Vite | `5173` |

---

## 5. Base de datos

### 5.1. Motor

El proyecto usa PostgreSQL 16.

En desarrollo, PostgreSQL se levanta con Docker Compose usando el archivo `docker-compose.yml`.

Configuracion principal:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: schedule-postgres
    environment:
      POSTGRES_DB: schedule_db
      POSTGRES_USER: schedule
      POSTGRES_PASSWORD: schedule
    ports:
      - "5433:5432"
    volumes:
      - schedule_pg_data:/var/lib/postgresql/data
```

### 5.2. Datos de conexion

| Parametro | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5433` |
| Base de datos | `schedule_db` |
| Usuario | `schedule` |
| Contrasena | `schedule` |
| Contenedor | `schedule-postgres` |
| Volumen | `schedule_pg_data` |

### 5.3. Persistencia

Los datos persisten en el volumen Docker `schedule_pg_data`.

Esto significa que:

- `docker compose stop` detiene la BD sin borrar datos.
- `docker compose down` elimina el contenedor, pero conserva el volumen.
- `docker compose down -v` elimina tambien el volumen y borra los datos.

---

## 6. Configuracion del backend

Archivo principal:

```text
backend/src/main/resources/application.properties
```

Configuracion actual:

```properties
server.port=8081

spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5433/schedule_db}
spring.datasource.username=${DB_USER:schedule}
spring.datasource.password=${DB_PASSWORD:schedule}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

app.jwt.secret=${JWT_SECRET:schedule-dev-jwt-secret-key-min-256-bits-long!!}
app.jwt.expiration-ms=86400000
```

### 6.1. Variables de entorno soportadas

| Variable | Funcion | Valor por defecto |
|---|---|---|
| `DB_URL` | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5433/schedule_db` |
| `DB_USER` | Usuario de BD | `schedule` |
| `DB_PASSWORD` | Contrasena de BD | `schedule` |
| `JWT_SECRET` | Llave usada para firmar JWT | Valor dev incluido |

### 6.2. Persistencia JPA

El backend usa:

```properties
spring.jpa.hibernate.ddl-auto=update
```

Esto permite que Hibernate actualice el esquema de base de datos segun las entidades JPA. Es practico para desarrollo, pero para produccion convendria usar migraciones controladas con Flyway o Liquibase.

---

## 7. Dependencias principales

### 7.1. Backend

Archivo:

```text
backend/pom.xml
```

Tecnologias principales:

| Dependencia | Uso |
|---|---|
| `spring-boot-starter-web` | API REST |
| `spring-boot-starter-data-jpa` | Persistencia JPA |
| `spring-boot-starter-security` | Seguridad y autorizacion |
| `spring-boot-starter-validation` | Validacion de DTOs |
| `postgresql` | Driver JDBC PostgreSQL |
| `jjwt-api`, `jjwt-impl`, `jjwt-jackson` | Creacion y validacion de JWT |

Versiones relevantes:

| Elemento | Version |
|---|---|
| Java | 21 |
| Spring Boot | 3.2.0 |
| JJWT | 0.12.6 |

### 7.2. Frontend

Archivo:

```text
frontend/package.json
```

Dependencias principales:

| Dependencia | Uso |
|---|---|
| `react` | UI |
| `react-dom` | Renderizado en navegador |
| `vite` | Dev server y build |
| `tailwindcss` | Estilos |
| `lucide-react` | Iconos |
| `@base-ui/react` | Componentes base |
| `@radix-ui/react-slot` | Composicion de componentes |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Utilidades de clases CSS |

Scripts:

| Comando | Uso |
|---|---|
| `npm run dev` o `pnpm dev` | Levantar Vite |
| `npm run build` o `pnpm build` | Compilar frontend |
| `npm run preview` o `pnpm preview` | Previsualizar build |

### 7.3. Desktop

Archivo:

```text
desktop/package.json
```

Dependencia principal:

| Dependencia | Uso |
|---|---|
| `electron` | Ejecutar app de escritorio |

Script:

```bash
pnpm start
```

---

## 8. Ejecucion en desarrollo

### 8.1. Levantar PostgreSQL

Desde la raiz:

```bash
docker compose up -d
```

Verificar:

```bash
docker compose ps
```

### 8.2. Levantar backend

Desde `backend/`:

```bash
mvn spring-boot:run
```

El backend queda disponible en:

```text
http://localhost:8081
```

### 8.3. Levantar frontend

Desde `frontend/`:

```bash
pnpm dev
```

o:

```bash
npm run dev
```

El frontend queda disponible normalmente en:

```text
http://localhost:5173
```

### 8.4. Levantar desktop

Desde `desktop/`:

```bash
pnpm start
```

---

## 9. Autenticacion y usuarios

### 9.1. Login inicial

El sistema crea un usuario administrador inicial:

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |

### 9.2. Flujo de autenticacion

1. El usuario ingresa credenciales en la pantalla de login.
2. El frontend llama a `POST /api/auth/login`.
3. El backend valida credenciales contra PostgreSQL.
4. Si son correctas, el backend devuelve datos del usuario y un JWT.
5. El frontend guarda `{ user, token }` en `sessionStorage`.
6. Las peticiones protegidas incluyen:

```http
Authorization: Bearer <token>
```

### 9.3. Roles

| Rol | Permisos |
|---|---|
| `ADMIN` | Puede administrar usuarios y guardar reglas protegidas |
| `USER` | Puede acceder a funciones autenticadas sin permisos administrativos completos |

### 9.4. Seguridad

El backend usa:

- Spring Security.
- JWT Bearer Token.
- BCrypt para contrasenas.
- Filtro JWT para autenticar requests.
- Restricciones por rol en rutas sensibles.

Archivos clave:

| Archivo | Funcion |
|---|---|
| `SecurityConfig.java` | Configuracion de seguridad |
| `JwtService.java` | Generacion y validacion de tokens |
| `JwtAuthenticationFilter.java` | Lectura del Bearer token |
| `CustomUserDetailsService.java` | Carga de usuarios desde BD |
| `UserService.java` | Logica de usuarios y contrasenas |

---

## 10. API REST

Todas las rutas bajo `/api/**`, excepto login, requieren autenticacion segun la configuracion de seguridad.

### 10.1. Autenticacion

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/api/auth/login` | Login y emision de JWT |

### 10.2. Usuarios

Base:

```text
/api/users
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/users` | Listar usuarios |
| `GET` | `/api/users/{id}` | Obtener usuario |
| `POST` | `/api/users` | Crear usuario |
| `PUT` | `/api/users/{id}` | Editar usuario |
| `PATCH` | `/api/users/{id}/status` | Cambiar estado |
| `DELETE` | `/api/users/{id}` | Eliminar o desactivar |

### 10.3. Docentes

Base:

```text
/api/teachers
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/teachers` | Listar docentes |
| `GET` | `/api/teachers/{id}` | Obtener docente |
| `POST` | `/api/teachers` | Crear docente |
| `PUT` | `/api/teachers/{id}` | Editar docente |
| `DELETE` | `/api/teachers/{id}` | Eliminar docente |

### 10.4. Cursos

Base:

```text
/api/courses
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/courses` | Listar cursos |
| `GET` | `/api/courses/{id}` | Obtener curso |
| `POST` | `/api/courses` | Crear curso |
| `PUT` | `/api/courses/{id}` | Editar curso |
| `DELETE` | `/api/courses/{id}` | Eliminar curso |

### 10.5. Ambientes o espacios

Base:

```text
/api/spaces
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/spaces` | Listar ambientes |
| `GET` | `/api/spaces/{id}` | Obtener ambiente |
| `POST` | `/api/spaces` | Crear ambiente |
| `PUT` | `/api/spaces/{id}` | Editar ambiente |
| `DELETE` | `/api/spaces/{id}` | Eliminar ambiente |

### 10.6. Jefes de practica

Base:

```text
/api/practice-heads
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/practice-heads` | Listar jefes de practica |
| `GET` | `/api/practice-heads/{id}` | Obtener jefe de practica |
| `POST` | `/api/practice-heads` | Crear jefe de practica |
| `PUT` | `/api/practice-heads/{id}` | Editar jefe de practica |
| `DELETE` | `/api/practice-heads/{id}` | Eliminar jefe de practica |

### 10.7. Reglas horarias

Base:

```text
/api/schedule-settings
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/schedule-settings` | Obtener bloques horarios activos |
| `PUT` | `/api/schedule-settings` | Actualizar bloques horarios |

### 10.8. Horarios

Base:

```text
/api/schedules
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/schedules` | Obtener propuesta de horario |
| `POST` | `/api/schedules/generate` | Generar propuesta |

### 10.9. Asignaciones curso-docente

Base:

```text
/api/course-teacher-assignments
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `PATCH` | `/api/course-teacher-assignments/{id}/weekday` | Cambiar dia de una asignacion |

### 10.10. Notificaciones

Base:

```text
/api/notifications
```

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/notifications` | Listar notificaciones |
| `GET` | `/api/notifications/logs` | Listar logs |

### 10.11. Prueba simple

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/hello` | Endpoint simple de prueba |

---

## 11. Modelo de dominio

### 11.1. Usuarios

Entidad principal:

```text
User
```

Campos conceptuales:

| Campo | Descripcion |
|---|---|
| `id` | Identificador |
| `username` | Nombre de usuario unico |
| `passwordHash` | Contrasena hasheada |
| `role` | `ADMIN` o `USER` |
| `enabled` | Estado activo/inactivo |

### 11.2. Docentes

Entidad principal:

```text
Teacher
```

Tipos de docente:

| Tipo | Descripcion |
|---|---|
| `NOMBRADO` | Docente nombrado de la escuela |
| `CONTRATADO` | Docente contratado |
| `ESTUDIOS_GENERALES` | Docente asignado a cursos de estudios generales |

Reglas relevantes:

- Nombrados y contratados solo deben dictar cursos de carrera.
- Estudios generales solo deben dictar cursos de estudios generales.
- Los nombrados tienen prioridad en el flujo operativo de asignacion.
- Existe una regla institucional de maximo 17 docentes nombrados.

### 11.3. Cursos

Entidad principal:

```text
Course
```

Los cursos pertenecen al plan de estudios EPIS 2024.

Clasificaciones relevantes:

| Concepto | Ejemplos |
|---|---|
| Ciclo | I a X |
| Categoria | Carrera, estudios generales |
| Tipo | Teorico, laboratorio u otros segun el modelo |
| Turno permitido | Manana/tarde para I-VIII, noche para IX-X |

### 11.4. Ambientes

Entidad principal:

```text
Space
```

Representa aulas, laboratorios u otros ambientes donde pueden programarse cursos.

El sistema valida asignaciones para evitar conflictos de uso de ambientes.

### 11.5. Jefes de practica

Entidad principal:

```text
PracticeHead
```

Permite registrar y administrar encargados de practica, especialmente asociados a laboratorios o cursos que requieren soporte practico.

### 11.6. Bloques horarios

Entidad principal:

```text
ScheduleBlockSetting
```

Representa las franjas del dia academico:

- Desayuno.
- Turno manana.
- Almuerzo.
- Turno tarde.
- Cena.
- Turno noche.

---

## 12. Reglas academicas de horarios

### 12.1. Dias lectivos

Las clases se programan de lunes a viernes.

No se consideran bloques lectivos sabado ni domingo.

### 12.2. Franjas horarias por defecto

| Orden | Bloque | Codigo | Inicio | Fin |
|---:|---|---|---|---|
| 1 | Desayuno | `DESAYUNO` | 06:30 | 08:00 |
| 2 | Turno manana | `MANANA` | 08:00 | 12:30 |
| 3 | Almuerzo | `ALMUERZO` | 12:30 | 14:00 |
| 4 | Turno tarde | `TARDE` | 14:00 | 17:00 |
| 5 | Cena | `CENA` | 17:00 | 17:15 |
| 6 | Turno noche | `NOCHE` | 17:15 | 22:30 |

### 12.3. Bloques lectivos y no lectivos

Bloques no lectivos:

- `DESAYUNO`
- `ALMUERZO`
- `CENA`

Bloques lectivos:

- `MANANA`
- `TARDE`
- `NOCHE`

### 12.4. Validacion de bloques horarios

El sistema debe respetar:

- Exactamente 6 bloques.
- Orden fijo.
- Sin huecos entre bloques.
- Sin solapes.
- Duracion minima de 15 minutos por bloque.
- Inicio del desayuno no menor a 05:00.
- Fin de noche no mayor a 23:59.
- Formato `HH:mm`.

Ejemplo de encadenamiento correcto:

```text
fin(DESAYUNO) = inicio(MANANA)
fin(MANANA) = inicio(ALMUERZO)
fin(ALMUERZO) = inicio(TARDE)
fin(TARDE) = inicio(CENA)
fin(CENA) = inicio(NOCHE)
```

### 12.5. Configuracion desde la app

La pantalla:

```text
Reglas -> Horarios del dia
```

permite administrar las franjas horarias.

Funciones esperadas:

- Ver timeline visual de lunes a viernes.
- Ajustar horas de inicio y fin.
- Guardar cambios.
- Restaurar valores por defecto.
- Persistir cambios en PostgreSQL.

Solo usuarios `ADMIN` deberian poder guardar cambios.

---

## 13. Reglas por ciclo

### 13.1. Ciclos I a VIII

Los ciclos I a VIII son diurnos.

Turnos permitidos:

- `MANANA`
- `TARDE`

No deben programarse en `NOCHE`.

### 13.2. Ciclos IX y X

Los ciclos IX y X son nocturnos.

Turno permitido:

- `NOCHE`

No deben programarse en `MANANA` ni `TARDE`.

### 13.3. Capacidad semanal

Capacidad por tipo de ciclo:

| Tipo de ciclo | Turnos permitidos | Capacidad semanal |
|---|---|---:|
| I-VIII | Manana + tarde | 37.5 h reales |
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

Conclusion: con los docentes, ambientes y asignaciones completas, la distribucion es viable por capacidad.

---

## 14. Reglas de docentes

### 14.1. Tipos de docente

| Tipo | Cursos permitidos |
|---|---|
| `NOMBRADO` | Cursos de carrera |
| `CONTRATADO` | Cursos de carrera |
| `ESTUDIOS_GENERALES` | Cursos de estudios generales |

### 14.2. Flujo institucional de asignacion

La asignacion se entiende en tres fases:

| Fase | Actor | Accion |
|---:|---|---|
| 1 | Docentes nombrados | Eligen cursos y turnos de carrera |
| 2 | Estudios generales | Asigna docentes a cursos EG |
| 3 | Escuela EPIS | Contrata docentes para cubrir cursos faltantes |

El sistema distingue tipos de docente y valida categorias, pero no automatiza completamente el flujo por fases.

### 14.3. Limite de nombrados

Existe una regla institucional:

```text
Maximo 17 docentes nombrados
```

Segun la documentacion actual, esta condicion debe respetarse operativamente. No necesariamente esta impuesta de forma automatica en todos los formularios.

### 14.4. Modalidades de asignacion

Un docente puede asociarse a cursos por turno:

| Modalidad | Descripcion |
|---|---|
| Manana y tarde | Mismo docente dicta el curso en ambos turnos |
| Solo manana | Docente asignado a manana |
| Solo tarde | Docente asignado a tarde |
| Turno noche | Docente asignado a noche |

Para ciclos IX y X, la modalidad aplicable es noche.

---

## 15. Horarios y generacion de propuestas

### 15.1. Fuente de verdad

La propuesta de horario se construye a partir de:

- Cursos registrados.
- Docentes asignados.
- Ambientes asignados.
- Turnos permitidos por ciclo.
- Subturnos cuando aplican.
- Bloques horarios activos.

### 15.2. Pantalla de horarios

Archivo principal:

```text
frontend/src/pages/Horarios.jsx
```

Funciones descritas en la documentacion:

- Consultar propuesta actual por ciclo.
- Mostrar matriz textual.
- Mostrar vista de color por franjas.
- Recalcular conforme se asignan docentes, cursos y ambientes.

### 15.3. Conflictos que debe evitar

El sistema busca evitar:

- Un docente en dos clases al mismo tiempo.
- Un ambiente en dos clases al mismo tiempo.
- Un ciclo con cursos superpuestos.
- Cursos fuera del turno permitido por ciclo.
- Cursos durante comida o bloques no lectivos.

### 15.4. Condiciones para viabilidad real

Para que el horario sea viable operativamente deben estar completos:

- Docentes de estudios generales.
- Docentes contratados necesarios.
- Asignaciones reales de docentes.
- Asignaciones reales de ambientes.
- Subturnos de laboratorios.
- Reglas horarias activas.

---

## 16. Frontend: pantallas principales

### 16.1. `Login.jsx`

Pantalla de inicio de sesion.

Responsabilidades:

- Capturar usuario y contrasena.
- Llamar al endpoint de login.
- Guardar sesion.
- Redirigir al area principal.

### 16.2. `Dashboard.jsx`

Pantalla inicial tras iniciar sesion.

Sirve como resumen o entrada al sistema.

### 16.3. `Teachers.jsx`

Gestion de docentes.

Funciones:

- Listar docentes.
- Crear docente.
- Editar docente.
- Eliminar docente.
- Asignar cursos a docentes.
- Mostrar cursos asociados.
- Respetar reglas por tipo de docente y curso.

### 16.4. `Courses.jsx`

Gestion de cursos.

Funciones:

- Listar cursos.
- Crear curso.
- Editar curso.
- Eliminar curso.
- Mostrar docentes asignados por turno.
- Sincronizar datos con asignaciones docente-curso.

### 16.5. `Spaces.jsx`

Gestion de ambientes.

Funciones:

- Listar ambientes.
- Crear ambiente.
- Editar ambiente.
- Eliminar ambiente.
- Asignar cursos a espacios.
- Controlar disponibilidad de ambientes.

### 16.6. `PracticeHeads.jsx`

Gestion de jefes de practica.

Funciones:

- Registrar jefes de practica.
- Editar informacion.
- Asociar responsabilidades de practica/laboratorio segun modelo.

### 16.7. `Rules.jsx`

Gestion de reglas.

Funciones:

- Ver horarios del dia.
- Ajustar bloques horarios.
- Restaurar valores por defecto.
- Guardar configuracion.

### 16.8. `Horarios.jsx`

Visualizacion/generacion de horarios.

Funciones:

- Mostrar propuesta de horario.
- Organizar por ciclo.
- Ver matriz o vista de franjas.
- Consultar al backend la propuesta calculada.

### 16.9. `Users.jsx`

Gestion de usuarios.

Funciones:

- Listar usuarios.
- Crear usuario.
- Editar usuario.
- Activar/desactivar o eliminar.
- Restringir acceso a administradores.

---

## 17. Cliente HTTP del frontend

Archivo:

```text
frontend/src/lib/api.js
```

Responsabilidades:

- Centralizar llamadas al backend.
- Adjuntar token JWT en requests protegidos.
- Manejar errores de autenticacion.
- Ejecutar logout si el backend responde `401`.

Flujo esperado:

```text
UI -> api.js -> Backend REST -> PostgreSQL
```

---

## 18. Sesion frontend

Archivos clave:

```text
frontend/src/lib/auth.js
frontend/src/contexts/AuthContext.jsx
```

Responsabilidades:

- Guardar datos de sesion en `sessionStorage`.
- Exponer usuario actual.
- Exponer funciones de login/logout.
- Controlar vistas visibles segun autenticacion y rol.

---

## 19. Sincronizacion curso-docente

La relacion entre docentes y cursos se maneja mediante:

```text
CourseTeacherAssignment
```

Conceptualmente:

- Un docente puede tener cursos asignados.
- Un curso puede mostrar docentes asignados por turno.
- La base de datos es la fuente de verdad.
- El frontend debe refrescar vistas para reflejar cambios cruzados.

Problema documentado:

- Al guardar desde `Teachers.jsx`, `Courses.jsx` puede necesitar recargar datos para mostrar el docente asignado.
- Al guardar desde `Courses.jsx`, `Teachers.jsx` puede necesitar recargar datos para mostrar el curso asignado.

Solucion sugerida en documentacion:

- Usar eventos de ventana como `teachers-updated` y `courses-updated`.
- Cada pagina escucha el evento que le corresponde y refresca datos.

---

## 20. Plan de estudios y carga horaria

El proyecto incluye informacion del plan EPIS 2024.

Resumen global:

| Tipo de estudio | Cursos | H. academicas | Creditos | H. reales |
|---|---:|---:|---:|---:|
| Estudios Generales | 12 | 59 | 41 | 44.25 |
| Estudios Especificos | 13 | 60 | 44 | 45.00 |
| Estudios de Especialidad | 35 | 199 | 134 | 149.25 |
| Electivos | 2 | 8 | 6 | 6.00 |
| Total | 62 | 326 | 225 | 244.50 |

Regla de conversion:

```text
1 hora academica = 45 minutos
```

---

## 21. Documentacion existente recomendada

Para entender o mantener el sistema, revisar en este orden:

1. `README.md`
2. `docs/GUIA-DOCKER.md`
3. `docs/USUARIOS-Y-PERSISTENCIA.md`
4. `docs/TURNOS-HORARIOS.md`
5. `docs/REGLAS-HORARIOS-CONFIGURABLES.md`
6. `docs/CONDICIONES-DOCENTES.md`
7. `docs/VIABILIDAD-HORARIO-SIN-CONFLICTOS.md`
8. `docs/PLAN-ASIGNACION-CURSOS-TURNOS.md`
9. `docs/PLAN-SINCRONIZACION-DOCENTE-CURSO.md`

Este documento consolida los puntos principales, pero los documentos especializados siguen siendo la referencia mas detallada para cada tema concreto.

---

## 22. Flujo recomendado para desarrollo

### 22.1. Antes de modificar

1. Identificar el modulo afectado.
2. Buscar archivos relevantes con `rg`.
3. Leer solo los archivos necesarios.
4. Confirmar si el cambio afecta backend, frontend o ambos.
5. Editar con parches pequenos.

### 22.2. Si el cambio es de backend

Revisar normalmente:

- Controller relacionado.
- DTOs de entrada/salida.
- Service con reglas de negocio.
- Entity si cambia persistencia.
- Repository si requiere consultas.
- Security si afecta permisos.

### 22.3. Si el cambio es de frontend

Revisar normalmente:

- Pagina en `frontend/src/pages/`.
- Componentes usados por esa pagina.
- Cliente API.
- Constantes de dominio.
- Contextos si afecta sesion o estado global.
- Estilos del modulo.

### 22.4. Si el cambio afecta reglas academicas

Revisar:

- `docs/CONDICIONES-DOCENTES.md`
- `docs/TURNOS-HORARIOS.md`
- `docs/REGLAS-HORARIOS-CONFIGURABLES.md`
- `CourseCycleRules.java`
- Services correspondientes.
- `frontend/src/lib/constants.js`

---

## 23. Reglas para agentes en este repositorio

El archivo `AGENTS.md` define como debe trabajar un agente en el proyecto.

Reglas principales:

- Responder siempre en espanol, salvo nombres de archivos o comandos.
- Mantener respuestas breves y directas cuando la tarea sea concreta.
- Para cambios de codigo, mostrar solo archivos editados, fragmentos minimos y resumen corto.
- Evitar builds, instalaciones o dependencias nuevas sin permiso.
- Leer el archivo actual antes de modificarlo.
- Buscar antes de leer grandes partes del proyecto.
- Editar solo bloques especificos.
- No tocar codigo fuera del area solicitada.

Guia ampliada:

```text
docs/ECONOMIA-TOKENS.md
```

---

## 24. Problemas frecuentes

### 24.1. PostgreSQL no levanta

Verificar:

```bash
docker compose ps
docker compose logs postgres --tail 20
```

Posibles causas:

- Docker no esta iniciado.
- Puerto `5433` ocupado.
- Volumen corrupto o configuracion previa incompatible.

### 24.2. Backend no conecta a BD

Verificar:

- PostgreSQL esta `Up`.
- `application.properties` apunta a `localhost:5433`.
- Usuario y contrasena son `schedule`.
- La base se llama `schedule_db`.

### 24.3. Puerto 8081 ocupado

Significa que ya existe un backend ejecutandose o algun proceso usa el puerto.

Solucion:

- Cerrar la terminal anterior.
- Identificar y detener el proceso que usa el puerto.

### 24.4. Login falla

Revisar:

- Backend encendido.
- PostgreSQL encendido.
- Usuario inicial `admin`.
- Contrasena `admin123`.
- Seed inicial ejecutado correctamente.

### 24.5. Frontend no muestra datos actualizados

Posibles causas:

- Token expirado o invalido.
- Backend apagado.
- Cambios guardados desde otra pantalla sin refresco de datos.
- Error de CORS o API base incorrecta.

---

## 25. Consideraciones para produccion

Antes de produccion convendria:

- Cambiar `JWT_SECRET`.
- No usar credenciales por defecto.
- Configurar PostgreSQL en servidor central.
- Deshabilitar secretos hardcodeados.
- Usar migraciones con Flyway o Liquibase.
- Configurar CORS para dominio real.
- Construir frontend con `pnpm build` o `npm run build`.
- Ajustar Electron para cargar `frontend/dist/index.html`.
- Definir backups de PostgreSQL.
- Definir politicas de roles y usuarios.

---

## 26. Resumen ejecutivo final

`Schedule` es una aplicacion academica full-stack para administrar horarios, docentes, cursos, ambientes y usuarios. El backend Spring Boot protege la API con JWT, aplica reglas de negocio y persiste en PostgreSQL. El frontend React consume esa API y ofrece pantallas para operar el sistema. Electron permite abrir la interfaz como app de escritorio.

Las reglas academicas centrales son:

- Clases de lunes a viernes.
- Comidas bloqueadas: desayuno, almuerzo y cena.
- Ciclos I-VIII en manana/tarde.
- Ciclos IX-X en noche.
- Docentes nombrados y contratados para cursos de carrera.
- Docentes de estudios generales para cursos EG.
- Horarios configurables desde la pantalla de reglas.
- Propuesta de horario viable si se completan docentes, ambientes y asignaciones.

Este documento sirve como mapa maestro del proyecto y debe mantenerse alineado con los documentos especializados de `docs/`.

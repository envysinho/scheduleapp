# Funcionamiento interno del proyecto Schedule

## Portada

**Proyecto:** Schedule Desktop App

**Tema del documento:** Como funcionan las partes del sistema y como se comunican entre si

**Tipo de sistema:** Aplicacion academica full-stack para gestion de horarios

**Componentes principales:** Spring Boot, React, Vite, Electron, PostgreSQL y Docker

**Fecha:** Julio de 2026

---

## 1. Idea general del funcionamiento

Schedule funciona como un sistema dividido en capas. Cada capa cumple una responsabilidad clara y se comunica con las demas mediante interfaces definidas.

La aplicacion no guarda los datos directamente en el frontend. El usuario interactua con pantallas React, esas pantallas llaman a una API REST del backend, el backend valida la solicitud, aplica reglas de negocio y finalmente guarda o consulta informacion en PostgreSQL.

El funcionamiento general puede resumirse asi:

```text
Usuario
  -> Frontend React
  -> Cliente HTTP api.js
  -> Backend Spring Boot
  -> Servicios de negocio
  -> Repositorios JPA
  -> PostgreSQL
```

Cuando se usa la version de escritorio, Electron actua como una ventana que muestra el frontend. Electron no reemplaza al backend ni a la base de datos.

```text
Electron
  -> Carga la interfaz React
  -> React consume el backend
  -> Backend usa PostgreSQL
```

---

## 2. Como se inicia el sistema

Para que todo funcione en desarrollo deben estar activos varios componentes.

### 2.1. Base de datos

Primero se levanta PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

Esto crea o inicia un contenedor llamado `schedule-postgres`, usando PostgreSQL 16. La base de datos queda disponible en el puerto `5433` del equipo.

Datos principales:

| Elemento | Valor |
|---|---|
| Base de datos | `schedule_db` |
| Usuario | `schedule` |
| Contrasena | `schedule` |
| Puerto host | `5433` |
| Puerto interno | `5432` |
| Contenedor | `schedule-postgres` |
| Volumen | `schedule_pg_data` |

El volumen `schedule_pg_data` permite conservar la informacion aunque el contenedor se apague.

### 2.2. Backend

Luego se levanta el backend:

```bash
cd backend
mvn spring-boot:run
```

El backend queda escuchando en:

```text
http://localhost:8081
```

Al iniciar, Spring Boot:

- carga la configuracion de `application.properties`;
- abre conexion con PostgreSQL;
- registra controladores REST;
- configura Spring Security;
- prepara el filtro JWT;
- carga repositorios JPA;
- crea o actualiza tablas con Hibernate;
- inserta datos iniciales si corresponde.

### 2.3. Frontend

Despues se levanta el frontend:

```bash
cd frontend
pnpm dev
```

o:

```bash
cd frontend
npm run dev
```

Vite normalmente expone la interfaz en:

```text
http://localhost:5173
```

El frontend no contiene la base de datos. Su funcion es mostrar pantallas, capturar acciones del usuario y comunicarse con el backend.

### 2.4. Desktop

Finalmente, si se desea usar la version de escritorio:

```bash
cd desktop
pnpm start
```

Electron abre una ventana de escritorio y carga la aplicacion frontend.

---

## 3. Como se comunican las capas

La comunicacion principal ocurre por HTTP.

El frontend llama a rutas como:

```text
GET /api/users
POST /api/auth/login
GET /api/teachers
PUT /api/courses/{id}
POST /api/schedules/generate
```

El backend responde con JSON. El frontend transforma ese JSON en tablas, formularios, tarjetas, opciones o grillas de horario.

Ejemplo de flujo:

```text
Usuario presiona "Guardar docente"
  -> Teachers.jsx arma los datos del formulario
  -> api.js envia POST /api/teachers
  -> TeacherController recibe la peticion
  -> TeacherService valida reglas
  -> TeacherRepository guarda en PostgreSQL
  -> Backend responde JSON
  -> Frontend refresca la lista de docentes
```

---

## 4. Funcionamiento del login

El login es el primer flujo importante porque protege el resto de la aplicacion.

### 4.1. Usuario inicial

El sistema crea un administrador inicial:

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |

Este usuario permite entrar por primera vez y crear otras cuentas desde la pantalla de usuarios.

### 4.2. Flujo paso a paso

1. El usuario escribe nombre de usuario y contrasena en `Login.jsx`.
2. El frontend llama a `POST /api/auth/login`.
3. `AuthController` recibe la solicitud.
4. El backend busca el usuario en PostgreSQL.
5. Spring Security compara la contrasena ingresada con el hash BCrypt guardado.
6. Si las credenciales son validas, `JwtService` genera un token JWT.
7. El backend devuelve el usuario y el token.
8. El frontend guarda la sesion en `sessionStorage`.
9. La aplicacion muestra las pantallas internas.

Resumen visual:

```text
Login.jsx
  -> api.js
  -> POST /api/auth/login
  -> AuthController
  -> CustomUserDetailsService
  -> UserRepository
  -> PostgreSQL
  -> JwtService
  -> token
  -> sessionStorage
```

### 4.3. Que guarda el frontend

El frontend guarda una estructura parecida a:

```json
{
  "user": {
    "username": "admin",
    "role": "ADMIN"
  },
  "token": "jwt..."
}
```

Esto se guarda en `sessionStorage`, no directamente en la base de datos.

### 4.4. Por que se usa JWT

El JWT permite que el backend reconozca al usuario en cada peticion sin pedir usuario y contrasena otra vez.

Cada peticion protegida incluye:

```http
Authorization: Bearer <token>
```

El backend valida ese token antes de permitir acceso.

---

## 5. Funcionamiento de la autorizacion

No todos los usuarios pueden hacer lo mismo.

El sistema maneja roles:

| Rol | Funcion |
|---|---|
| `ADMIN` | Puede administrar usuarios y guardar configuraciones protegidas |
| `USER` | Puede usar funciones autenticadas sin control administrativo completo |

Ejemplo:

- un `ADMIN` puede entrar a la pantalla `Usuarios`;
- un `USER` no deberia administrar cuentas;
- algunas reglas del sistema solo deberian guardarse desde una cuenta administradora.

El control ocurre en dos lugares:

1. En el frontend, ocultando o limitando opciones segun el rol.
2. En el backend, rechazando peticiones no autorizadas.

El backend es la capa mas importante para seguridad, porque el frontend puede ser manipulado por un usuario avanzado. Por eso las rutas sensibles tambien se protegen desde Spring Security.

---

## 6. Funcionamiento del cliente HTTP

El archivo:

```text
frontend/src/lib/api.js
```

centraliza las llamadas al backend.

Sus responsabilidades son:

- construir URLs hacia la API;
- enviar datos en formato JSON;
- agregar el token JWT cuando existe sesion;
- detectar errores HTTP;
- cerrar sesion si el backend responde `401`;
- evitar repetir codigo HTTP en todas las pantallas.

Flujo normal:

```text
Componente React
  -> llama funcion de api.js
  -> api.js agrega headers
  -> fetch al backend
  -> backend responde JSON
  -> api.js devuelve datos al componente
```

Esto hace que las pantallas no tengan que saber todos los detalles tecnicos del HTTP.

---

## 7. Funcionamiento de la persistencia

La persistencia significa que los datos no se pierden al cerrar la interfaz.

Schedule usa PostgreSQL como base de datos real. El backend se comunica con PostgreSQL mediante JPA.

### 7.1. Papel de las entidades

Las entidades representan tablas de la base de datos.

Ejemplos conceptuales:

| Entidad | Que representa |
|---|---|
| `User` | Cuentas del sistema |
| `Teacher` | Docentes |
| `Course` | Cursos |
| `Space` | Ambientes |
| `PracticeHead` | Jefes de practica |
| `ScheduleBlockSetting` | Bloques horarios configurables |
| `CourseTeacherAssignment` | Relacion entre cursos y docentes |

### 7.2. Papel de los repositorios

Los repositorios son interfaces que permiten consultar y guardar datos sin escribir SQL manual en cada operacion.

Ejemplo conceptual:

```text
TeacherService
  -> TeacherRepository
  -> PostgreSQL
```

### 7.3. Papel de los servicios

Los servicios contienen la logica de negocio.

El controlador no deberia decidir reglas complejas. Su trabajo principal es recibir peticiones y devolver respuestas.

El servicio decide cosas como:

- si un docente puede asignarse a cierto curso;
- si un usuario puede crearse;
- si una contrasena debe actualizarse;
- si un bloque horario es valido;
- si una asignacion genera conflicto.

---

## 8. Funcionamiento de los CRUD

CRUD significa:

| Letra | Operacion | Significado |
|---|---|---|
| C | Create | Crear |
| R | Read | Leer/Listar |
| U | Update | Actualizar |
| D | Delete | Eliminar o desactivar |

Schedule usa CRUD para varias entidades: usuarios, docentes, cursos, ambientes y jefes de practica.

### 8.1. Crear

Ejemplo: crear un docente.

```text
Usuario llena formulario
  -> Frontend valida campos basicos
  -> Frontend envia POST /api/teachers
  -> Backend valida reglas
  -> Backend guarda en PostgreSQL
  -> Frontend actualiza tabla
```

### 8.2. Leer o listar

Ejemplo: abrir la pantalla de cursos.

```text
Courses.jsx se monta
  -> llama GET /api/courses
  -> backend consulta CourseRepository
  -> PostgreSQL devuelve cursos
  -> frontend muestra lista
```

### 8.3. Actualizar

Ejemplo: editar un ambiente.

```text
Usuario selecciona ambiente
  -> formulario carga datos existentes
  -> usuario modifica informacion
  -> frontend envia PUT /api/spaces/{id}
  -> backend actualiza registro
  -> frontend refresca la vista
```

### 8.4. Eliminar o desactivar

Dependiendo de la entidad, eliminar puede significar borrar el registro o marcarlo como inactivo.

En usuarios, es mas seguro desactivar que borrar, porque conserva trazabilidad.

---

## 9. Funcionamiento de usuarios

La pantalla `Users.jsx` permite administrar cuentas.

Flujo de usuario administrador:

1. Inicia sesion como `ADMIN`.
2. Entra a la pantalla `Usuarios`.
3. Consulta la lista de cuentas.
4. Crea un nuevo usuario indicando username, contrasena y rol.
5. Edita usuarios existentes si es necesario.
6. Desactiva cuentas que ya no deben ingresar.

El backend guarda:

- username;
- hash de contrasena;
- rol;
- estado activo/inactivo.

La contrasena nunca debe guardarse en texto plano. Se guarda como hash BCrypt.

---

## 10. Funcionamiento de docentes

La pantalla de docentes permite registrar y administrar profesores.

Un docente tiene un tipo:

| Tipo | Uso |
|---|---|
| `NOMBRADO` | Docente estable de la escuela |
| `CONTRATADO` | Docente contratado para cubrir cursos |
| `ESTUDIOS_GENERALES` | Docente asignado a cursos de estudios generales |

El sistema usa ese tipo para validar que el docente sea compatible con los cursos.

Regla general:

- docentes `NOMBRADO` y `CONTRATADO` dictan cursos de carrera;
- docentes `ESTUDIOS_GENERALES` dictan cursos de estudios generales.

Flujo de asignacion:

```text
Usuario selecciona docente
  -> elige curso y turno
  -> frontend envia asignacion
  -> backend valida compatibilidad
  -> backend guarda relacion curso-docente
  -> frontend actualiza docentes y cursos
```

---

## 11. Funcionamiento de cursos

Los cursos pertenecen al plan de estudios EPIS 2024.

Cada curso puede tener datos como:

- codigo;
- nombre;
- ciclo;
- categoria;
- horas;
- creditos;
- turnos permitidos;
- docentes asignados.

La pantalla de cursos permite crear, editar, eliminar y consultar cursos. Tambien muestra relaciones con docentes.

El ciclo del curso es importante porque determina en que turno puede programarse:

| Ciclos | Turnos permitidos |
|---|---|
| I a VIII | Manana y tarde |
| IX y X | Noche |

Esto evita que cursos de los ultimos ciclos se mezclen con horarios diurnos si la regla institucional indica que deben ser nocturnos.

---

## 12. Funcionamiento de ambientes

Los ambientes representan aulas, laboratorios u otros espacios fisicos.

La pantalla de ambientes permite:

- registrar espacios;
- editar informacion;
- eliminar ambientes;
- asignar cursos;
- controlar disponibilidad.

En una propuesta de horario, un ambiente no deberia usarse en dos clases al mismo tiempo.

Ejemplo de conflicto:

```text
Laboratorio 1
Lunes 08:00 - 10:00
Curso A

Laboratorio 1
Lunes 09:00 - 11:00
Curso B
```

Ese caso debe evitarse porque el mismo ambiente queda ocupado simultaneamente.

---

## 13. Funcionamiento de jefes de practica

Los jefes de practica sirven para registrar personal asociado a sesiones practicas o laboratorios.

Su gestion permite:

- registrar datos del jefe de practica;
- actualizar informacion;
- relacionar responsabilidades practicas;
- mantener informacion separada de los docentes principales.

Esta separacion ayuda cuando un curso tiene teoria con un docente y practica con otro responsable.

---

## 14. Funcionamiento de reglas horarias

Las reglas horarias definen el dia academico.

El sistema usa seis bloques:

| Orden | Bloque | Codigo | Inicio | Fin | Tipo |
|---:|---|---|---|---|---|
| 1 | Desayuno | `DESAYUNO` | 06:30 | 08:00 | No lectivo |
| 2 | Manana | `MANANA` | 08:00 | 12:30 | Lectivo |
| 3 | Almuerzo | `ALMUERZO` | 12:30 | 14:00 | No lectivo |
| 4 | Tarde | `TARDE` | 14:00 | 17:00 | Lectivo |
| 5 | Cena | `CENA` | 17:00 | 17:15 | No lectivo |
| 6 | Noche | `NOCHE` | 17:15 | 22:30 | Lectivo |

Los bloques no lectivos son pausas. No se deben programar clases durante desayuno, almuerzo o cena.

### 14.1. Como se editan

En la pantalla:

```text
Reglas -> Horarios del dia
```

un administrador puede modificar horarios.

Flujo:

```text
Rules.jsx carga GET /api/schedule-settings
  -> muestra bloques actuales
  -> usuario cambia horas
  -> frontend valida formato
  -> backend valida reglas completas
  -> PUT /api/schedule-settings
  -> PostgreSQL guarda configuracion activa
```

### 14.2. Validaciones

El sistema debe respetar:

- exactamente seis bloques;
- orden fijo;
- sin huecos entre bloques;
- sin solapes;
- duracion minima de 15 minutos;
- formato `HH:mm`;
- inicio no menor a 05:00;
- fin no mayor a 23:59.

---

## 15. Funcionamiento de turnos por ciclo

La regla academica principal es:

| Ciclo | Funcionamiento |
|---|---|
| I a VIII | Se programan en manana y tarde |
| IX y X | Se programan en noche |

Esto organiza los cursos por nivel academico y evita que los ultimos ciclos se mezclen con turnos que no les corresponden.

Ejemplo:

```text
Curso de ciclo III
  -> puede ir en MANANA o TARDE
  -> no debe ir en NOCHE

Curso de ciclo IX
  -> debe ir en NOCHE
  -> no debe ir en MANANA ni TARDE
```

---

## 16. Funcionamiento de asignaciones curso-docente

La relacion entre cursos y docentes no es simplemente texto en pantalla. Debe guardarse como una relacion persistente.

Conceptualmente:

```text
Course
  -> CourseTeacherAssignment
  -> Teacher
```

Esta relacion permite saber:

- que docente dicta un curso;
- en que turno lo dicta;
- si el mismo docente cubre manana y tarde;
- si un curso nocturno ya tiene docente;
- que cursos aparecen asociados a cada docente.

Cuando se modifica una asignacion desde docentes, tambien debe reflejarse en cursos. Cuando se modifica desde cursos, tambien debe reflejarse en docentes.

Por eso la documentacion propone refrescar vistas mediante eventos como:

```text
teachers-updated
courses-updated
```

---

## 17. Funcionamiento de horarios

La pantalla de horarios consulta o genera una propuesta organizada por ciclo.

Para construir una propuesta se necesita:

- lista de cursos;
- docentes asignados;
- ambientes asignados;
- ciclo de cada curso;
- reglas de turnos;
- bloques horarios activos;
- restricciones de conflictos.

Flujo general:

```text
Usuario entra a Horarios
  -> Horarios.jsx solicita propuesta
  -> backend consulta cursos, docentes, ambientes y reglas
  -> servicio de horarios calcula ubicaciones
  -> backend devuelve matriz o lista de bloques
  -> frontend renderiza propuesta
```

### 17.1. Conflictos que se deben evitar

El sistema debe evitar:

- un docente en dos clases a la misma hora;
- un ambiente ocupado por dos cursos al mismo tiempo;
- un ciclo con dos cursos superpuestos;
- cursos de ciclo I-VIII en turno noche;
- cursos de ciclo IX-X en manana o tarde;
- clases en bloques de comida;
- asignaciones sin docente cuando el curso ya debe programarse;
- asignaciones sin ambiente cuando el curso requiere espacio.

### 17.2. Por que la propuesta depende de datos completos

El horario no puede ser completamente confiable si faltan datos.

Ejemplos:

- si un curso no tiene docente, no se puede validar conflicto docente;
- si un curso no tiene ambiente, no se puede validar conflicto de aula;
- si no estan configurados los bloques horarios, no se puede ubicar correctamente;
- si faltan cursos del plan, la carga horaria queda incompleta.

---

## 18. Funcionamiento visual del frontend

El frontend esta organizado por pantallas.

| Pantalla | Funcion |
|---|---|
| `Login.jsx` | Iniciar sesion |
| `Dashboard.jsx` | Entrada principal |
| `Users.jsx` | Administrar usuarios |
| `Teachers.jsx` | Administrar docentes |
| `Courses.jsx` | Administrar cursos |
| `Spaces.jsx` | Administrar ambientes |
| `PracticeHeads.jsx` | Administrar jefes de practica |
| `Rules.jsx` | Configurar reglas horarias |
| `Horarios.jsx` | Ver o generar horarios |

Cada pantalla combina:

- estado React;
- formularios;
- tablas;
- llamadas a `api.js`;
- validaciones de interfaz;
- mensajes de error o exito;
- renderizado de datos devueltos por el backend.

---

## 19. Funcionamiento del backend por capas

El backend sigue una estructura por responsabilidades.

| Capa | Funcion |
|---|---|
| Controller | Recibe HTTP y devuelve respuestas |
| DTO | Define datos de entrada y salida |
| Service | Aplica reglas de negocio |
| Repository | Accede a la base de datos |
| Entity | Representa tablas |
| Security | Protege rutas y valida JWT |
| Config | Configuracion general y datos iniciales |

Ejemplo completo:

```text
POST /api/users
  -> UserController.create
  -> UserService.createUser
  -> PasswordEncoder genera hash
  -> UserRepository.save
  -> PostgreSQL inserta registro
  -> UserResponse vuelve al frontend
```

---

## 20. Funcionamiento de Docker en el proyecto

Docker se usa para ejecutar PostgreSQL de forma simple.

No es la aplicacion completa. En desarrollo, Docker solo levanta la base de datos.

Ventajas:

- no instalar PostgreSQL manualmente;
- usar la misma version en todos los equipos;
- conservar datos con volumen;
- iniciar y detener la BD con comandos simples.

Comandos utiles:

```bash
docker compose up -d
docker compose ps
docker compose stop
docker compose down
```

Importante:

```text
docker compose down -v
```

borra tambien el volumen y por tanto elimina los datos guardados.

---

## 21. Funcionamiento de Electron

Electron permite ejecutar la aplicacion como programa de escritorio.

Su funcion principal es abrir una ventana nativa y cargar el frontend.

En desarrollo, normalmente Electron apunta al frontend levantado por Vite.

Por eso, para usar la app desktop, tambien deben estar levantados:

1. PostgreSQL.
2. Backend.
3. Frontend.
4. Electron.

Electron no calcula horarios, no guarda usuarios y no reemplaza la API. Solo envuelve la interfaz.

---

## 22. Que pasa cuando ocurre un error

Los errores pueden ocurrir en distintas capas.

### 22.1. Error de login

Posibles causas:

- usuario incorrecto;
- contrasena incorrecta;
- usuario desactivado;
- backend apagado;
- base de datos apagada.

### 22.2. Error 401

Significa que la peticion no esta autorizada.

Puede pasar si:

- no hay token;
- el token expiro;
- el token es invalido;
- el usuario cerro sesion;
- el backend rechazo la autenticacion.

El frontend debe cerrar sesion o redirigir al login.

### 22.3. Error 403

Significa que el usuario esta autenticado, pero no tiene permiso.

Ejemplo:

```text
Usuario USER intenta administrar cuentas
  -> backend responde 403
```

### 22.4. Error de conexion

Puede pasar si:

- el backend no esta en `localhost:8081`;
- el frontend apunta a una URL incorrecta;
- CORS bloquea la peticion;
- PostgreSQL no esta disponible.

---

## 23. Ejemplo completo: crear un usuario

Este flujo muestra como se conectan todas las piezas.

```text
1. Admin abre pantalla Usuarios.
2. Users.jsx pide GET /api/users.
3. api.js agrega Authorization Bearer.
4. UserController valida que sea ADMIN.
5. UserService obtiene lista.
6. UserRepository consulta PostgreSQL.
7. Frontend muestra tabla.
8. Admin llena formulario.
9. Users.jsx envia POST /api/users.
10. Backend valida username unico.
11. Backend hashea contrasena con BCrypt.
12. UserRepository guarda registro.
13. Backend devuelve usuario creado.
14. Frontend limpia formulario y refresca tabla.
```

---

## 24. Ejemplo completo: asignar docente a curso

```text
1. Usuario abre Docentes o Cursos.
2. Frontend carga docentes y cursos disponibles.
3. Usuario selecciona docente, curso y turno.
4. Frontend envia la asignacion al backend.
5. Backend revisa tipo de docente.
6. Backend revisa categoria del curso.
7. Backend valida ciclo y turno permitido.
8. Backend guarda CourseTeacherAssignment.
9. Frontend refresca docentes y cursos.
10. La futura propuesta de horario ya puede usar esa relacion.
```

---

## 25. Ejemplo completo: modificar horarios del dia

```text
1. Admin entra a Reglas.
2. Frontend carga GET /api/schedule-settings.
3. Se muestran los seis bloques actuales.
4. Admin cambia una hora.
5. Frontend actualiza visualmente los bloques.
6. Admin presiona Guardar.
7. Backend valida orden, continuidad y duraciones.
8. Backend guarda en schedule_block_settings.
9. La pantalla de Horarios usa esos nuevos rangos.
```

---

## 26. Ejemplo completo: generar horario

```text
1. Usuario entra a Horarios.
2. Frontend solicita la propuesta al backend.
3. Backend obtiene cursos.
4. Backend obtiene docentes asignados.
5. Backend obtiene ambientes.
6. Backend obtiene bloques horarios activos.
7. Backend aplica reglas por ciclo.
8. Backend evita conflictos de docente, ambiente y ciclo.
9. Backend devuelve una propuesta.
10. Frontend la muestra en matriz o vista por franjas.
```

---

## 27. Fuente de verdad del sistema

La fuente de verdad es PostgreSQL.

Esto significa:

- si el dato esta solo en pantalla, todavia no esta guardado;
- si el backend no confirma, no debe asumirse que se guardo;
- si se recarga la app, los datos deben venir de PostgreSQL;
- las pantallas deben refrescarse luego de cambios importantes.

El frontend muestra estado temporal, pero la persistencia real esta en la base de datos.

---

## 28. Resumen final del funcionamiento

Schedule funciona como una aplicacion academica por capas.

El usuario opera desde React o Electron. React llama al backend mediante `api.js`. El backend Spring Boot protege rutas con JWT, aplica reglas de negocio en servicios, usa repositorios JPA para comunicarse con PostgreSQL y devuelve respuestas JSON. PostgreSQL conserva usuarios, docentes, cursos, ambientes, reglas y relaciones.

La parte mas importante del sistema es la coordinacion entre datos academicos y reglas:

- los cursos tienen ciclos;
- los ciclos determinan turnos;
- los docentes tienen tipos;
- los tipos determinan cursos permitidos;
- los ambientes no deben cruzarse;
- los docentes no deben cruzarse;
- las comidas bloquean franjas no lectivas;
- la propuesta de horario depende de que los datos esten completos.

Por eso Schedule no es solo una interfaz visual. Es un sistema con flujo real de datos, autenticacion, persistencia, validaciones y separacion clara entre frontend, backend, base de datos y escritorio.


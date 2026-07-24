# Explicacion de como funciona Schedule

## Portada

**Proyecto:** Schedule Desktop App

**Documento:** Explicacion del funcionamiento del sistema

**Enfoque:** Presentacion clara para explicar que hace cada parte y como se conectan

**Tecnologias:** React, Vite, Spring Boot, PostgreSQL, Docker y Electron

---

## 1. Explicacion general

Schedule es una aplicacion para organizar informacion academica y apoyar la elaboracion de horarios.

El sistema permite registrar usuarios, docentes, cursos, ambientes, jefes de practica y reglas horarias. Con esa informacion, la aplicacion puede consultar, validar y construir propuestas de horario respetando condiciones academicas.

La idea principal es que el usuario no trabaje directamente con archivos ni con la base de datos. El usuario usa una interfaz visual. Esa interfaz se comunica con un backend, y el backend se encarga de guardar, validar y devolver la informacion.

En terminos simples:

```text
El usuario usa la pantalla.
La pantalla pide datos al backend.
El backend consulta o guarda en la base de datos.
La base de datos conserva la informacion.
El backend responde.
La pantalla muestra el resultado.
```

---

## 2. Partes principales del sistema

Schedule esta formado por cuatro partes importantes.

| Parte | Que es | Para que sirve |
|---|---|---|
| Frontend | Interfaz hecha con React | Permite que el usuario use el sistema visualmente |
| Backend | API hecha con Spring Boot | Procesa solicitudes, valida reglas y conecta con la base de datos |
| Base de datos | PostgreSQL | Guarda usuarios, docentes, cursos, ambientes, reglas y asignaciones |
| Desktop | Electron | Abre la aplicacion como programa de escritorio |

Estas partes trabajan juntas, pero cada una cumple una funcion distinta.

---

## 3. Como funciona cuando se abre la aplicacion

Para usar Schedule en desarrollo se levantan primero los servicios necesarios.

Primero se inicia PostgreSQL con Docker. PostgreSQL es donde se guardan los datos.

Luego se inicia el backend Spring Boot. El backend queda esperando peticiones en el puerto `8081`.

Despues se inicia el frontend React. El frontend muestra las pantallas del sistema.

Finalmente, si se quiere usar como aplicacion de escritorio, se inicia Electron. Electron abre una ventana y carga el frontend.

El orden normal es:

```text
1. PostgreSQL
2. Backend
3. Frontend
4. Electron
```

Si la base de datos no esta prendida, el backend no puede guardar ni consultar informacion. Si el backend no esta prendido, el frontend no puede iniciar sesion ni cargar datos.

---

## 4. Como funciona el inicio de sesion

Cuando el usuario abre la aplicacion, primero aparece la pantalla de login.

El usuario escribe su nombre de usuario y contrasena. La pantalla no decide por si sola si el usuario puede entrar. Envia esos datos al backend.

El backend revisa si el usuario existe en PostgreSQL y si la contrasena es correcta. Las contrasenas no se guardan en texto normal, sino como hash usando BCrypt.

Si todo es correcto, el backend genera un token JWT. Ese token funciona como una credencial temporal para que el usuario pueda usar las demas partes del sistema.

Flujo:

```text
Usuario escribe credenciales
  -> Frontend envia login
  -> Backend valida usuario y contrasena
  -> PostgreSQL confirma datos
  -> Backend genera token JWT
  -> Frontend guarda sesion
  -> Usuario entra al sistema
```

El usuario inicial es:

| Usuario | Contrasena | Rol |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |

---

## 5. Como funciona la seguridad

Schedule usa roles para controlar permisos.

Hay dos roles principales:

| Rol | Que puede hacer |
|---|---|
| `ADMIN` | Puede administrar usuarios y modificar reglas protegidas |
| `USER` | Puede usar funciones del sistema sin administrar cuentas |

Cuando el frontend hace una peticion protegida, envia el token JWT al backend.

```text
Authorization: Bearer <token>
```

El backend revisa ese token. Si es valido, permite la operacion. Si no es valido, responde con error.

Esto evita que cualquier persona pueda entrar directamente a rutas internas del sistema.

---

## 6. Como viajan los datos

Los datos viajan principalmente en formato JSON.

Ejemplo: cuando se crea un docente, el frontend envia informacion como nombre, tipo de docente y otros campos. El backend recibe esos datos, los valida y los guarda.

Flujo general:

```text
Pantalla React
  -> api.js
  -> Backend REST
  -> Servicio de negocio
  -> Repositorio JPA
  -> PostgreSQL
```

Luego la respuesta regresa:

```text
PostgreSQL
  -> Repositorio
  -> Servicio
  -> Controller
  -> JSON
  -> Frontend
  -> Pantalla actualizada
```

El archivo `frontend/src/lib/api.js` es importante porque centraliza las llamadas al backend. Asi las pantallas no repiten la misma logica de conexion.

---

## 7. Como se guardan los datos

Los datos se guardan en PostgreSQL.

El frontend no guarda informacion definitiva. Puede tener datos temporales en pantalla, pero la fuente real es la base de datos.

Ejemplo:

```text
Si se crea un curso y el backend confirma el guardado,
entonces el curso queda registrado en PostgreSQL.

Si solo se escribe en el formulario pero no se guarda,
el dato aun no existe realmente en el sistema.
```

Esto es importante porque permite cerrar y volver a abrir la aplicacion sin perder la informacion.

---

## 8. Como funciona la gestion de usuarios

La pantalla de usuarios permite que un administrador cree, edite o desactive cuentas.

Cuando se crea un usuario:

```text
1. El admin llena el formulario.
2. El frontend envia los datos al backend.
3. El backend valida que el username no exista.
4. El backend convierte la contrasena en hash.
5. El backend guarda el usuario en PostgreSQL.
6. El frontend actualiza la tabla de usuarios.
```

El sistema no deberia guardar contrasenas en texto plano. Por seguridad, guarda un hash.

---

## 9. Como funciona la gestion de docentes

Los docentes se registran con un tipo.

Tipos principales:

| Tipo | Explicacion |
|---|---|
| `NOMBRADO` | Docente estable de la escuela |
| `CONTRATADO` | Docente que cubre cursos pendientes |
| `ESTUDIOS_GENERALES` | Docente para cursos de estudios generales |

El tipo de docente es importante porque no todos pueden dictar cualquier curso.

Regla principal:

```text
Nombrados y contratados -> cursos de carrera.
Estudios generales -> cursos de estudios generales.
```

Cuando se asigna un docente a un curso, el backend revisa si esa relacion es valida.

---

## 10. Como funciona la gestion de cursos

Los cursos pertenecen al plan de estudios.

Cada curso tiene datos como:

- nombre;
- codigo;
- ciclo;
- categoria;
- horas;
- creditos;
- docentes asignados;
- turnos permitidos.

El ciclo del curso ayuda a decidir donde puede ubicarse en el horario.

Regla:

| Ciclos | Turno permitido |
|---|---|
| I a VIII | Manana y tarde |
| IX y X | Noche |

Por ejemplo, un curso de ciclo IX no deberia programarse en la manana.

---

## 11. Como funciona la gestion de ambientes

Los ambientes son los espacios fisicos donde se dictan clases.

Pueden ser:

- aulas;
- laboratorios;
- salas;
- otros espacios academicos.

El sistema debe evitar que un ambiente sea usado por dos cursos al mismo tiempo.

Ejemplo de conflicto:

```text
Aula 101 - Lunes 08:00 a 10:00 - Curso A
Aula 101 - Lunes 09:00 a 11:00 - Curso B
```

Ese caso no debe permitirse porque se cruzan en el mismo ambiente.

---

## 12. Como funcionan las reglas horarias

Schedule divide el dia academico en seis bloques.

| Bloque | Tipo | Funcion |
|---|---|---|
| Desayuno | No lectivo | Pausa |
| Manana | Lectivo | Clases |
| Almuerzo | No lectivo | Pausa |
| Tarde | Lectivo | Clases |
| Cena | No lectivo | Pausa |
| Noche | Lectivo | Clases |

Los bloques no lectivos no deben tener clases.

Los bloques lectivos son los que se usan para ubicar cursos.

La pantalla de reglas permite modificar los horarios del dia academico. Cuando se guarda, el backend valida que no haya huecos, solapes ni horarios invalidos.

---

## 13. Como funciona la asignacion docente-curso

Una asignacion docente-curso indica que un docente dicta un curso en un turno determinado.

Ejemplo:

```text
Docente: Juan Perez
Curso: Base de Datos
Turno: Manana
```

Esa relacion se guarda para que luego el horario pueda saber:

- que docente dicta el curso;
- en que turno debe ubicarse;
- si el docente ya esta ocupado;
- si el curso ya esta cubierto.

La asignacion conecta dos pantallas: docentes y cursos. Si se cambia desde una pantalla, la otra debe actualizarse para mostrar la informacion correcta.

---

## 14. Como funciona la generacion de horarios

La generacion de horarios depende de datos previos.

Antes de generar una propuesta, el sistema necesita:

- cursos registrados;
- docentes registrados;
- docentes asignados a cursos;
- ambientes disponibles;
- reglas horarias configuradas;
- turnos permitidos por ciclo.

Con esa informacion, el backend intenta construir una propuesta evitando conflictos.

El flujo es:

```text
Usuario abre Horarios
  -> Frontend pide una propuesta
  -> Backend consulta cursos, docentes, ambientes y reglas
  -> Backend aplica restricciones
  -> Backend genera resultado
  -> Frontend muestra el horario
```

La propuesta debe evitar:

- docente duplicado en la misma hora;
- ambiente duplicado en la misma hora;
- dos cursos del mismo ciclo al mismo tiempo;
- cursos en bloques de comida;
- cursos fuera del turno permitido.

---

## 15. Como funciona Docker en este proyecto

Docker se usa para levantar PostgreSQL facilmente.

No significa que toda la aplicacion este dentro de Docker. En este proyecto, Docker se usa principalmente para la base de datos.

Ventaja:

```text
No es necesario instalar PostgreSQL manualmente.
Docker levanta la base de datos con la configuracion ya definida.
```

El comando principal es:

```bash
docker compose up -d
```

Los datos se guardan en un volumen. Por eso no se pierden al apagar el contenedor.

---

## 16. Como funciona Electron

Electron permite que la aplicacion se vea como un programa de escritorio.

Electron abre una ventana y carga el frontend.

Pero Electron no es el backend y no es la base de datos.

Funcion real de Electron:

```text
Abrir una ventana de escritorio
  -> cargar el frontend
  -> permitir usar la app como programa local
```

Para que Electron funcione bien en desarrollo, tambien deben estar funcionando PostgreSQL, backend y frontend.

---

## 17. Ejemplo completo explicado

Supongamos que el administrador quiere crear un curso y luego verlo en la lista.

Paso a paso:

```text
1. El administrador inicia sesion.
2. El backend valida su usuario.
3. El frontend guarda el token.
4. El administrador entra a Cursos.
5. El frontend pide la lista de cursos.
6. El backend consulta PostgreSQL.
7. La pantalla muestra los cursos existentes.
8. El administrador llena el formulario de nuevo curso.
9. El frontend envia el curso al backend.
10. El backend valida los datos.
11. El backend guarda el curso en PostgreSQL.
12. El backend responde que se guardo correctamente.
13. El frontend refresca la lista.
14. El nuevo curso aparece en pantalla.
```

Este mismo patron se repite en usuarios, docentes, ambientes y otras entidades.

---

## 18. Explicacion final para exposicion

Schedule funciona como una aplicacion academica completa porque separa responsabilidades.

El frontend se encarga de la experiencia visual. El backend se encarga de la logica, seguridad y validaciones. PostgreSQL guarda los datos. Docker facilita levantar la base de datos. Electron permite abrir la aplicacion como escritorio.

La comunicacion entre partes permite que el sistema no sea solo una maqueta. Cada accion importante pasa por el backend y queda registrada en la base de datos.

La parte central del proyecto es la aplicacion de reglas academicas: los cursos dependen de ciclos, los ciclos dependen de turnos, los docentes dependen de tipos, los ambientes no deben cruzarse y los horarios deben respetar bloques lectivos y no lectivos.

Por eso, Schedule ayuda a organizar la programacion academica de forma mas controlada, evitando errores comunes y manteniendo la informacion centralizada.


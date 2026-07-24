# Guia detallada para agentes en Schedule

## Proposito del documento

Este documento explica con detalle como debe trabajar un agente dentro del proyecto `Schedule`.
Su objetivo principal es mantener el trabajo ordenado, reducir el uso innecesario de tokens y evitar cambios fuera del alcance pedido por el usuario.

La regla general es simple: entender primero, tocar poco, responder breve y verificar solo cuando sea necesario o cuando el usuario lo autorice.

---

## Contexto general del proyecto

`Schedule` es una aplicacion compuesta por tres partes principales:

| Ruta | Funcion | Tecnologia principal |
|------|---------|----------------------|
| `backend/` | API y logica del servidor | Spring Boot + Maven |
| `frontend/` | Interfaz de usuario web | React + Vite |
| `desktop/` | Contenedor de escritorio | Electron |
| `docs/` | Documentacion funcional y tecnica | Markdown / PDF |
| `docker-compose.yml` | Servicios locales de apoyo | Docker Compose |

El agente no debe asumir que un cambio en una parte requiere tocar las demas. Primero debe identificar el area afectada y limitarse a ella.

---

## Backend

El backend esta ubicado en:

```text
backend/
```

La aplicacion Java se encuentra principalmente en:

```text
backend/src/main/java/com/example/schedule
```

Este modulo usa Spring Boot y Maven. Por eso, los cambios comunes del backend pueden involucrar:

- controladores REST;
- servicios;
- repositorios;
- entidades;
- DTOs;
- configuracion de seguridad;
- configuracion de persistencia;
- pruebas Java, si existen o si el cambio lo requiere.

### Reglas para tocar backend

Antes de editar backend, el agente debe:

1. Buscar el controlador, servicio, entidad o repositorio relacionado.
2. Leer solo los archivos necesarios.
3. Mantener el estilo existente.
4. Evitar agregar dependencias Maven sin permiso explicito.
5. No ejecutar `mvn`, builds o pruebas completas sin autorizacion del usuario.

Ejemplo de busqueda recomendada:

```bash
rg "Teacher|Docente|Course|Curso" backend/src/main/java
```

---

## Frontend

El frontend esta ubicado en:

```text
frontend/
```

El codigo fuente esta principalmente en:

```text
frontend/src/
```

Este modulo usa React con Vite. Los cambios comunes pueden involucrar:

- componentes;
- vistas;
- hooks;
- servicios de API;
- estilos;
- estados locales;
- validaciones de formularios;
- tablas, filtros y modales.

### Reglas para tocar frontend

Antes de editar frontend, el agente debe:

1. Ubicar el componente exacto o la vista relacionada.
2. Revisar como se manejan actualmente estados, props y llamadas a API.
3. Editar solo el bloque necesario.
4. Evitar redisenos completos si el usuario pidio un ajuste puntual.
5. No ejecutar `npm install`, `pnpm install` ni agregar paquetes sin permiso.

Ejemplo de busqueda recomendada:

```bash
rg "Teachers|Docentes|Cursos|Schedule" frontend/src
```

---

## Desktop

El wrapper de escritorio esta ubicado en:

```text
desktop/
```

Este modulo contiene la integracion Electron para ejecutar la aplicacion como app de escritorio.

### Reglas para tocar desktop

El agente debe tocar `desktop/` solo cuando el pedido este relacionado con:

- arranque de Electron;
- empaquetado;
- ventana principal;
- rutas hacia el frontend construido;
- configuracion especifica de escritorio.

No se debe modificar Electron para resolver errores que pertenecen claramente al frontend o al backend.

---

## Documentacion

La documentacion del proyecto vive en:

```text
docs/
```

Antes de crear documentacion nueva, el agente debe revisar si ya existe un archivo relacionado. Si existe, debe preferir ampliar ese archivo antes que crear duplicados.

Excepciones razonables para crear un archivo nuevo:

- el tema es suficientemente grande;
- el documento existente debe mantenerse corto;
- el nuevo documento funciona como guia especifica;
- el usuario pide expresamente un documento detallado.

---

## Idioma y estilo de respuesta

El agente debe responder siempre en espanol.

Excepciones permitidas:

- nombres de archivos;
- rutas;
- comandos;
- nombres de librerias;
- errores exactos;
- identificadores de codigo;
- texto que debe coincidir literalmente con una API o configuracion.

La respuesta debe ser breve y directa. Si el usuario pide una accion concreta, se debe responder con el resultado de la accion, no con una explicacion extensa.

Ejemplo correcto:

```text
Editado `frontend/src/components/TeacherCard.jsx`.
Cambie la validacion del filtro por nombre y mantuve el resto igual.
No ejecute build porque no lo pediste.
```

Ejemplo a evitar:

```text
Voy a explicarte toda la arquitectura del frontend, como funciona React, por que existe el filtro y varias alternativas...
```

---

## Economia de tokens

La economia de tokens es una regla central del proyecto.

El agente debe evitar:

- repetir la estructura del repositorio en cada respuesta;
- leer archivos completos cuando basta con un fragmento;
- abrir muchos archivos sin una razon concreta;
- explicar de nuevo contexto ya conocido;
- generar respuestas largas para cambios pequenos;
- mostrar diffs enormes si solo se modifico una linea;
- ejecutar comandos costosos o innecesarios.

El documento complementario es:

```text
docs/ECONOMIA-TOKENS.md
```

---

## Flujo de trabajo recomendado

Para cualquier cambio de codigo, el agente debe seguir este flujo:

1. Entender el pedido.
2. Identificar el area afectada.
3. Buscar archivos relevantes con `rg`, `grep` o `find`.
4. Leer solo los archivos necesarios.
5. Aplicar un patch pequeno.
6. Verificar de forma proporcional al riesgo.
7. Responder con archivos editados y resumen corto.

Este flujo evita trabajo innecesario y reduce el riesgo de tocar areas no relacionadas.

---

## Busqueda antes de lectura

El agente no debe abrir archivos al azar. Primero debe buscar.

Comandos recomendados:

```bash
rg "texto-o-simbolo" ruta/
rg --files
find . -name "archivo"
```

Ejemplos:

```bash
rg "login" frontend/src
rg "UserController" backend/src/main/java
rg "docker" docs
```

Una vez ubicado el archivo, se debe leer solo el bloque necesario.

---

## Lectura limitada de archivos

Cuando un archivo es grande, el agente debe leer fragmentos concretos.

Ejemplo:

```bash
sed -n '1,180p' frontend/src/pages/Users.jsx
```

Si se necesita otro bloque, se lee otro rango. Esto es preferible a cargar archivos enormes completos.

---

## Edicion con patches pequenos

Los cambios deben hacerse con patches puntuales.

Buenas practicas:

- editar solo las lineas necesarias;
- conservar nombres y patrones existentes;
- no reordenar imports sin necesidad;
- no reformatear archivos completos;
- no mezclar refactors con fixes;
- no cambiar comportamiento no solicitado.

Un patch pequeno facilita revisar el cambio y reduce errores.

---

## Uso de dependencias

No se deben agregar dependencias nuevas sin permiso explicito del usuario.

Esto aplica a:

- `package.json`;
- `pom.xml`;
- lockfiles;
- plugins;
- librerias de UI;
- librerias de fechas;
- librerias de validacion;
- herramientas de build.

Si una dependencia parece util, el agente debe explicar brevemente por que seria necesaria y pedir autorizacion antes de instalarla o modificar archivos de dependencias.

---

## Comandos que requieren permiso

El agente no debe ejecutar sin permiso:

```bash
npm install
pnpm install
mvn
mvn test
mvn spring-boot:run
npm run build
pnpm build
```

Tambien debe evitar comandos que:

- descarguen paquetes;
- modifiquen lockfiles;
- inicien procesos pesados;
- cambien el estado global del sistema;
- borren archivos;
- reescriban configuraciones.

Si el usuario pide explicitamente ejecutar alguno de estos comandos, entonces se puede hacer.

---

## Verificacion

La verificacion debe ser proporcional al cambio.

Para un cambio pequeno de texto o documentacion:

- revisar el archivo editado;
- confirmar que el formato Markdown sea razonable.

Para un cambio de frontend:

- revisar que no haya errores obvios de sintaxis;
- si el usuario lo autoriza, ejecutar pruebas, lint o build.

Para un cambio de backend:

- revisar imports, tipos y firmas;
- si el usuario lo autoriza, ejecutar pruebas Maven o arranque local.

Si no se ejecutan pruebas o builds, se debe decir claramente:

```text
No ejecute build ni tests porque no lo pediste.
```

---

## Alcance de los cambios

El agente debe corregir solo el area concreta solicitada.

Ejemplo:

Pedido:

```text
Arregla el filtro de docentes por nombre.
```

Alcance correcto:

- buscar el componente o servicio del filtro;
- corregir la condicion de filtrado;
- no redisenar la pantalla;
- no cambiar la API si no es necesario;
- no tocar cursos, usuarios o Docker.

Alcance incorrecto:

- refactorizar toda la vista;
- cambiar estilos globales;
- agregar una libreria de busqueda;
- modificar backend sin evidencia de que el bug venga de ahi.

---

## Respuestas despues de cambios

Cuando se modifica codigo o documentacion, la respuesta final debe incluir:

- archivos editados;
- resumen corto del cambio;
- verificacion realizada o no realizada.

Formato recomendado:

```text
Editado:
- `docs/GUIA-DETALLADA-AGENTES.md`

Resumen:
- Agregue una guia detallada de operacion para agentes en el proyecto.

Verificacion:
- Revise el Markdown generado. No ejecute builds porque solo fue documentacion.
```

---

## Manejo de cambios existentes

Si el repositorio tiene cambios previos, el agente no debe revertirlos.

Reglas:

- no usar `git reset --hard`;
- no usar `git checkout --` para deshacer archivos ajenos;
- no borrar cambios no relacionados;
- trabajar alrededor de cambios existentes;
- preguntar solo si esos cambios bloquean la tarea.

El agente debe asumir que los cambios existentes pueden pertenecer al usuario.

---

## Cuando pedir aclaracion

El agente debe evitar preguntas innecesarias. Si hay una interpretacion razonable y segura, debe avanzar.

Debe pedir aclaracion solo cuando:

- el pedido sea ambiguo y pueda causar cambios grandes;
- haya varias areas posibles con consecuencias distintas;
- se requiera borrar o reemplazar informacion;
- se necesite instalar dependencias;
- se necesite ejecutar comandos pesados;
- falte un dato indispensable.

Ejemplo donde no hace falta preguntar:

```text
Haz un documento detallado de estas reglas.
```

Interpretacion razonable:

- crear un documento en `docs/`;
- basarse en `AGENTS.md` y `docs/ECONOMIA-TOKENS.md`;
- no tocar codigo.

---

## Ejemplos de peticiones eficientes

Peticiones recomendadas:

```text
En `frontend/src/pages/Users.jsx`, cambia el texto del boton "Crear" por "Guardar".
```

```text
Corrige el endpoint de usuarios en backend. Solo backend, sin tocar frontend.
```

```text
Actualiza `docs/GUIA-DOCKER.md` con pasos para Windows.
```

```text
Solo dime que archivo tendria que tocar, no edites nada.
```

Peticiones menos eficientes:

```text
Revisa todo y arreglalo.
```

```text
Mejora el sistema.
```

```text
Hazlo mas bonito.
```

Estas ultimas obligan al agente a explorar mas contexto, gastar mas tokens y tomar mas decisiones ambiguas.

---

## Ejemplos de respuestas eficientes

### Cambio pequeno

```text
Editado `frontend/src/pages/Users.jsx`.
Cambie el texto del boton principal de "Crear" a "Guardar".
No ejecute build porque fue un cambio de texto.
```

### Cambio con verificacion

```text
Editado `backend/src/main/java/com/example/schedule/user/UserService.java`.
Corregi la validacion para no permitir usernames repetidos.
Verificacion: revise el flujo del servicio; no ejecute `mvn test` porque no lo pediste.
```

### Solo analisis

```text
El archivo mas probable es `frontend/src/pages/Teachers.jsx`.
El filtro parece resolverse en el estado local de esa vista, no en backend.
```

---

## Relacion entre documentos

`AGENTS.md` debe mantenerse corto porque funciona como instruccion principal del agente.

`docs/ECONOMIA-TOKENS.md` explica la estrategia de ahorro de tokens.

`docs/GUIA-DETALLADA-AGENTES.md` amplifica ambas cosas y sirve como referencia extensa para entender el modo de trabajo recomendado.

---

## Checklist operativo del agente

Antes de editar:

- identificar el area exacta;
- buscar con `rg` o equivalente;
- leer solo lo necesario;
- confirmar si el cambio requiere permiso adicional.

Durante la edicion:

- aplicar patch pequeno;
- mantener estilo existente;
- evitar dependencias nuevas;
- no reformatear sin necesidad.

Despues de editar:

- revisar el archivo modificado;
- ejecutar solo verificaciones autorizadas;
- responder en espanol;
- listar archivos editados;
- resumir en pocas lineas.

---

## Regla final

El mejor agente para este proyecto no es el que hace mas cambios, sino el que resuelve exactamente lo pedido con el menor impacto posible.


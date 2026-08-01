# 🎬 Catflix - Películas y Actores

## 📖 Introducción

**Catflix** es una aplicación web desarrollada como ejercicio práctico para modelar **relaciones N-N (muchos a muchos)** con **Sequelize** sobre **PostgreSQL**. La aplicación permite gestionar un catálogo de **películas** y **actores**, donde cada película puede tener múltiples actores y cada actor puede participar en múltiples películas, mediante una **tabla intermedia** (`peliculas_actores`).

El proyecto combina un **backend** en Node.js + Express + Sequelize con un **frontend** moderno estilo Netflix, e integra la **API de TMDB** para buscar automáticamente imágenes de películas, fotos de actores y fechas de nacimiento, evitando la carga manual de datos.

---

## 🚀 Instalación y ejecución

### Requisitos previos
- **Node.js 18+**
- **npm**
- Conexión a Internet (la base de datos está en la nube - Neon PostgreSQL)

### Pasos para ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start
```

El servidor se iniciará en: **http://localhost:3000**

> ⚠️ **Importante:** El archivo `.env` debe existir en la raíz del proyecto con las credenciales de conexión (ver sección siguiente).

---

## 🗄️ Credenciales / Base de datos

La base de datos está alojada en **Neon (PostgreSQL cloud)**. Las credenciales se encuentran en el archivo `.env`:

```
DATABASE_URL=postgresql://neondb_owner:npg_ndOYL1Cio5uN@ep-billowing-bar-aya9ghas-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
TMDB_API_KEY=814764cd92bb67755a2eafc68ef94d2f
TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MTQ3NjRjZDkyYmI2Nzc1NWEyZWFmYzY4ZWY5NGQyZiIsIm5iZiI6MTc4NTUzODM5NS4yMDk5OTk4LCJzdWIiOiI2YTZkMjc1YjA4MmQ1MDllODNkNWRlZWYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.soby45HkJwF5LZzDh1ikVgkl4In2vGsJ2sbbWZu1PWw
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (Neon) |
| `PORT` | Puerto del servidor (3000) |
| `TMDB_API_KEY` | API Key de The Movie Database |
| `TMDB_ACCESS_TOKEN` | Token de acceso a la API de TMDB |

> La conexión a la base de datos remota se establece automáticamente al iniciar el servidor. Las tablas se sincronizan con `sequelize.sync({ alter: true })`.

---

## 📚 Estructura del proyecto

```
peliculas-y-actores/
├── server.js                  # Servidor Express + Sequelize (modelos, rutas, API)
├── seed.js                    # Script para poblar la base de datos con datos de ejemplo
├── limpiar-duplicados.js      # Script de mantenimiento (elimina registros duplicados)
├── tmdb-imagenes.js           # Utilidades para la API de TMDB
├── package.json               # Dependencias del proyecto
├── .env                       # Variables de entorno (DB URL, puerto, TMDB)
├── README.md                  # Este archivo
├── public/
│   ├── app.js                 # JavaScript del frontend (fetch, render, formularios)
│   ├── styles.css             # Estilos oscuros estilo Netflix
│   └── images/
│       └── CATFLIX.png        # Logo de la aplicación
└── views/
    ├── home.hbs               # Página principal (catálogo + formularios)
    ├── layouts/
    │   └── main.hbs           # Layout principal de Handlebars
    └── partials/
        ├── navbar.hbs         # Barra de navegación
        └── footer.hbs         # Pie de página
```

---

## 🧠 Modelos y relaciones (N-N)

### Película
| Campo   | Tipo         | Descripción                |
|---------|--------------|----------------------------|
| id      | INTEGER (PK) | Identificador único        |
| titulo  | STRING(150)  | Título de la película      |
| anio    | INTEGER      | Año de estreno             |
| imagen  | STRING(500)  | URL de la imagen (opcional)|

### Actor
| Campo            | Tipo         | Descripción                    |
|------------------|--------------|--------------------------------|
| id               | INTEGER (PK) | Identificador único            |
| nombre           | STRING(120)  | Nombre del actor               |
| fecha_nacimiento | DATEONLY     | Fecha de nacimiento            |
| imagen           | STRING(500)  | URL de la foto (opcional)      |
| signo_zodiacal   | STRING(30)   | Signo zodiacal (opcional)      |

### Relación N-N
- **Tabla intermedia**: `peliculas_actores`
- **Asociación**: `belongsToMany` entre Pelicula y Actor
- **Foreign keys**: `pelicula_id`, `actor_id`

```javascript
Pelicula.belongsToMany(Actor, {
  through: PeliculasActores,
  foreignKey: 'pelicula_id',
  otherKey: 'actor_id'
});

Actor.belongsToMany(Pelicula, {
  through: PeliculasActores,
  foreignKey: 'actor_id',
  otherKey: 'pelicula_id'
});
```

---

## 🔌 API Endpoints

### `GET /peliculas`
Lista todas las películas con sus actores asociados. Soporta `?search=` para filtrar por título.

```json
[
  {
    "id": 1,
    "titulo": "Matrix",
    "anio": 1999,
    "imagen": "https://...",
    "Actors": [
      { "id": 1, "nombre": "Keanu Reeves", "fecha_nacimiento": "1964-09-02", "signo_zodiacal": "Virgo ♍", "imagen": "https://..." }
    ]
  }
]
```

### `POST /peliculas`
Crea una nueva película. Opcionalmente asigna actores por IDs. Busca automáticamente la imagen y el reparto en TMDB.

```json
{ "titulo": "Nueva Película", "anio": 2024, "actores_ids": [1, 2] }
```

### `GET /actores`
Lista todos los actores con sus películas asociadas. Soporta `?search=` para filtrar por nombre.

### `POST /actores`
Crea un nuevo actor. Busca automáticamente la imagen y la fecha de nacimiento en TMDB.

```json
{ "nombre": "Nuevo Actor" }
```

### `PATCH /peliculas/:id` y `PATCH /actores/:id`
Actualiza los datos de una película o actor existente.

### `DELETE /peliculas/:id`
Elimina una película y sus asignaciones en la tabla intermedia.

### `POST /asignar-actor`
Asigna un actor a una película usando **transacción** de Sequelize.

```json
{ "pelicula_id": 1, "actor_id": 1 }
```

> La transacción garantiza que la asignación y cualquier operación relacionada se confirmen o reviertan juntas.

---

## ✅ Síntesis de los puntos cumplidos en la entrega

### 1. Modelos y relaciones
- ✅ Modelo **Película**: `id`, `titulo`, `anio`
- ✅ Modelo **Actor**: `id`, `nombre`, `fecha_nacimiento`
- ✅ Relación **N-N** mediante tabla intermedia `peliculas_actores`
- ✅ Asociaciones `belongsToMany` con foreign keys `pelicula_id` y `actor_id`
- ✅ Nombres de tablas y columnas en **snake_case** (`peliculas`, `actores`, `peliculas_actores`)

### 2. API Backend (Express + Sequelize)
- ✅ `GET /peliculas` → lista todas las películas con sus actores (`include`)
- ✅ `POST /peliculas` → crea una película (opcional: asignar actores por `actores_ids`)
- ✅ `GET /actores` → lista todos los actores con sus películas (`include`)
- ✅ `POST /actores` → crea un actor
- ✅ `POST /asignar-actor` → asigna un actor a una película usando **transacción** (`sequelize.transaction`)
- ✅ `express.json()` para parsear JSON
- ✅ Sincronización automática de tablas con `sequelize.sync()`

### 3. Frontend (HTML + JS)
- ✅ Página con **lista de películas y actores** (tarjetas estilo Netflix)
- ✅ **Formulario para crear película** (envía a `POST /peliculas`)
- ✅ **Formulario para crear actor** (envía a `POST /actores`)
- ✅ **Formulario para asignar actor a película** (envía a `POST /asignar-actor`)
- ✅ Comunicación mediante **`fetch()`** a la API

### 4. Forma de entrega
- ✅ Backend (Express + Sequelize) y Frontend (HTML/JS) en un solo proyecto
- ✅ Archivo de instrucciones para ejecutar (`npm install`, `npm start`) y credenciales/DB de conexión (este README)
- 📸 Pantallazos: se pueden tomar desde la aplicación en `http://localhost:3000` o con los comandos `curl` de la sección de evidencias

---

## ✨ Mejoras añadidas a la página web

Además de los requisitos base de la entrega, se implementaron las siguientes mejoras:

### 🎯 Integración con API de TMDB
- **Búsqueda automática de imágenes de películas** al crearlas (backdrop cinematográfico)
- **Búsqueda automática de fotos de actores** y **fechas de nacimiento** al agregarlos
- **Asignación automática del reparto principal** (hasta 10 actores) al crear una película
- **Cálculo automático del signo zodiacal** según la fecha de nacimiento

### 🖥️ Interfaz de usuario mejorada
- **Diseño estilo Netflix** con tarjetas tipo masonry (ladrillo) de tamaños variados
- **Modal de detalle** con reparto clickeable y filmografía del actor
- **Búsqueda en tiempo real** con debounce (300ms) y botón de limpiar
- **Navegación entre vistas** de Películas 🎬 y Actores 🎭

### ⚡ Experiencia de usuario (UX)
- **Spinner de carga** con mensaje "Cargando película/actor..." mientras se procesa
- **Mensaje de éxito** visible por 15 segundos al agregar contenido
- **Auto-scroll** al producto recién agregado
- **Resplandor rojo pulsante** por 15 segundos para identificar fácilmente el nuevo producto

### 🗑️ Gestión de datos
- **Botón de eliminar película** con confirmación
- **Prevención de duplicados**: al intentar agregar una película o actor que ya existe, se reutiliza el registro existente
- **Script de limpieza** (`limpiar-duplicados.js`) para consolidar registros duplicados en la base de datos

---

## 🎬 Datos de ejemplo (seed)

Para poblar la base de datos con películas, actores y signos zodiacales:

```bash
node seed.js
```

Esto agregará **10 películas** y **48 actores** con sus signos zodiacales:

| Película | Año | Actores destacados |
|----------|-----|-------------------|
| Matrix | 1999 | Keanu Reeves, Carrie-Anne Moss, Laurence Fishburne, Hugo Weaving |
| John Wick | 2014 | *(sin actores asignados)* |
| El club de la pelea | 1999 | Brad Pitt, Edward Norton, Helena Bonham Carter |
| Inception | 2010 | Leonardo DiCaprio, Joseph Gordon-Levitt, Tom Hardy, Elliot Page, Cillian Murphy |
| Interestelar | 2014 | Matthew McConaughey, Anne Hathaway, Jessica Chastain, Matt Damon |
| Inocencia interrumpida | 1999 | Winona Ryder, Angelina Jolie, Brittany Murphy, Elisabeth Moss |
| ¿Dónde están las rubias? | 2004 | Shawn Wayans, Marlon Wayans, Jaime King |
| Bastardos sin gloria | 2009 | Brad Pitt, Christoph Waltz, Mélanie Laurent, Michael Fassbender, Diane Kruger |
| El Camino | 2019 | Aaron Paul, Jesse Plemons, Bryan Cranston |
| Pobres criaturas | 2023 | Emma Stone, Mark Ruffalo, Willem Dafoe |

---

## 🖥️ Frontend

La interfaz tipo Netflix incluye:

1. **Barra de navegación** - Cambia entre vista de Películas 🎬 y Actores 🎭
2. **Catálogo** - Tarjetas con diseño tipo Netflix, imágenes y metadatos
3. **Modal de detalle** - Al hacer clic en una tarjeta muestra información completa
4. **Búsqueda en tiempo real** - Filtro por título o nombre con debounce
5. **Formularios desplegables**:
   - **Nueva Película** - Crear película con título y año (imagen y reparto automáticos desde TMDB)
   - **Nuevo Actor** - Crear actor con nombre (imagen y fecha automáticas desde TMDB)
   - **Asignar Actor** - Seleccionar película y actor para vincularlos
6. **Signo zodiacal** - Cada actor muestra su signo zodiacal en la tarjeta y detalle
7. **Eliminar películas** - Botón ✕ en cada tarjeta con confirmación

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución |
| Express | ^5.2.1 | Framework web |
| Sequelize | ^6.37.8 | ORM para PostgreSQL |
| Express-Handlebars | ^9.0.1 | Motor de plantillas |
| PostgreSQL (Neon) | - | Base de datos cloud |
| pg | ^8.22.0 | Cliente de PostgreSQL |
| dotenv | ^17.4.2 | Variables de entorno |
| TMDB API | - | Imágenes, reparto y datos de actores |

---

## 📸 Evidencias para la entrega

### 1. Listado de películas con actores (GET /peliculas)
```
http://localhost:3000
```
O desde terminal:
```bash
curl http://localhost:3000/peliculas | python3 -m json.tool
```

### 2. Creación de película (POST /peliculas)
Usar el formulario "Nueva película" en la página, o desde terminal:
```bash
curl -X POST http://localhost:3000/peliculas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Mi Película","anio":2024}'
```

### 3. Creación de actor (POST /actores)
Usar el formulario "Nuevo actor" en la página, o desde terminal:
```bash
curl -X POST http://localhost:3000/actores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mi Actor"}'
```

### 4. Asignación exitosa de actor a película (POST /asignar-actor)
Usar el formulario "Asignar actor" en la página, o desde terminal:
```bash
curl -X POST http://localhost:3000/asignar-actor \
  -H "Content-Type: application/json" \
  -d '{"pelicula_id":1,"actor_id":1}'
```

---

## 📝 Notas importantes

- Las tablas se sincronizan automáticamente al iniciar el servidor (`sequelize.sync()`)
- La asignación de actor a película utiliza `sequelize.transaction()` para garantizar integridad
- Los nombres de tablas y columnas están en **snake_case** según lo solicitado
- La búsqueda es **case-insensitive** (no distingue mayúsculas/minúsculas)
- El signo zodiacal se calcula automáticamente según la fecha de nacimiento
- La API de TMDB se usa para buscar imágenes y datos automáticamente (requiere conexión a Internet)

---

## 🎓 Conclusión y aprendizaje

Este ejercicio práctico permitió consolidar conceptos fundamentales del desarrollo web full-stack:

### Relaciones N-N con Sequelize
Aprendimos a modelar relaciones **muchos a muchos** mediante una **tabla intermedia** (`peliculas_actores`), configurando correctamente las asociaciones `belongsToMany` con sus foreign keys (`pelicula_id`, `actor_id`) y consultando los datos relacionados con `include`.

### Transacciones en bases de datos
Implementamos la asignación de actores a películas usando **`sequelize.transaction()`**, garantizando que la creación del vínculo y cualquier operación relacionada se confirmen o reviertan juntas, manteniendo la **integridad de los datos**.

### Arquitectura cliente-servidor
Comprendimos la separación de responsabilidades entre el **backend** (Express + Sequelize, API REST) y el **frontend** (HTML + JS con `fetch()`), comunicándose mediante JSON.

### Integración con APIs externas
Aprendimos a integrar **TMDB API** para enriquecer la aplicación con datos reales: imágenes de películas, fotos de actores, fechas de nacimiento y reparto automático, mejorando significativamente la experiencia del usuario.

### Experiencia de usuario (UX)
Implementamos mejoras como spinners de carga, mensajes de éxito, auto-scroll, resaltado visual y prevención de duplicados, entendiendo que una buena aplicación no solo funciona bien, sino que también **comunica claramente** lo que está sucediendo al usuario.

### Gestión de datos y mantenimiento
Desarrollamos scripts de mantenimiento (seed y limpieza de duplicados) y aprendimos a prevenir inconsistencias en la base de datos, como registros duplicados que afectan la visualización de las relaciones N-N.

En resumen, este proyecto integra **modelado de datos relacional**, **ORM**, **API REST**, **transacciones**, **frontend interactivo** e **integración con servicios externos**, cubriendo el ciclo completo de desarrollo de una aplicación web moderna.
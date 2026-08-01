



# Le cargue una API de TMDB para no tener que buscar todas las imágenes una por una.



=================================
# SERVER.JS - APP.JS - SEED.JS
=================================


Los 3 archivos `.js` tienen __roles completamente diferentes__ porque trabajan en __capas distintas__ de la aplicación:

---

## 📁 __server.js__ → Backend (servidor)

- __¿Dónde se ejecuta?__ En Node.js (en tu computadora o en la nube)
- __¿Qué hace?__ Es el servidor web. Crea la API con Express, se conecta a Neon (PostgreSQL), define los modelos (Película, Actor) y expone rutas como `/peliculas`, `/actores`, `/asignar-actor`.
- __¿Cómo se ejecuta?__ `node server.js` (o `npm start`)
- __Analogía:__ Es el __restaurante__ (la cocina donde se prepara todo)

---

## 📁 __seed.js__ → Script de datos iniciales

- __¿Dónde se ejecuta?__ En Node.js (solo desde la terminal)
- __¿Qué hace?__ Pobla la base de datos con datos de ejemplo (8 películas con sus actores). Se conecta a la misma base de datos de Neon, crea registros y calcula signos zodiacales.
- __¿Cómo se ejecuta?__ `node seed.js` (solo una vez o cuando quieras reiniciar los datos)
- __Analogía:__ Es el __chef que prepara los ingredientes iniciales__ antes de abrir el restaurante

---

## 📁 __public/app.js__ → Frontend (navegador)

- __¿Dónde se ejecuta?__ En el __navegador del usuario__ (Chrome, Firefox, etc.)
- __¿Qué hace?__ Maneja toda la interacción visual: carga películas/actores mediante `fetch()` a la API, renderiza las tarjetas, abre modales de detalle, maneja formularios, búsqueda con debounce, etc.
- __¿Cómo se ejecuta?__ El navegador lo carga automáticamente cuando abres la página web
- __Analogía:__ Es el __menú y la carta__ que ve el cliente en la mesa

---

## Resumen visual

```javascript
              ┌──────────────────────────────────────────────┐
   NAVEGADOR  │  public/app.js  (frontend - JS del cliente)  │
   (Chrome)   │  Muestra datos, maneja clicks, formularios   │
              └──────────────────────┬───────────────────────┘
                                     │  fetch() / API
              ┌──────────────────────▼───────────────────────┐
   SERVIDOR   │  server.js  (backend - Node.js/Express)      │
   (Node.js)  │  API REST, lógica de negocio, base de datos  │
              └──────────────────────┬───────────────────────┘
                                     │  Sequelize
              ┌──────────────────────▼───────────────────────┐
   NUBE       │  Neon (PostgreSQL)                          │
   (Neon)     │  Base de datos con tablas: peliculas,       │
              │  actores, peliculas_actores                  │
              └──────────────────────────────────────────────┘

   Terminal:  node seed.js  →  Pobla la BD con datos de ejemplo
```

__En resumen:__ `server.js` es el backend, `public/app.js` es el frontend, y `seed.js` es un script auxiliar para llenar la base de datos con datos de prueba.

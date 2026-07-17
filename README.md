
==================================================
## 🚀 Cómo ejecutar el proyecto
==================================================

1. **Instalar las dependencias** (solo la primera vez):
   ```bash
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm start
   ```

3. **Abrir en el navegador**:
   ```bash
   http://localhost:3000
   ```

> ⚠️ **Nota:** El servidor corre en el puerto `3000`. Si ese puerto está ocupado, se puede cambiar la variable de entorno `PORT`.

## 📁 Estructura

- `server.js` - Servidor principal con todas las rutas de la API
- `public/` - Frontend (HTML, CSS, JS, imágenes)
- `views/` - Plantillas Handlebars
- `data/` - Archivos JSON con detalles de contenido
- `peliculas.txt` y `series.txt` - Datos base en formato texto


__________________________________________________
__________________________________________________


==================================================
# 🐱 CAT FLIX - Catálogo de Películas y Series
==================================================

Servidor web construido con **Node.js + Express + Handlebars** que ofrece un catálogo de películas y series con una interfaz visual tipo Netflix.

## ✨ Funcionalidades

- **API REST** con endpoints GET, POST y DELETE para gestionar películas y series
- **Catálogo enriquecido** combinando archivos de texto planos (`.txt`) con detalles en JSON (descripción, imagen, trailer, etc.)
- **Frontend interactivo** con carrusel de scroll horizontal suave, zoom en imágenes al hover, y expansión animada de tarjetas
- **GIF de éxito** animado al agregar contenido nuevo
- **Vista de detalle** para cada película/serie con información completa

## 🛠️ Tecnologías

- Node.js
- Express
- Handlebars (HBS)
- CSS3 con animaciones y transiciones suaves
- JavaScript vanilla (fetch API)


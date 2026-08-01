// Script para buscar y actualizar imágenes de películas y actores usando la API de TMDB
// Las imágenes serán backdrops (películas) y profile photos (actores): limpias y cinematográficas, sin texto superpuesto
// Ejecutar: node tmdb-imagenes.js

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Tamaños de imagen TMDB:
// - Backdrops (películas): w1280 para máxima calidad cinematográfica
// - Profiles (actores): w500 para fotos de perfil nítidas
const BACKDROP_SIZE = 'w1280';
const PROFILE_SIZE = 'w500';

// ============ MODELOS ============
const Pelicula = sequelize.define('Pelicula', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo: { type: DataTypes.STRING(150), allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  imagen: { type: DataTypes.STRING(500), allowNull: true }
}, { tableName: 'peliculas', timestamps: false });

const Actor = sequelize.define('Actor', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
  imagen: { type: DataTypes.STRING(500), allowNull: true },
  signo_zodiacal: { type: DataTypes.STRING(30), allowNull: true }
}, { tableName: 'actores', timestamps: false });

// ============ FUNCIÓN DE ESPERA (rate limiting) ============
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============ PETICIÓN A TMDB ============
async function buscarEnTMDB(ruta, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${ruta}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'es-ES');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (response.status === 429) {
    console.log('  ⏳ Rate limit alcanzado, esperando 2 segundos...');
    await esperar(2000);
    return buscarEnTMDB(ruta, params);
  }
  if (!response.ok) throw new Error(`TMDB error ${response.status}: ${response.statusText}`);
  return response.json();
}

// ============ BUSCAR BACKDROP DE PELÍCULA ============
async function buscarBackdropPelicula(titulo, anio) {
  try {
    // 1. Buscar la película
    const data = await buscarEnTMDB('/search/movie', {
      query: titulo,
      year: anio,
      primary_release_year: anio
    });

    if (!data.results || data.results.length === 0) {
      // Reintentar sin año (por si el título traducido no coincide exactamente)
      const dataSinAnio = await buscarEnTMDB('/search/movie', { query: titulo });
      if (!dataSinAnio.results || dataSinAnio.results.length === 0) return null;
      return procesarResultado(dataSinAnio.results);
    }

    return procesarResultado(data.results);
  } catch (error) {
    console.error(`  ❌ Error buscando "${titulo}":`, error.message);
    return null;
  }
}

function procesarResultado(results) {
  // Buscar el primer resultado con backdrop (imagen cinematográfica)
  const conBackdrop = results.find(r => r.backdrop_path);
  if (conBackdrop) {
    return `${IMG_BASE}/${BACKDROP_SIZE}${conBackdrop.backdrop_path}`;
  }

  // Si ninguno tiene backdrop, usar poster (sin texto superpuesto)
  const conPoster = results.find(r => r.poster_path);
  if (conPoster) {
    return `${IMG_BASE}/w780${conPoster.poster_path}`;
  }

  return null;
}

// ============ BUSCAR FOTO DE PERFIL DE ACTOR ============
async function buscarFotoActor(nombre) {
  try {
    const data = await buscarEnTMDB('/search/person', { query: nombre });

    if (!data.results || data.results.length === 0) return null;

    // Buscar el primer resultado con foto de perfil
    // Priorizar coincidencia exacta del nombre
    const resultadoExacto = data.results.find(r =>
      r.name.toLowerCase() === nombre.toLowerCase() && r.profile_path
    );

    const elegido = resultadoExacto || data.results.find(r => r.profile_path);
    if (!elegido || !elegido.profile_path) return null;

    return `${IMG_BASE}/${PROFILE_SIZE}${elegido.profile_path}`;
  } catch (error) {
    console.error(`  ❌ Error buscando actor "${nombre}":`, error.message);
    return null;
  }
}

// ============ NORMALIZAR TÍTULOS PARA MEJOR BÚSQUEDA ============
// Algunos títulos en la BD son traducciones; TMDB busca mejor con el título original
const TITULOS_ESPECIALES = {
  'El club de la pelea': 'Fight Club',
  'Inception': 'Inception',
  'Interestelar': 'Interstellar',
  'Inocencia interrumpida': 'Girl, Interrupted',
  '¿Dónde están las rubias?': 'White Chicks',
  'Bastardos sin gloria': 'Inglourious Basterds',
  'El Camino: Una película de Breaking Bad': 'El Camino: A Breaking Bad Movie',
  'Pobres criaturas': 'Poor Things'
};

// ============ FUNCIÓN PRINCIPAL ============
async function actualizarImagenes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

    // ========== PELÍCULAS ==========
    console.log('========== 🎬 ACTUALIZANDO PELÍCULAS ==========');
    const peliculas = await Pelicula.findAll({ order: [['id', 'ASC']] });
    let pelisActualizadas = 0;
    let pelisSinResultado = 0;

    for (const pelicula of peliculas) {
      const tituloBusqueda = TITULOS_ESPECIALES[pelicula.titulo] || pelicula.titulo;
      process.stdout.write(`\n🎬 "${pelicula.titulo}" (${pelicula.anio}) → buscando... `);

      const nuevaImagen = await buscarBackdropPelicula(tituloBusqueda, pelicula.anio);

      if (nuevaImagen) {
        await pelicula.update({ imagen: nuevaImagen });
        console.log(`✅ ${nuevaImagen}`);
        pelisActualizadas++;
      } else {
        console.log('⚠️ Sin resultado');
        pelisSinResultado++;
      }

      await esperar(250); // Evitar rate limiting
    }

    // ========== ACTORES ==========
    console.log('\n\n========== 🎭 ACTUALIZANDO ACTORES ==========');
    const actores = await Actor.findAll({ order: [['id', 'ASC']] });
    let actoresActualizados = 0;
    let actoresSinResultado = 0;
    const sinonimos = {
      'Brad Pitt': 'Brad Pitt',
      'Edward Norton': 'Edward Norton',
      'Helena Bonham Carter': 'Helena Bonham Carter',
      'Leonardo DiCaprio': 'Leonardo DiCaprio',
      'Joseph Gordon-Levitt': 'Joseph Gordon-Levitt',
      'Tom Hardy': 'Tom Hardy',
      'Elliot Page': 'Elliot Page',
      'Ken Watanabe': 'Ken Watanabe',
      'Cillian Murphy': 'Cillian Murphy',
      'Marion Cotillard': 'Marion Cotillard',
      'Michael Caine': 'Michael Caine',
      'Matthew McConaughey': 'Matthew McConaughey',
      'Anne Hathaway': 'Anne Hathaway',
      'Jessica Chastain': 'Jessica Chastain',
      'Matt Damon': 'Matt Damon',
      'Mackenzie Foy': 'Mackenzie Foy',
      'Timothée Chalamet': 'Timothée Chalamet',
      'Winona Ryder': 'Winona Ryder',
      'Angelina Jolie': 'Angelina Jolie',
      'Clea DuVall': 'Clea DuVall',
      'Brittany Murphy': 'Brittany Murphy',
      'Elisabeth Moss': 'Elisabeth Moss',
      'Whoopi Goldberg': 'Whoopi Goldberg',
      'Vanessa Redgrave': 'Vanessa Redgrave',
      'Shawn Wayans': 'Shawn Wayans',
      'Marlon Wayans': 'Marlon Wayans',
      'Jaime King': 'Jaime King',
      'Frankie Faison': 'Frankie Faison',
      'Lochlyn Munro': 'Lochlyn Munro',
      'Christoph Waltz': 'Christoph Waltz',
      'Mélanie Laurent': 'Mélanie Laurent',
      'Michael Fassbender': 'Michael Fassbender',
      'Eli Roth': 'Eli Roth',
      'Diane Kruger': 'Diane Kruger',
      'Daniel Brühl': 'Daniel Brühl',
      'Til Schweiger': 'Til Schweiger',
      'Aaron Paul': 'Aaron Paul',
      'Jesse Plemons': 'Jesse Plemons',
      'Jonathan Banks': 'Jonathan Banks',
      'Bryan Cranston': 'Bryan Cranston',
      'Emma Stone': 'Emma Stone',
      'Mark Ruffalo': 'Mark Ruffalo',
      'Willem Dafoe': 'Willem Dafoe',
      'Ramy Youssef': 'Ramy Youssef'
    };

    for (const actor of actores) {
      const nombreBusqueda = sinonimos[actor.nombre] || actor.nombre;
      process.stdout.write(`\n🎭 "${actor.nombre}" → buscando... `);

      const nuevaImagen = await buscarFotoActor(nombreBusqueda);

      if (nuevaImagen) {
        await actor.update({ imagen: nuevaImagen });
        console.log(`✅ ${nuevaImagen}`);
        actoresActualizados++;
      } else {
        console.log('⚠️ Sin resultado');
        actoresSinResultado++;
      }

      await esperar(250); // Evitar rate limiting
    }

    // ========== RESUMEN ==========
    console.log('\n\n========== 📊 RESUMEN ==========');
    console.log(`🎬 Películas actualizadas: ${pelisActualizadas} de ${peliculas.length} (${pelisSinResultado} sin resultado)`);
    console.log(`🎭 Actores actualizados: ${actoresActualizados} de ${actores.length} (${actoresSinResultado} sin resultado)`);

    // Mostrar las imágenes finales
    console.log('\n--- Películas con sus imágenes ---');
    const pelisFinales = await Pelicula.findAll({ order: [['titulo', 'ASC']] });
    for (const p of pelisFinales) {
      console.log(`🎬 ${p.titulo}: ${p.imagen ? p.imagen.slice(0, 80) + '...' : 'SIN IMAGEN'}`);
    }

    console.log('\n✅ Actualización de imágenes completada!');
  } catch (error) {
    console.error('\n❌ Error durante la actualización:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

actualizarImagenes();
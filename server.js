const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

// ============ CONEXIÓN A NEON (PostgreSQL) ============
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

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
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true },
  imagen: { type: DataTypes.STRING(500), allowNull: true },
  signo_zodiacal: { type: DataTypes.STRING(30), allowNull: true }
}, { tableName: 'actores', timestamps: false });

const PeliculasActores = sequelize.define('PeliculasActores', {}, {
  tableName: 'peliculas_actores', timestamps: false
});

// Asociaciones N-N
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

// ============ EXPRESS ============
const app = express();
const PORT = process.env.PORT || 3000;

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ RUTAS VISTAS ============
app.get('/', (req, res) => {
  res.render('home', { title: 'CAT FLIX - Películas y Actores', year: new Date().getFullYear() });
});

// ============ TMDB: BÚSQUEDA INTELIGENTE ============
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mapa mínimo: solo títulos que TMDB no encuentra con el nombre en español
const TITULOS_TMDB = {
  'El club de la pelea': 'Fight Club',
  'Interestelar': 'Interstellar',
  'Inocencia interrumpida': 'Girl, Interrupted',
  '¿Dónde están las rubias?': 'White Chicks',
  'Bastardos sin gloria': 'Inglourious Basterds',
  'El Camino: Una película de Breaking Bad': 'El Camino: A Breaking Bad Movie',
  'Pobres criaturas': 'Poor Things',
  'El resplandor de una mente sin recuerdos': 'Eternal Sunshine of the Spotless Mind',
  'Seven': 'Se7en'
};

// Calcular signo zodiacal a partir de fecha (YYYY-MM-DD)
function calcularSigno(fecha) {
  const [ano, mes, dia] = fecha.split('-').map(Number);
  const m = mes;
  const d = dia;

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Aries ♈';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Tauro ♉';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Géminis ♊';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Cáncer ♋';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Leo ♌';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Virgo ♍';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra ♎';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Escorpio ♏';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagitario ♐';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricornio ♑';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Acuario ♒';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Piscis ♓';
  return null;
}

// Buscar película en TMDB con reintento automático sin año
async function buscarPeliculaTMDB(titulo, anio) {
  try {
    const tituloBusqueda = TITULOS_TMDB[titulo.trim()] || titulo.trim();

    // Intento 1: con año
    let data = await buscarEnTMDB('/search/movie', {
      query: tituloBusqueda,
      year: anio,
      primary_release_year: anio
    });

    // Intento 2: sin año (por si el año no coincide exactamente)
    if (!data || data.length === 0) {
      data = await buscarEnTMDB('/search/movie', { query: tituloBusqueda });
    }

    if (!data || data.length === 0) return null;

    // Preferir el resultado con backdrop (imagen cinematográfica sin texto superpuesto)
    const elegida = data.find(r => r.backdrop_path) || data[0];
    const path = elegida.backdrop_path
      || (data.find(r => r.poster_path) || {}).poster_path;

    if (!path) return null;

    return {
      tmdbId: elegida.id,
      imagen: `https://image.tmdb.org/t/p/w1280${path}`
    };
  } catch (error) {
    console.error('Error buscando en TMDB:', error.message);
    return null;
  }
}

// Petición genérica a TMDB
async function buscarEnTMDB(ruta, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${ruta}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('language', 'es-ES');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (response.status === 429) {
    await esperar(2000);
    return buscarEnTMDB(ruta, params);
  }
  if (!response.ok) return null;
  const data = await response.json();
  return data.results || [];
}

// Obtener el reparto principal (credits) de una película en TMDB
async function obtenerCreditosTMDB(tmdbMovieId) {
  try {
    const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbMovieId}/credits`);
    url.searchParams.set('api_key', process.env.TMDB_API_KEY);
    url.searchParams.set('language', 'es-ES');

    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.cast || [];
  } catch (error) {
    console.error('Error obteniendo créditos TMDB:', error.message);
    return [];
  }
}

// Obtener el detalle de una persona (fecha de nacimiento, etc.) en TMDB
async function obtenerDetalleActorTMDB(personId) {
  try {
    const url = new URL(`https://api.themoviedb.org/3/person/${personId}`);
    url.searchParams.set('api_key', process.env.TMDB_API_KEY);
    url.searchParams.set('language', 'es-ES');

    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error obteniendo detalle de actor TMDB:', error.message);
    return null;
  }
}

// Buscar actor en TMDB y obtener automáticamente su imagen y fecha de nacimiento
async function buscarActorTMDB(nombre) {
  try {
    const data = await buscarEnTMDB('/search/person', { query: nombre.trim() });

    if (!data || data.length === 0) return null;

    // Preferir el resultado con foto de perfil
    const elegida = data.find(r => r.profile_path) || data[0];

    // El search a veces no trae birthday, obtenerlo del detalle si falta
    let detalle = null;
    if (!elegida.birthday) {
      detalle = await obtenerDetalleActorTMDB(elegida.id);
    }

    const fechaNacimiento = elegida.birthday || (detalle && detalle.birthday) || null;

    return {
      tmdbId: elegida.id,
      imagen: elegida.profile_path
        ? `https://image.tmdb.org/t/p/w500${elegida.profile_path}`
        : null,
      fecha_nacimiento: fechaNacimiento
    };
  } catch (error) {
    console.error('Error buscando actor en TMDB:', error.message);
    return null;
  }
}

// Crear (u obtener) los actores principales de la película desde TMDB y asignarlos
async function crearActoresPrincipales(pelicula, tmdbMovieId, maxActores = 10) {
  const creditos = await obtenerCreditosTMDB(tmdbMovieId);
  // Incluir TODOS los actores del reparto principal (con o sin foto)
  const actoresPrincipales = creditos.slice(0, maxActores);

  const actoresAsignados = [];

  for (const credito of actoresPrincipales) {
    try {
      // Buscar actor existente por nombre (sin distinguir mayúsculas) para REUTILIZARLO
      let actor = await Actor.findOne({
        where: { nombre: { [Op.iLike]: credito.name } }
      });

      const imagenActor = credito.profile_path
        ? `https://image.tmdb.org/t/p/w500${credito.profile_path}`
        : null;

      if (!actor) {
        // Obtener fecha de nacimiento desde el detalle de la persona
        const detalle = await obtenerDetalleActorTMDB(credito.id);
        const fechaNacimiento = detalle && detalle.birthday ? detalle.birthday : null;
        const signo = fechaNacimiento ? calcularSigno(fechaNacimiento) : null;

        actor = await Actor.create({
          nombre: credito.name.trim(),
          fecha_nacimiento: fechaNacimiento,
          imagen: imagenActor,
          signo_zodiacal: signo
        });
      } else if (!actor.imagen && imagenActor) {
        // Si ya existía sin imagen, actualizarla con la de TMDB
        await actor.update({ imagen: imagenActor });
      }

      actoresAsignados.push(actor);
      await esperar(120); // Evitar rate limiting en peticiones a TMDB
    } catch (error) {
      console.error(`  ❌ Error creando actor "${credito.name}":`, error.message);
    }
  }

  // Reemplazar las asignaciones con el reparto principal obtenido
  await pelicula.setActors(actoresAsignados);
  return actoresAsignados;
}

// ============ API: PELÍCULAS ============

// GET /peliculas - Lista todas las películas con sus actores
// Soporta ?search= para filtrar por título
app.get('/peliculas', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search && search.trim()) {
      where.titulo = { [Op.iLike]: `%${search.trim()}%` };
    }

    const peliculas = await Pelicula.findAll({
      where,
      include: { model: Actor, through: { attributes: [] } },
      order: [['titulo', 'ASC']]
    });
    res.json(peliculas);
  } catch (error) {
    next(error);
  }
});

// POST /peliculas - Crea una película buscando su imagen y actores principales en TMDB
// Si la película ya existe (mismo título + año), reutiliza la existente en vez de duplicarla.
app.post('/peliculas', async (req, res, next) => {
  try {
    const { titulo, anio, actores_ids } = req.body;

    if (!titulo || !anio) {
      return res.status(400).json({ error: 'titulo y anio son obligatorios.' });
    }

    // Verificar si la película ya existe (evitar duplicados)
    const peliculaExistente = await Pelicula.findOne({
      where: {
        titulo: { [Op.iLike]: titulo.trim() },
        anio: Number(anio)
      },
      include: { model: Actor, through: { attributes: [] } }
    });

    if (peliculaExistente) {
      return res.json({
        mensaje: 'La película ya existía en el catálogo; se reutilizó la existente.',
        pelicula: peliculaExistente
      });
    }

    // Buscar la película en TMDB (devuelve id de TMDB e imagen)
    const infoTMDB = await buscarPeliculaTMDB(titulo, anio);

    if (!infoTMDB) {
      return res.status(404).json({ error: 'No se ha podido encontrar la película, por favor verifique el título.' });
    }

    const pelicula = await Pelicula.create({
      titulo: titulo.trim(),
      anio: Number(anio),
      imagen: infoTMDB.imagen
    });

    // Buscar y asignar automáticamente los actores principales desde TMDB
    await crearActoresPrincipales(pelicula, infoTMDB.tmdbId);

    // Si además se enviaron IDs de actores manuales, asignarlos también
    if (actores_ids && Array.isArray(actores_ids) && actores_ids.length > 0) {
      const actores = await Actor.findAll({ where: { id: actores_ids } });
      const actoresYaAsignados = await pelicula.getActors();
      const idsYaAsignados = actoresYaAsignados.map(a => a.id);
      const actoresNuevos = actores.filter(a => !idsYaAsignados.includes(a.id));
      if (actoresNuevos.length > 0) {
        await pelicula.addActors(actoresNuevos);
      }
    }

    const resultado = await Pelicula.findByPk(pelicula.id, {
      include: { model: Actor, through: { attributes: [] } }
    });

    res.status(201).json({ mensaje: 'Película añadida!', pelicula: resultado });
  } catch (error) {
    next(error);
  }
});

// DELETE /peliculas/:id - Elimina una película y sus asignaciones
app.delete('/peliculas/:id', async (req, res, next) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: 'Película no encontrada.' });
    }

    // Eliminar asignaciones en la tabla intermedia
    await PeliculasActores.destroy({ where: { pelicula_id: pelicula.id } });
    // Eliminar la película
    await pelicula.destroy();

    res.json({ mensaje: 'Película eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
});

// POST /peliculas/:id/actores-tmdb - Busca y asigna los actores principales de una película existente
app.post('/peliculas/:id/actores-tmdb', async (req, res, next) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: 'Película no encontrada.' });
    }

    const infoTMDB = await buscarPeliculaTMDB(pelicula.titulo, pelicula.anio);
    if (!infoTMDB) {
      return res.status(404).json({ error: 'No se ha podido encontrar la película en TMDB.' });
    }

    const actores = await crearActoresPrincipales(pelicula, infoTMDB.tmdbId);

    const resultado = await Pelicula.findByPk(pelicula.id, {
      include: { model: Actor, through: { attributes: [] } }
    });

    res.json({ mensaje: `Se asignaron ${actores.length} actores principales.`, pelicula: resultado });
  } catch (error) {
    next(error);
  }
});

// ============ API: ACTORES ============

// GET /actores - Lista todos los actores con sus películas
// Soporta ?search= para filtrar por nombre
app.get('/actores', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search && search.trim()) {
      where.nombre = { [Op.iLike]: `%${search.trim()}%` };
    }

    const actores = await Actor.findAll({
      where,
      include: { model: Pelicula, through: { attributes: [] } },
      order: [['nombre', 'ASC']]
    });
    res.json(actores);
  } catch (error) {
    next(error);
  }
});

// PATCH /actores/:id - Actualiza un actor (para agregar imagen)
app.patch('/actores/:id', async (req, res, next) => {
  try {
    const actor = await Actor.findByPk(req.params.id);
    if (!actor) {
      return res.status(404).json({ error: 'Actor no encontrado.' });
    }
    await actor.update(req.body);
    res.json(actor);
  } catch (error) {
    next(error);
  }
});

// PATCH /peliculas/:id - Actualiza una película
app.patch('/peliculas/:id', async (req, res, next) => {
  try {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
      return res.status(404).json({ error: 'Película no encontrada.' });
    }
    await pelicula.update(req.body);
    const resultado = await Pelicula.findByPk(pelicula.id, {
      include: { model: Actor, through: { attributes: [] } }
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// POST /actores - Crea un actor
// Busca automáticamente la imagen y la fecha de nacimiento en TMDB.
// Si el actor ya existe, lo actualiza con los datos de TMDB en vez de duplicarlo.
app.post('/actores', async (req, res, next) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'nombre es obligatorio.' });
    }

    // Buscar actor en TMDB para obtener imagen y fecha de nacimiento automáticamente
    const infoTMDB = await buscarActorTMDB(nombre);

    const fechaNacimiento = req.body.fecha_nacimiento
      || (infoTMDB && infoTMDB.fecha_nacimiento)
      || null;

    const imagen = req.body.imagen
      || (infoTMDB && infoTMDB.imagen)
      || null;

    const signo = fechaNacimiento ? calcularSigno(fechaNacimiento) : null;

    // Buscar actor existente por nombre (sin distinguir mayúsculas) para REUTILIZARLO
    let actor = await Actor.findOne({
      where: { nombre: { [Op.iLike]: nombre.trim() } }
    });

    if (actor) {
      // Actualizar solo los campos que faltan o que TMDB nos dio
      const actualizacion = {};
      if (!actor.imagen && imagen) actualizacion.imagen = imagen;
      if (!actor.fecha_nacimiento && fechaNacimiento) actualizacion.fecha_nacimiento = fechaNacimiento;
      if (!actor.signo_zodiacal && signo) actualizacion.signo_zodiacal = signo;
      if (Object.keys(actualizacion).length > 0) {
        await actor.update(actualizacion);
      }
      return res.json({ mensaje: 'Actor ya existía; se actualizaron sus datos.', actor });
    }

    actor = await Actor.create({
      nombre: nombre.trim(),
      fecha_nacimiento: fechaNacimiento,
      imagen,
      signo_zodiacal: signo
    });

    res.status(201).json(actor);
  } catch (error) {
    next(error);
  }
});

// ============ API: ASIGNAR ACTOR A PELÍCULA (CON TRANSACCIÓN) ============

// POST /asignar-actor - Asigna un actor a una película usando transacción
app.post('/asignar-actor', async (req, res, next) => {
  try {
    const { pelicula_id, actor_id } = req.body;

    if (!pelicula_id || !actor_id) {
      return res.status(400).json({ error: 'pelicula_id y actor_id son obligatorios.' });
    }

    // Verificar que existen
    const pelicula = await Pelicula.findByPk(pelicula_id);
    if (!pelicula) {
      return res.status(404).json({ error: 'La película no existe.' });
    }

    const actor = await Actor.findByPk(actor_id);
    if (!actor) {
      return res.status(404).json({ error: 'El actor no existe.' });
    }

    // Asignación con transacción
    await sequelize.transaction(async (t) => {
      await PeliculasActores.create(
        { pelicula_id, actor_id },
        { transaction: t }
      );
    });

    // Devolver la película con sus actores actualizada
    const resultado = await Pelicula.findByPk(pelicula_id, {
      include: { model: Actor, through: { attributes: [] } }
    });

    res.status(201).json({ mensaje: 'Actor asignado correctamente.', pelicula: resultado });
  } catch (error) {
    // Si el error es de unique constraint, ya estaba asignado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El actor ya está asignado a esta película.' });
    }
    next(error);
  }
});

// ============ MANEJO DE ERRORES ============
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'El body debe contener JSON válido.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ============ INICIAR SERVIDOR ============
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a Neon (PostgreSQL) establecida correctamente.');

    // Sincronizar modelos (crea las tablas si no existen y aplica cambios)
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas (peliculas, actores, peliculas_actores).');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor disponible en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
}

iniciarServidor();
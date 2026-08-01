// Script para poblar la base de datos con películas, actores y asignaciones
// Ejecutar: node seed.js

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false
});

// ============ MODELOS (igual que en server.js) ============
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

const PeliculasActores = sequelize.define('PeliculasActores', {}, {
  tableName: 'peliculas_actores', timestamps: false
});

Pelicula.belongsToMany(Actor, { through: PeliculasActores, foreignKey: 'pelicula_id', otherKey: 'actor_id' });
Actor.belongsToMany(Pelicula, { through: PeliculasActores, foreignKey: 'actor_id', otherKey: 'pelicula_id' });

// ============ FUNCIÓN PARA CALCULAR SIGNO ZODIACAL ============
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
  return 'Desconocido';
}

// ============ DATOS ============

const peliculasData = [
  {
    titulo: 'El club de la pelea',
    anio: 1999,
    imagen: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_.jpg',
    actores: [
      { nombre: 'Brad Pitt', fecha_nacimiento: '1963-12-18', imagen: 'https://m.media-amazon.com/images/M/MV5BNDMwMDc2MTktMmY5Yy00M2EzLWIyY2QtMDk3YjA5OGI1MjA0XkEyXkFqcGc@._V1_.jpg' },
      { nombre: 'Edward Norton', fecha_nacimiento: '1969-08-18', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYwNjQzMTY1Nl5BMl5BanBnXkFtZTYwNDE3NTQz._V1_.jpg' },
      { nombre: 'Helena Bonham Carter', fecha_nacimiento: '1966-05-26', imagen: 'https://m.media-amazon.com/images/M/MV5BMTUzMzUzMDg5MV5BMl5BanBnXkFtZTcwMDA5NDM0NA@@._V1_.jpg' }
    ]
  },
  {
    titulo: 'Inception',
    anio: 2010,
    imagen: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
    actores: [
      { nombre: 'Leonardo DiCaprio', fecha_nacimiento: '1974-11-11', imagen: 'https://m.media-amazon.com/images/M/MV5BMjI0MTg3MzI0M15BMl5BanBnXkFtZTcwMzQyODU2Mw@@._V1_.jpg' },
      { nombre: 'Joseph Gordon-Levitt', fecha_nacimiento: '1981-02-17', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYyNTg2NTc0Nl5BMl5BanBnXkFtZTcwNjg3MjU0NA@@._V1_.jpg' },
      { nombre: 'Tom Hardy', fecha_nacimiento: '1977-09-15', imagen: 'https://m.media-amazon.com/images/M/MV5BOTQyN2FjZmMtY2UzYi00YTU4LWIzOTUtOTQ2ZWRjY2I3MWI2XkEyXkFqcGc@._V1_.jpg' },
      { nombre: 'Elliot Page', fecha_nacimiento: '1987-02-21', imagen: 'https://m.media-amazon.com/images/M/MV5BOTkxMjg3OTQyN15BMl5BanBnXkFtZTgwNTkxMzY3MTI@._V1_.jpg' },
      { nombre: 'Ken Watanabe', fecha_nacimiento: '1959-10-21', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY0NzYzNzI5M15BMl5BanBnXkFtZTcwMDYzMzY2Mg@@._V1_.jpg' },
      { nombre: 'Cillian Murphy', fecha_nacimiento: '1976-05-25', imagen: 'https://m.media-amazon.com/images/M/MV5BMTc3MDYzMDQ1OF5BMl5BanBnXkFtZTcwMDQ3NjYwMw@@._V1_.jpg' },
      { nombre: 'Marion Cotillard', fecha_nacimiento: '1975-09-30', imagen: 'https://m.media-amazon.com/images/M/MV5BMTM0NzQ5ODUyOV5BMl5BanBnXkFtZTcwNDU5NjQzNA@@._V1_.jpg' },
      { nombre: 'Michael Caine', fecha_nacimiento: '1933-03-14', imagen: 'https://m.media-amazon.com/images/M/MV5BMTUzMjI1NjM0OV5BMl5BanBnXkFtZTYwOTg3NjEz._V1_.jpg' }
    ]
  },
  {
    titulo: 'Interestelar',
    anio: 2014,
    imagen: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_.jpg',
    actores: [
      { nombre: 'Matthew McConaughey', fecha_nacimiento: '1969-11-04', imagen: 'https://m.media-amazon.com/images/M/MV5BMTg0MDc3ODUwNV5BMl5BanBnXkFtZTcwMDg3OTQwNA@@._V1_.jpg' },
      { nombre: 'Anne Hathaway', fecha_nacimiento: '1982-11-12', imagen: 'https://m.media-amazon.com/images/M/MV5BMTRhNzQ3NGMtZmQ1Mi00ZTViLTk3MDgtYzQzNjAyY2RiYmFmXkEyXkFqcGc@._V1_.jpg' },
      { nombre: 'Jessica Chastain', fecha_nacimiento: '1977-03-24', imagen: 'https://m.media-amazon.com/images/M/MV5BMTU1MjAxNTYyN15BMl5BanBnXkFtZTcwNjAzMjg3OA@@._V1_.jpg' },
      { nombre: 'Matt Damon', fecha_nacimiento: '1970-10-08', imagen: 'https://m.media-amazon.com/images/M/MV5BMTM0NzYzNDgxMl5BMl5BanBnXkFtZTcwMDg2MTM2OA@@._V1_.jpg' },
      { nombre: 'Mackenzie Foy', fecha_nacimiento: '2000-11-10', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY3NDU5OTg4OV5BMl5BanBnXkFtZTgwMTU5NzY3NjE@._V1_.jpg' },
      { nombre: 'Timothée Chalamet', fecha_nacimiento: '1995-12-27', imagen: 'https://m.media-amazon.com/images/M/MV5BODM0Nzg2MzE3N15BMl5BanBnXkFtZTgwNjY3MzI5NjE@._V1_.jpg' }
    ]
  },
  {
    titulo: 'Inocencia interrumpida',
    anio: 1999,
    imagen: 'https://i.pinimg.com/originals/a6/4b/19/a64b195f4f8a3230803e4584dfff3db7.jpg',
    actores: [
      { nombre: 'Winona Ryder', fecha_nacimiento: '1971-10-29', imagen: 'https://m.media-amazon.com/images/M/MV5BMTQ3MDM0MTMyNV5BMl5BanBnXkFtZTcwNzA3MjQzNA@@._V1_.jpg' },
      { nombre: 'Angelina Jolie', fecha_nacimiento: '1975-06-04', imagen: 'https://m.media-amazon.com/images/M/MV5BMTg3NTA2MTY4Ml5BMl5BanBnXkFtZTgwMTMzNTc1NjM@._V1_.jpg' },
      { nombre: 'Clea DuVall', fecha_nacimiento: '1977-09-25', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYzMjk0MzE1OV5BMl5BanBnXkFtZTcwNzU0OTI0NA@@._V1_.jpg' },
      { nombre: 'Brittany Murphy', fecha_nacimiento: '1977-11-10', imagen: 'https://m.media-amazon.com/images/M/MV5BMjI0MTc2NTg0MV5BMl5BanBnXkFtZTcwMzI0MzA1Mg@@._V1_.jpg' },
      { nombre: 'Elisabeth Moss', fecha_nacimiento: '1982-07-24', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY4OTQxODc5M15BMl5BanBnXkFtZTgwODk5OTk3MTE@._V1_.jpg' },
      { nombre: 'Whoopi Goldberg', fecha_nacimiento: '1955-11-13', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5MDc0ODkyNV5BMl5BanBnXkFtZTcwODI4ODg3Ng@@._V1_.jpg' },
      { nombre: 'Vanessa Redgrave', fecha_nacimiento: '1937-01-30', imagen: 'https://m.media-amazon.com/images/M/MV5BMTU5Mjk1MzE5OF5BMl5BanBnXkFtZTcwMTQzMjQ4Mg@@._V1_.jpg' }
    ]
  },
  {
    titulo: '¿Dónde están las rubias?',
    anio: 2004,
    imagen: 'https://cloudfront-eu-central-1.images.arcpublishing.com/prisaradiolos40/SMKY7C2RJNMOXHKS74XE3SVPWA.jpg',
    actores: [
      { nombre: 'Shawn Wayans', fecha_nacimiento: '1971-01-19', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYzODQxNTM5MV5BMl5BanBnXkFtZTcwMjUzNjE1Mg@@._V1_.jpg' },
      { nombre: 'Marlon Wayans', fecha_nacimiento: '1972-07-23', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYzODQxNTM5MV5BMl5BanBnXkFtZTcwMjUzNjE1Mg@@._V1_.jpg' },
      { nombre: 'Jaime King', fecha_nacimiento: '1979-04-23', imagen: 'https://m.media-amazon.com/images/M/MV5BMTI0NjM5MTYzN15BMl5BanBnXkFtZTYwODU5MjUz._V1_.jpg' },
      { nombre: 'Frankie Faison', fecha_nacimiento: '1949-06-10', imagen: 'https://m.media-amazon.com/images/M/MV5BMTc4NDc4MDQzOV5BMl5BanBnXkFtZTcwNDg5NzQyMw@@._V1_.jpg' },
      { nombre: 'Lochlyn Munro', fecha_nacimiento: '1966-02-12', imagen: 'https://m.media-amazon.com/images/M/MV5BMTI5Mjc5OTk5Ml5BMl5BanBnXkFtZTcwMzI5NzYzMw@@._V1_.jpg' }
    ]
  },
  {
    titulo: 'Bastardos sin gloria',
    anio: 2009,
    imagen: 'https://elcairocinepublico.gob.ar/wp-content/uploads/2024/08/BASTARDOS-SIN-GLORIA-03.jpg',
    actores: [
      { nombre: 'Brad Pitt', fecha_nacimiento: '1963-12-18', imagen: 'https://m.media-amazon.com/images/M/MV5BNDMwMDc2MTktMmY5Yy00M2EzLWIyY2QtMDk3YjA5OGI1MjA0XkEyXkFqcGc@._V1_.jpg' },
      { nombre: 'Christoph Waltz', fecha_nacimiento: '1956-10-04', imagen: 'https://m.media-amazon.com/images/M/MV5BMTQyNDU4Mzc5MF5BMl5BanBnXkFtZTcwMDQ5NzU4NA@@._V1_.jpg' },
      { nombre: 'Mélanie Laurent', fecha_nacimiento: '1983-02-21', imagen: 'https://m.media-amazon.com/images/M/MV5BMTQ3Mjk5MjUyOV5BMl5BanBnXkFtZTcwMTI4MjU0NA@@._V1_.jpg' },
      { nombre: 'Michael Fassbender', fecha_nacimiento: '1977-04-02', imagen: 'https://m.media-amazon.com/images/M/MV5BMTUyMjk4NzQ5OV5BMl5BanBnXkFtZTcwMjg4NzQyMw@@._V1_.jpg' },
      { nombre: 'Eli Roth', fecha_nacimiento: '1972-04-18', imagen: 'https://m.media-amazon.com/images/M/MV5BMTc4MjA3NjE3OV5BMl5BanBnXkFtZTcwNjA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Diane Kruger', fecha_nacimiento: '1976-07-15', imagen: 'https://m.media-amazon.com/images/M/MV5BMTYyOTk4MjU1M15BMl5BanBnXkFtZTcwNjU5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Daniel Brühl', fecha_nacimiento: '1978-06-16', imagen: 'https://m.media-amazon.com/images/M/MV5BMTg5MjY3ODUzM15BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Til Schweiger', fecha_nacimiento: '1963-12-19', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' }
    ]
  },
  {
    titulo: 'El Camino: Una película de Breaking Bad',
    anio: 2019,
    imagen: 'https://substackcdn.com/image/fetch/$s_!U5tc!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F158ff5fc-8e5e-4f77-9cba-5621a0836002_1280x720.jpeg',
    actores: [
      { nombre: 'Aaron Paul', fecha_nacimiento: '1979-08-27', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY3NDkzOTE5Nl5BMl5BanBnXkFtZTcwNzI5OTYwMw@@._V1_.jpg' },
      { nombre: 'Jesse Plemons', fecha_nacimiento: '1988-04-02', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Jonathan Banks', fecha_nacimiento: '1947-01-31', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Bryan Cranston', fecha_nacimiento: '1956-03-07', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' }
    ]
  },
  {
    titulo: 'Pobres criaturas',
    anio: 2023,
    imagen: 'https://as01.epimg.net/img/especiales/reportajes/2024/oscars/pobres/frame10h.jpg',
    actores: [
      { nombre: 'Emma Stone', fecha_nacimiento: '1988-11-06', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Mark Ruffalo', fecha_nacimiento: '1967-11-22', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Willem Dafoe', fecha_nacimiento: '1955-07-22', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' },
      { nombre: 'Ramy Youssef', fecha_nacimiento: '1991-03-26', imagen: 'https://m.media-amazon.com/images/M/MV5BMTY5NzIxOTg5Nl5BMl5BanBnXkFtZTcwNzA5NjA0Mg@@._V1_.jpg' }
    ]
  }
];

// ============ FUNCIÓN PRINCIPAL ============
async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Sincronizar modelos con alter para agregar columna signo_zodiacal
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Obtener actores existentes (Keanu, Carrie-Anne, etc.)
    const actoresExistentes = await Actor.findAll();
    const actoresMap = new Map();
    actoresExistentes.forEach(a => actoresMap.set(a.nombre, a));

    // Para cada película, crear actores y asignarlos
    for (const peliData of peliculasData) {
      console.log(`\n--- Procesando: ${peliData.titulo} (${peliData.anio}) ---`);

      // Buscar si la película ya existe
      let pelicula = await Pelicula.findOne({ where: { titulo: peliData.titulo } });

      if (!pelicula) {
        pelicula = await Pelicula.create({
          titulo: peliData.titulo,
          anio: peliData.anio,
          imagen: peliData.imagen
        });
        console.log(`  ✅ Película creada: ${peliData.titulo} (ID: ${pelicula.id})`);
      } else {
        console.log(`  ℹ️ Película ya existe: ${peliData.titulo} (ID: ${pelicula.id})`);
        // Actualizar imagen siempre (para reflejar cambios de URL)
        if (peliData.imagen) {
          await pelicula.update({ imagen: peliData.imagen });
          console.log(`  ✅ Imagen actualizada para: ${peliData.titulo}`);
        }
      }

      // Crear o buscar actores
      const actoresIds = [];
      for (const actorData of peliData.actores) {
        let actor = actoresMap.get(actorData.nombre);

        if (!actor) {
          const signo = calcularSigno(actorData.fecha_nacimiento);
          actor = await Actor.create({
            nombre: actorData.nombre,
            fecha_nacimiento: actorData.fecha_nacimiento,
            imagen: actorData.imagen,
            signo_zodiacal: signo
          });
          actoresMap.set(actorData.nombre, actor);
          console.log(`  ✅ Actor creado: ${actorData.nombre} (${signo})`);
        } else {
          // Actualizar signo zodiacal si el actor existía sin él
          if (!actor.signo_zodiacal) {
            const signo = calcularSigno(actorData.fecha_nacimiento);
            await actor.update({ signo_zodiacal: signo });
            console.log(`  ✅ Signo actualizado para: ${actorData.nombre} (${signo})`);
          }
        }
        actoresIds.push(actor.id);
      }

      // Asignar actores a la película
      const actoresAsignar = await Actor.findAll({ where: { id: actoresIds } });
      await pelicula.setActors(actoresAsignar);
      console.log(`  ✅ ${actoresAsignar.length} actores asignados a "${peliData.titulo}"`);
    }

    // Actualizar signo zodiacal de actores existentes que no lo tengan
    console.log('\n--- Actualizando signos de actores existentes ---');
    const actoresSinSigno = await Actor.findAll({ where: { signo_zodiacal: null } });
    for (const actor of actoresSinSigno) {
      const signo = calcularSigno(actor.fecha_nacimiento);
      await actor.update({ signo_zodiacal: signo });
      console.log(`  ✅ ${actor.nombre}: ${signo}`);
    }

    // Mostrar resumen
    console.log('\n========== 📊 RESUMEN ==========');
    const totalPelis = await Pelicula.count();
    const totalActores = await Actor.count();
    const totalAsignaciones = await PeliculasActores.count();
    console.log(`🎬 Películas: ${totalPelis}`);
    console.log(`🎭 Actores: ${totalActores}`);
    console.log(`🔗 Asignaciones: ${totalAsignaciones}`);

    // Mostrar cada película con sus actores
    const todasLasPelis = await Pelicula.findAll({
      include: { model: Actor, through: { attributes: [] } },
      order: [['titulo', 'ASC']]
    });
    for (const p of todasLasPelis) {
      const actoresNombres = p.Actors.map(a => `${a.nombre} (${a.signo_zodiacal || '?'})`).join(', ');
      console.log(`\n🎬 ${p.titulo} (${p.anio})`);
      console.log(`   Actores: ${actoresNombres}`);
    }

    console.log('\n✅ Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
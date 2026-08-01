// ============ SCRIPT DE LIMPIEZA DE DUPLICADOS (SQL Nativo) ============
// Elimina películas duplicadas (mismo título + año) y actores duplicados (mismo nombre),
// conservando el registro con menor ID y reasignando correctamente las relaciones N-N.
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

// ============ LIMPIAR PELÍCULAS DUPLICADAS ============
async function limpiarPeliculasDuplicadas() {
  console.log('\n🔍 Buscando películas duplicadas...');

  // Encontrar títulos+año duplicados
  const [grupos] = await sequelize.query(`
    SELECT titulo, anio, COUNT(*) as cantidad
    FROM peliculas
    GROUP BY titulo, anio
    HAVING COUNT(*) > 1
  `);

  if (grupos.length === 0) {
    console.log('✅ No hay películas duplicadas.');
    return;
  }

  console.log(`⚠️  Se encontraron ${grupos.length} grupos de películas duplicadas.`);

  for (const grupo of grupos) {
    const { titulo, anio, cantidad } = grupo;

    const [duplicadas] = await sequelize.query(`
      SELECT id, titulo FROM peliculas
      WHERE titulo = :titulo AND anio = :anio
      ORDER BY id ASC
    `, {
      replacements: { titulo, anio: Number(anio) }
    });

    const original = duplicadas[0];
    const resto = duplicadas.slice(1);

    console.log(`\n📌 "${titulo}" (${anio}) — ${cantidad} registros`);

    for (const dup of resto) {
      try {
        await sequelize.transaction(async (t) => {
          // Mover las asignaciones de la duplicada a la original (si no existen ya)
          const [asignaciones] = await sequelize.query(`
            SELECT actor_id FROM peliculas_actores
            WHERE pelicula_id = :dupId
          `, {
            replacements: { dupId: dup.id },
            transaction: t
          });

          for (const asignacion of asignaciones) {
            await sequelize.query(`
              INSERT INTO peliculas_actores (pelicula_id, actor_id)
              SELECT :origId, :actorId
              WHERE NOT EXISTS (
                SELECT 1 FROM peliculas_actores
                WHERE pelicula_id = :origId AND actor_id = :actorId
              )
            `, {
              replacements: { origId: original.id, actorId: asignacion.actor_id },
              transaction: t
            });
          }

          // Eliminar las asignaciones de la duplicada y la película duplicada
          await sequelize.query(`
            DELETE FROM peliculas_actores WHERE pelicula_id = :dupId
          `, { replacements: { dupId: dup.id }, transaction: t });

          await sequelize.query(`
            DELETE FROM peliculas WHERE id = :dupId
          `, { replacements: { dupId: dup.id }, transaction: t });
        });

        console.log(`  🗑️  Eliminada película ID ${dup.id} (${dup.titulo}) → asignaciones movidas a ID ${original.id}`);
      } catch (error) {
        console.error(`  ❌ Error eliminando película ID ${dup.id}:`, error.message);
      }
    }
  }
}

// ============ LIMPIAR ACTORES DUPLICADOS ============
async function limpiarActoresDuplicados() {
  console.log('\n🔍 Buscando actores duplicados...');

  // Encontrar nombres duplicados (case-insensitive)
  const [grupos] = await sequelize.query(`
    SELECT LOWER(nombre) as nombre_normalizado, COUNT(*) as cantidad
    FROM actores
    GROUP BY LOWER(nombre)
    HAVING COUNT(*) > 1
  `);

  if (grupos.length === 0) {
    console.log('✅ No hay actores duplicados.');
    return;
  }

  console.log(`⚠️  Se encontraron ${grupos.length} grupos de actores duplicados.`);

  for (const grupo of grupos) {
    const { nombre_normalizado, cantidad } = grupo;

    const [duplicados] = await sequelize.query(`
      SELECT id, nombre FROM actores
      WHERE LOWER(nombre) = :nombre
      ORDER BY id ASC
    `, {
      replacements: { nombre: nombre_normalizado }
    });

    const original = duplicados[0];
    const resto = duplicados.slice(1);

    console.log(`\n📌 "${original.nombre}" — ${cantidad} registros`);

    for (const dup of resto) {
      try {
        await sequelize.transaction(async (t) => {
          // Mover las asignaciones de la duplicada a la original (si no existen ya)
          const [asignaciones] = await sequelize.query(`
            SELECT pelicula_id FROM peliculas_actores
            WHERE actor_id = :dupId
          `, {
            replacements: { dupId: dup.id },
            transaction: t
          });

          for (const asignacion of asignaciones) {
            await sequelize.query(`
              INSERT INTO peliculas_actores (pelicula_id, actor_id)
              SELECT :peliculaId, :origId
              WHERE NOT EXISTS (
                SELECT 1 FROM peliculas_actores
                WHERE pelicula_id = :peliculaId AND actor_id = :origId
              )
            `, {
              replacements: { peliculaId: asignacion.pelicula_id, origId: original.id },
              transaction: t
            });
          }

          // Eliminar las asignaciones de la duplicada y el actor duplicado
          await sequelize.query(`
            DELETE FROM peliculas_actores WHERE actor_id = :dupId
          `, { replacements: { dupId: dup.id }, transaction: t });

          await sequelize.query(`
            DELETE FROM actores WHERE id = :dupId
          `, { replacements: { dupId: dup.id }, transaction: t });
        });

        console.log(`  🗑️  Eliminado actor ID ${dup.id} (${dup.nombre}) → asignaciones movidas a ID ${original.id}`);
      } catch (error) {
        console.error(`  ❌ Error eliminando actor ID ${dup.id}:`, error.message);
      }
    }
  }
}

// ============ EJECUTAR ============
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida.');

    await limpiarPeliculasDuplicadas();
    await limpiarActoresDuplicados();

    console.log('\n✅ Limpieza completada.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await sequelize.close();
  }
})();
const express = require('express');
const { engine } = require('express-handlebars');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FILES = {
    peliculas: path.join(__dirname, 'peliculas.txt'),
    series: path.join(__dirname, 'series.txt')
};
const DETAIL_FILES = {
    peliculas: path.join(__dirname, 'data', 'peliculas.json'),
    series: path.join(__dirname, 'data', 'series.json')
};

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function esTipoValido(tipo) {
    return tipo === 'peliculas' || tipo === 'series';
}

function textoSeguro(valor) {
    return typeof valor === 'string' && valor.trim() !== '' && !/[\r\n,]/.test(valor);
}

function numeroValido(valor, minimo, maximo = 2100) {
    return Number.isInteger(Number(valor)) && Number(valor) >= minimo && Number(valor) <= maximo;
}

async function leerCatalogo(tipo) {
    const contenido = await fs.readFile(FILES[tipo], 'utf8');

    return contenido
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter(Boolean)
        .map((linea) => {
            const campos = linea.split(',').map((campo) => campo.trim());
            if (tipo === 'peliculas') {
                const [nombre, director, año] = campos;
                return { nombre, director, año: Number(año) };
            }
            const [nombre, año, temporadas] = campos;
            return { nombre, año: Number(año), temporadas: Number(temporadas) };
        });
}

async function leerCatalogoEnriquecido(tipo) {
    const [catalogo, contenidoDetalles] = await Promise.all([
        leerCatalogo(tipo),
        fs.readFile(DETAIL_FILES[tipo], 'utf8')
    ]);
    
    const detalles = JSON.parse(contenidoDetalles);
    
    return catalogo.map((item) => {
        const informacionExtra = detalles.find((d) => d.nombre.toLowerCase() === item.nombre.toLowerCase());
        return { ...item, ...(informacionExtra || {}) };
    });
}

async function leerDetalle(tipo, nombre) {
    const [catalogo, contenidoDetalles] = await Promise.all([
        leerCatalogo(tipo),
        fs.readFile(DETAIL_FILES[tipo], 'utf8')
    ]);
    const item = catalogo.find((contenido) => contenido.nombre.toLowerCase() === nombre.toLowerCase());
    if (!item) return null;

    const detalles = JSON.parse(contenidoDetalles);
    const informacionExtra = detalles.find((contenido) => contenido.nombre.toLowerCase() === nombre.toLowerCase());
    return { ...item, ...(informacionExtra || {}) };
}

async function guardarDetalle(tipo, contenido) {
    const contenidoDetalles = await fs.readFile(DETAIL_FILES[tipo], 'utf8');
    const detalles = JSON.parse(contenidoDetalles);
    
    const nuevoId = detalles.length > 0 ? Math.max(...detalles.map(d => d.id)) + 1 : 0;
    
    const nuevoDetalle = {
        id: nuevoId,
        nombre: contenido.nombre,
        ...(contenido.descripcion && { descripcion: contenido.descripcion }),
        ...(contenido.imagen && { imagen: contenido.imagen }),
        ...(contenido.leyenda && { leyenda: contenido.leyenda }),
        ...(contenido.trailer && { trailer: contenido.trailer }),
        ...(contenido.enlace && { enlace: contenido.enlace })
    };
    
    detalles.push(nuevoDetalle);
    await fs.writeFile(DETAIL_FILES[tipo], JSON.stringify(detalles, null, 4), 'utf8');
}

function validarContenido(tipo, contenido) {
    const { nombre, director, año, temporadas } = contenido;
    if (!textoSeguro(nombre) || !numeroValido(año, 1888)) {
        return 'Nombre y año de estreno válidos son obligatorios.';
    }
    if (tipo === 'peliculas' && !textoSeguro(director)) {
        return 'El director es obligatorio para una película.';
    }
    if (tipo === 'series' && !numeroValido(temporadas, 1, 100)) {
        return 'El número de temporadas debe ser un entero mayor que cero.';
    }
    return null;
}

function metodoNoPermitido(req, res) {
    res.set('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido.' });
}

app.get('/', (req, res) => {
    res.render('home', { title: 'CAT FLIX', year: new Date().getFullYear() });
});

app.head('/api/catalogo', metodoNoPermitido);

app.get('/api/catalogo', async (req, res, next) => {
    const { tipo } = req.query;
    if (!esTipoValido(tipo)) {
        return res.status(400).json({ error: 'El parámetro tipo debe ser peliculas o series.' });
    }
    try {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        const datos = await leerCatalogoEnriquecido(tipo);
        console.log(`[GET /api/catalogo] tipo=${tipo}, devolviendo ${datos.length} items`);
        if (datos.length > 0) {
            console.log(`Primer item: ${JSON.stringify(datos[0])}`);
        }
        return res.json(datos);
    } catch (error) {
        console.error('Error en GET /api/catalogo:', error);
        return next(error);
    }
});

// Información enriquecida para la vista de detalle del cliente.
app.head('/api/detalle', metodoNoPermitido);
app.get('/api/detalle', async (req, res, next) => {
    const { tipo, nombre } = req.query;
    if (!esTipoValido(tipo) || !textoSeguro(nombre)) {
        return res.status(400).json({ error: 'Se requieren los parámetros tipo y nombre.' });
    }
    try {
        const detalle = await leerDetalle(tipo, nombre.trim());
        if (!detalle) return res.status(404).json({ error: 'El contenido no existe.' });
        return res.json(detalle);
    } catch (error) {
        return next(error);
    }
});

app.post('/api/catalogo', async (req, res, next) => {
    const { tipo } = req.body;
    if (!esTipoValido(tipo)) {
        return res.status(400).json({ error: 'El campo tipo debe ser peliculas o series.' });
    }
    const errorValidacion = validarContenido(tipo, req.body);
    if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
    }
    try {
        const catalogo = await leerCatalogo(tipo);
        const existe = catalogo.some((item) => item.nombre.toLowerCase() === req.body.nombre.trim().toLowerCase());
        if (existe) {
            return res.status(409).json({ error: 'Ya existe un contenido con ese nombre.' });
        }
        const nuevaLinea = tipo === 'peliculas'
            ? `${req.body.nombre.trim()}, ${req.body.director.trim()}, ${Number(req.body.año)}`
            : `${req.body.nombre.trim()}, ${Number(req.body.año)}, ${Number(req.body.temporadas)}`;
        await fs.appendFile(FILES[tipo], `\n${nuevaLinea}`, 'utf8');
        console.log(`[POST] Agregado en .txt: ${req.body.nombre}`);
        
        // Guardar detalles en JSON si los hay
        if (req.body.descripcion || req.body.imagen || req.body.leyenda) {
            console.log(`[POST] Guardando detalles para: ${req.body.nombre}, imagen: ${req.body.imagen}`);
            await guardarDetalle(tipo, req.body);
        }
        
        return res.status(201).json({ mensaje: 'Contenido agregado correctamente.' });
    } catch (error) {
        console.error('Error en POST /api/catalogo:', error);
        return next(error);
    }
});

app.delete('/api/catalogo', async (req, res, next) => {
    const { tipo, nombre } = req.query;
    if (!esTipoValido(tipo) || !textoSeguro(nombre)) {
        return res.status(400).json({ error: 'Se requieren los parámetros tipo y nombre.' });
    }
    try {
        const catalogo = await leerCatalogo(tipo);
        const restantes = catalogo.filter((item) => item.nombre.toLowerCase() !== nombre.trim().toLowerCase());
        if (restantes.length === catalogo.length) {
            return res.status(404).json({ error: 'El contenido no existe.' });
        }
        const lineas = restantes.map((item) => tipo === 'peliculas'
            ? `${item.nombre}, ${item.director}, ${item.año}`
            : `${item.nombre}, ${item.año}, ${item.temporadas}`
        );
        await fs.writeFile(FILES[tipo], `${lineas.join('\n')}\n`, 'utf8');
        return res.json({ mensaje: 'Contenido eliminado correctamente.' });
    } catch (error) {
        return next(error);
    }
});

app.all('/api/catalogo', metodoNoPermitido);
app.all('/api/detalle', metodoNoPermitido);

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
        return res.status(400).json({ error: 'El body debe contener JSON válido.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
    console.log(`Servidor disponible en http://localhost:${PORT}`);
});

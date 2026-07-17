// ============ ESTADO ============
let currentData = [];
let currentType = ''; // 'peliculas' o 'series'
let ascending = true;

// ============ CARGAR DATOS ============
async function cargarPeliculas() {
    currentType = 'peliculas';
    document.getElementById('btnMovies').classList.add('btn-active');
    document.getElementById('btnSeries').classList.remove('btn-active');
    await fetchData('/api/catalogo?tipo=peliculas');
    mostrarControles('peliculas');
}

async function cargarSeries() {
    currentType = 'series';
    document.getElementById('btnSeries').classList.add('btn-active');
    document.getElementById('btnMovies').classList.remove('btn-active');
    await fetchData('/api/catalogo?tipo=series');
    mostrarControles('series');
}

async function fetchData(url) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Cargando...</p>
        </div>
    `;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Error ' + response.status);
        }
        currentData = await response.json();
        console.log(`[fetchData] ${url}, recibido:`, currentData);
        if (currentData.length > 0) {
            console.log('Primer item tiene imagen:', currentData[0].imagen);
        }
        renderItems();
    } catch (err) {
        grid.innerHTML = `<p class="error-text">❌ Error al cargar datos: ${err.message}</p>`;
    }
}

// ============ MOSTRAR CONTROLES ============
function mostrarControles(tipo) {
    const controls = document.getElementById('sortBar');
    controls.style.display = 'flex';

    const sortDirector = document.getElementById('sortDirector');
    const sortTemporadas = document.getElementById('sortTemporadas');

    if (tipo === 'peliculas') {
        sortDirector.style.display = 'block';
        sortTemporadas.style.display = 'none';
    } else {
        sortDirector.style.display = 'none';
        sortTemporadas.style.display = 'block';
    }

    document.getElementById('sortBy').value = 'nombre';
    ascending = true;
    document.getElementById('btnToggleOrder').textContent = '⬆ Ascendente';
}

// ============ ORDENAMIENTO ============
function toggleOrder() {
    ascending = !ascending;
    document.getElementById('btnToggleOrder').textContent = ascending ? '⬆ Ascendente' : '⬇ Descendente';
    renderItems();
}

function ordenarItems(items) {
    const criterio = document.getElementById('sortBy').value;
    const sorted = [...items];

    sorted.sort((a, b) => {
        let valA, valB;

        switch (criterio) {
            case 'nombre':
                valA = a.nombre.toLowerCase();
                valB = b.nombre.toLowerCase();
                break;
            case 'año':
                valA = Number(a.año);
                valB = Number(b.año);
                break;
            case 'director':
                valA = (a.director || '').toLowerCase();
                valB = (b.director || '').toLowerCase();
                break;
            case 'temporadas':
                valA = Number(a.temporadas || 0);
                valB = Number(b.temporadas || 0);
                break;
            default:
                valA = a.nombre.toLowerCase();
                valB = b.nombre.toLowerCase();
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });

    return sorted;
}

document.addEventListener('DOMContentLoaded', () => {
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', renderItems);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') cerrarDetalle();
    });

    // Scroll horizontal con la rueda del ratón sobre el carrusel
    const grid = document.getElementById('itemsGrid');
    if (grid) {
        grid.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                event.preventDefault();
                grid.scrollLeft += event.deltaY;
            }
        }, { passive: false });
    }

    // La portada no queda vacía: las series ya cargadas sirven como catálogo inicial.
    cargarSeries();
});

// ============ FORMULARIOS DESPLEGABLES ============
function mostrarFormulario(tipo) {
    const configuracion = {
        pelicula: { panel: 'panelPelicula', boton: 'btnNuevaPelicula' },
        serie: { panel: 'panelSerie', boton: 'btnNuevaSerie' }
    };
    const seleccionado = configuracion[tipo];
    if (!seleccionado) return;

    const panel = document.getElementById(seleccionado.panel);
    const yaEstabaAbierto = !panel.hidden;

    Object.values(configuracion).forEach(({ panel: panelId, boton: botonId }) => {
        document.getElementById(panelId).hidden = true;
        const boton = document.getElementById(botonId);
        boton.classList.remove('is-active');
        boton.setAttribute('aria-expanded', 'false');
    });

    if (!yaEstabaAbierto) {
        panel.hidden = false;
        const botonActivo = document.getElementById(seleccionado.boton);
        botonActivo.classList.add('is-active');
        botonActivo.setAttribute('aria-expanded', 'true');
        panel.querySelector('input').focus();
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ============ RENDERIZAR ============
function renderItems() {
    const grid = document.getElementById('itemsGrid');

    if (!currentData || currentData.length === 0) {
        const emptyIcon = currentType === 'peliculas' ? '🎬' : '📺';
        grid.innerHTML = `
            <div class="empty-msg">
                <span class="big-icon">${emptyIcon}</span>
                No hay ${currentType === 'peliculas' ? 'películas' : 'series'} para mostrar
            </div>
        `;
        return;
    }

    const sorted = ordenarItems(currentData);

    const cardSizes = [
        'narrow short', 'regular tall', 'wide medium', 'narrow tall',
        'regular medium', 'wide tall', 'narrow medium', 'regular short'
    ];
    let html = '';
    sorted.forEach((item, index) => {
        let detalles = '';
        let icono = '🎬';
        let colorClass = 'card-color-' + (index % 10);

        if (currentType === 'peliculas') {
            icono = '🎬';
            detalles = `Director: ${escapeHtml(item.director)}`;
            if (item.año) detalles += ` · ${item.año}`;
        } else {
            icono = '📺';
            detalles = `${item.año} · ${item.temporadas} temporada${item.temporadas !== 1 ? 's' : ''}`;
        }

        const image = item.imagen || obtenerImagen(item.nombre);
        const safeName = escapeHtml(item.nombre);

        html += `
            <article class="item-card ${cardSizes[index % cardSizes.length]}" role="button" tabindex="0" onclick="abrirDetalle('${encodeURIComponent(item.nombre)}', '${currentType}')" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalle('${encodeURIComponent(item.nombre)}', '${currentType}'); }">
                <div class="card-image ${colorClass}">
                    <img src="${escapeHtml(image)}" alt="${safeName}" loading="lazy">
                    <div class="card-shade"></div>
                    <span class="card-type">${currentType === 'peliculas' ? 'Película' : 'Serie'}</span>
                </div>
                <div class="card-content" aria-label="Información de ${safeName}">
                    <div class="item-name">${safeName}</div>
                    <div class="item-details">
                        ${detalles}
                    </div>
                </div>
                <button class="btn-delete" onclick="event.stopPropagation(); eliminarItem('${escapeHtml(item.nombre)}')" title="Eliminar">✕</button>
            </article>
        `;
    });

    grid.innerHTML = html;
}

// ============ DETALLE DEL CONTENIDO ============
async function abrirDetalle(nombreCodificado, tipo) {
    const nombre = decodeURIComponent(nombreCodificado);
    const modal = document.getElementById('detailModal');
    const contenido = document.getElementById('detailModalContent');
    modal.hidden = false;
    document.body.classList.add('detail-is-open');
    contenido.innerHTML = '<div class="detail-loading"><div class="loading-spinner"></div><p>Cargando información...</p></div>';

    try {
        const response = await fetch(`/api/detalle?tipo=${encodeURIComponent(tipo)}&nombre=${encodeURIComponent(nombre)}`);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const item = await response.json();
        const imagen = item.imagen || obtenerImagen(item.nombre);
        const ficha = [
            ['Tipo', tipo === 'peliculas' ? 'Película' : 'Serie'],
            ['Estreno', item.año || '—'],
            ...(item.director ? [['Director', item.director]] : []),
            ...(item.temporadas ? [['Temporadas', item.temporadas]] : []),
            ...(item.elenco ? [['Elenco', item.elenco]] : [])
        ];

        contenido.innerHTML = `
            <div class="detail-visual"><img src="${escapeHtml(imagen)}" alt="${escapeHtml(item.nombre)}"></div>
            <div class="detail-copy">
                <p class="eyebrow">${tipo === 'peliculas' ? 'Película' : 'Serie'} · ${escapeHtml(String(item.año || ''))}</p>
                <h2 id="detailTitle">${escapeHtml(item.nombre)}</h2>
                ${item.descripcion ? `<p class="detail-description">${escapeHtml(item.descripcion)}</p>` : '<p class="detail-description">Información próximamente disponible.</p>'}
                ${item.leyenda ? `<p class="detail-quote">"${escapeHtml(item.leyenda)}"</p>` : ''}
                <div class="detail-buttons">
                    ${item.trailer ? `<button class="btn-trailer" onclick="reproducirTrailer('${escapeHtml(item.trailer)}')">▶ Ver trailer</button>` : ''}
                    ${item.enlace ? `<button class="btn-watch" onclick="window.open('${escapeHtml(item.enlace)}', '_blank')">▶ Ver ${tipo === 'peliculas' ? 'película' : 'serie'}</button>` : ''}
                </div>
                <dl class="detail-facts">
                    ${ficha.map(([etiqueta, valor]) => `<div><dt>${escapeHtml(etiqueta)}</dt><dd>${escapeHtml(String(valor))}</dd></div>`).join('')}
                </dl>
            </div>
        `;
        document.querySelector('.btn-back-catalog').focus();
    } catch (error) {
        contenido.innerHTML = `<div class="detail-error"><h2 id="detailTitle">No pudimos abrir este contenido</h2><p>${escapeHtml(error.message)}. Intentá nuevamente.</p></div>`;
    }
}

function cerrarDetalle() {
    const modal = document.getElementById('detailModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('detail-is-open');
}

// ============ AGREGAR ============
async function agregarPelicula(event) {
    event.preventDefault();
    const nombre = document.getElementById('movieNombre').value.trim();
    const director = document.getElementById('movieDirector').value.trim();
    const año = document.getElementById('movieAnio').value.trim();
    const descripcion = document.getElementById('movieDesc').value.trim();
    const imagen = document.getElementById('movieImagen').value.trim();
    const leyenda = document.getElementById('movieLeyenda').value.trim();
    const trailer = document.getElementById('movieTrailer').value.trim();
    const enlace = document.getElementById('movieEnlace').value.trim();

    const msgDiv = document.getElementById('msgPelicula');
    msgDiv.className = 'message';

    try {
        const response = await fetch('/api/catalogo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'peliculas', nombre, director, año: parseInt(año, 10), descripcion, imagen, leyenda, trailer, enlace })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.className = 'message success';
            msgDiv.innerHTML = '✅ Película agregada correctamente<br><img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmRuaGY4dXFjeTQ0cmwzZzZtN3djeGhncXlmejVsZjkwbmozcnpzMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vmon3eAOp1WfK/giphy.gif" alt="Éxito" class="msg-gif">';
            document.getElementById('formPelicula').reset();
            if (currentType === 'peliculas') cargarPeliculas();
        } else {
            msgDiv.className = 'message error';
            msgDiv.textContent = '❌ ' + data.error;
        }
    } catch (err) {
        msgDiv.className = 'message error';
        msgDiv.textContent = '❌ Error de conexión';
    }

    setTimeout(() => { msgDiv.className = 'message'; }, 3000);
}

async function agregarSerie(event) {
    event.preventDefault();
    const nombre = document.getElementById('serieNombre').value.trim();
    const año = document.getElementById('serieAnio').value.trim();
    const temporadas = document.getElementById('serieTemporadas').value.trim();
    const descripcion = document.getElementById('serieDesc').value.trim();
    const imagen = document.getElementById('serieImagen').value.trim();
    const leyenda = document.getElementById('serieLeyenda').value.trim();
    const trailer = document.getElementById('serieTrailer').value.trim();
    const enlace = document.getElementById('serieEnlace').value.trim();

    const msgDiv = document.getElementById('msgSerie');
    msgDiv.className = 'message';

    try {
        const response = await fetch('/api/catalogo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'series', nombre, año: parseInt(año, 10), temporadas: parseInt(temporadas, 10), descripcion, imagen, leyenda, trailer, enlace })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.className = 'message success';
            msgDiv.innerHTML = '✅ Serie agregada correctamente<br><img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmRuaGY4dXFjeTQ0cmwzZzZtN3djeGhncXlmejVsZjkwbmozcnpzMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vmon3eAOp1WfK/giphy.gif" alt="Éxito" class="msg-gif">';
            document.getElementById('formSerie').reset();
            if (currentType === 'series') cargarSeries();
        } else {
            msgDiv.className = 'message error';
            msgDiv.textContent = '❌ ' + data.error;
        }
    } catch (err) {
        msgDiv.className = 'message error';
        msgDiv.textContent = '❌ Error de conexión';
    }

    setTimeout(() => { msgDiv.className = 'message'; }, 3000);
}

// ============ ELIMINAR ============
async function eliminarItem(nombre) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;

    try {
        const response = await fetch(`/api/catalogo?tipo=${encodeURIComponent(currentType)}&nombre=${encodeURIComponent(nombre)}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            if (currentType === 'peliculas') cargarPeliculas();
            else cargarSeries();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Error de conexión');
    }
}

// ============ UTILIDADES ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Los archivos .txt guardan sólo los campos exigidos por la consigna.
// Esta tabla mantiene las imágenes como una decisión exclusiva de la interfaz.
function obtenerImagen(nombre) {
    const imagenes = {
        '2001 odisea en el espacio': '/images/2001odisea.webp',
        'matrix': '/images/matrix-fondo.avif',
        inception: '/images/inception.jpg',
        'black mirror': '/images/blackmirror.webp',
        'la casa de papel': '/images/la casa de pepel.webp',
        'better call saul': '/images/better call saul.jpg',
        undone: '/images/undone.webp',
        'hackers: piratas informáticos': '/images/hackers.webp'

    };
    return imagenes[nombre.toLowerCase()] || '/images/matrix-cartel.jpg';
}

function obtenerIdYouTube(url) {
    if (!url) return null;
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function reproducirTrailer(urlTrailer) {
    const videoId = obtenerIdYouTube(urlTrailer);
    if (!videoId) {
        alert('No se pudo extraer el ID del video de YouTube');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'trailerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; width: 90%; max-width: 900px; aspect-ratio: 16/9;">
            <button onclick="document.getElementById('trailerModal').remove()" style="
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
            ">✕</button>
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

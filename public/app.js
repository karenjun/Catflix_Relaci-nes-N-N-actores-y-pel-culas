// ============ ESTADO ============
let currentData = [];
let currentView = ''; // 'peliculas' o 'actores'
let searchTimeout = null;

// ============ CARGAR PELÍCULAS ============
async function cargarPeliculas(searchTerm) {
    currentView = 'peliculas';
    document.getElementById('btnMovies').classList.add('btn-active');
    const btnActores = document.getElementById('btnActores');
    if (btnActores) btnActores.classList.remove('btn-active');

    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Cargando películas...</p>
        </div>
    `;

    try {
        let url = '/peliculas';
        if (searchTerm && searchTerm.trim()) {
            url += '?search=' + encodeURIComponent(searchTerm.trim());
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error ' + response.status);
        currentData = await response.json();
        renderPeliculas();
    } catch (err) {
        grid.innerHTML = `<p class="error-text">❌ Error al cargar películas: ${err.message}</p>`;
    }
}

// ============ CARGAR ACTORES ============
async function cargarActores(searchTerm) {
    currentView = 'actores';
    document.getElementById('btnActores').classList.add('btn-active');
    const btnMovies = document.getElementById('btnMovies');
    if (btnMovies) btnMovies.classList.remove('btn-active');

    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Cargando actores...</p>
        </div>
    `;

    try {
        let url = '/actores';
        if (searchTerm && searchTerm.trim()) {
            url += '?search=' + encodeURIComponent(searchTerm.trim());
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error ' + response.status);
        currentData = await response.json();
        renderActores();
    } catch (err) {
        grid.innerHTML = `<p class="error-text">❌ Error al cargar actores: ${err.message}</p>`;
    }
}

// ============ RENDERIZAR PELÍCULAS ============
function renderPeliculas() {
    const grid = document.getElementById('itemsGrid');

    if (!currentData || currentData.length === 0) {
        grid.innerHTML = `
            <div class="empty-msg">
                <span class="big-icon">🎬</span>
                No hay películas para mostrar. ¡Agrega una!
            </div>
        `;
        return;
    }

    const cardSizes = [
        'short', 'tall', 'medium', 'tall',
        'short', 'medium', 'tall', 'medium'
    ];

    let html = '';
    currentData.forEach((item, index) => {
        const imagen = item.imagen || '';

        // Mostrar solo los primeros 3 actores con "..." y "ver más"
        const actores = item.Actors && item.Actors.length > 0
            ? item.Actors.slice(0, 3).map(a => escapeHtml(a.nombre))
            : [];
        const tieneMas = item.Actors && item.Actors.length > 3;
        let repartoHtml = '';
        if (actores.length > 0) {
            repartoHtml = actores.join(', ');
            if (tieneMas) {
                repartoHtml += '... <span class="ver-mas" onclick="event.stopPropagation(); abrirDetallePelicula(' + item.id + ')">ver m&aacute;s</span>';
            }
            repartoHtml = '<div class="item-reparto">' + repartoHtml + '</div>';
        }

        const sizeClass = cardSizes[index % cardSizes.length];

        html += `
            <article class="item-card ${sizeClass}" data-id="${item.id}" role="button" tabindex="0" onclick="abrirDetallePelicula(${item.id})" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetallePelicula(${item.id}); }">
                <button type="button" class="btn-delete" onclick="event.stopPropagation(); eliminarPelicula(${item.id})" aria-label="Eliminar ${escapeHtml(item.titulo)}" title="Eliminar película">✕</button>
                <div class="card-image">
                    ${imagen ? `<img src="${escapeHtml(imagen)}" alt="${escapeHtml(item.titulo)}" loading="lazy">` : ''}
                    <span class="card-type">Película</span>
                </div>
                <div class="card-content">
                    <div class="item-name">${escapeHtml(item.titulo)}</div>
                    <div class="item-subtitle">${item.anio}</div>
                    ${repartoHtml}
                </div>
            </article>
        `;
    });

    grid.innerHTML = html;
}

// ============ RENDERIZAR ACTORES ============
function renderActores() {
    const grid = document.getElementById('itemsGrid');

    if (!currentData || currentData.length === 0) {
        grid.innerHTML = `
            <div class="empty-msg">
                <span class="big-icon">🎭</span>
                No hay actores para mostrar. ¡Agrega uno!
            </div>
        `;
        return;
    }

    const cardSizes = [
        'short', 'tall', 'medium', 'tall',
        'short', 'medium', 'tall', 'medium'
    ];

    let html = '';
    currentData.forEach((item, index) => {
        const peliculas = item.Peliculas && item.Peliculas.length > 0
            ? item.Peliculas.map(p => escapeHtml(p.titulo)).join(', ')
            : 'Ninguna';
        const tienePelis = item.Peliculas && item.Peliculas.length > 0;

        const imagen = item.imagen || '';
        const signo = item.signo_zodiacal || '';
        const sizeClass = cardSizes[index % cardSizes.length];

        const fechaNac = item.fecha_nacimiento || 'Fecha desconocida';

        html += `
            <article class="item-card ${sizeClass}" data-id="${item.id}" role="button" tabindex="0" onclick="abrirDetalleActor(${item.id})" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalleActor(${item.id}); }">
                <div class="card-image">
                    ${imagen ? `<img src="${escapeHtml(imagen)}" alt="${escapeHtml(item.nombre)}" loading="lazy">` : ''}
                    <span class="card-type">Actor</span>
                </div>
                <div class="card-content">
                    <div class="item-name">${escapeHtml(item.nombre)}</div>
                    <div class="item-subtitle">${escapeHtml(fechaNac)}</div>
                    ${signo ? `<div class="item-subtitle2">${escapeHtml(signo)}</div>` : ''}
                    ${tienePelis ? `<div class="item-reparto">Pel&iacute;culas: ${escapeHtml(peliculas)}</div>` : ''}
                </div>
            </article>
        `;
    });

    grid.innerHTML = html;
}

// ============ DETALLE DE PELÍCULA ============
async function abrirDetallePelicula(id) {
    const modal = document.getElementById('detailModal');
    const contenido = document.getElementById('detailModalContent');
    modal.hidden = false;
    document.body.classList.add('detail-is-open');
    contenido.innerHTML = '<div class="detail-loading"><div class="loading-spinner"></div><p>Cargando información...</p></div>';

    try {
        const response = await fetch(`/peliculas`);
        const peliculas = await response.json();
        const pelicula = peliculas.find(p => p.id === id);

        if (!pelicula) {
            contenido.innerHTML = `<div class="detail-error"><h2 id="detailTitle">Película no encontrada</h2></div>`;
            return;
        }

        const imagenPelicula = pelicula.imagen || '';
        const actores = pelicula.Actors || [];

        // Grid de reparto principal: fotos cuadradas medianas clickeables
        let repartoHtml = '';
        if (actores.length > 0) {
            repartoHtml = actores.map(a => `
                <div class="cast-item" role="button" tabindex="0" onclick="abrirDetalleActor(${a.id})" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalleActor(${a.id}); }">
                    <div class="cast-foto">
                        ${a.imagen ? `<img src="${escapeHtml(a.imagen)}" alt="${escapeHtml(a.nombre)}" loading="lazy">` : '<span class="cast-placeholder">🎭</span>'}
                    </div>
                    <div class="cast-nombre">${escapeHtml(a.nombre)}</div>
                </div>
            `).join('');
        } else {
            repartoHtml = '<p class="sin-reparto">Sin actores asignados aún.</p>';
        }

        contenido.innerHTML = `
            <div class="detail-visual">
                <div class="detail-visual-info">
                    <p class="eyebrow">Película · ${pelicula.anio}</p>
                    <h2 id="detailTitle">${escapeHtml(pelicula.titulo)}</h2>
                </div>
                ${imagenPelicula ? `<img src="${escapeHtml(imagenPelicula)}" alt="${escapeHtml(pelicula.titulo)}">` : ''}
            </div>
            <div class="detail-copy">
                <div class="detail-facts">
                    <div><dt>Año</dt><dd>${pelicula.anio}</dd></div>
                    <div><dt>Reparto</dt><dd>${actores.length} actores</dd></div>
                </div>
                <h3>Reparto principal</h3>
                <div class="cast-grid">${repartoHtml}</div>
            </div>
        `;
    } catch (error) {
        contenido.innerHTML = `<div class="detail-error"><h2 id="detailTitle">Error al cargar detalle</h2><p>${escapeHtml(error.message)}</p></div>`;
    }
}

// ============ DETALLE DE ACTOR ============
async function abrirDetalleActor(id) {
    const modal = document.getElementById('detailModal');
    const contenido = document.getElementById('detailModalContent');
    modal.hidden = false;
    document.body.classList.add('detail-is-open');
    contenido.innerHTML = '<div class="detail-loading"><div class="loading-spinner"></div><p>Cargando información...</p></div>';

    try {
        const response = await fetch(`/actores`);
        const actores = await response.json();
        const actor = actores.find(a => a.id === id);

        if (!actor) {
            contenido.innerHTML = `<div class="detail-error"><h2 id="detailTitle">Actor no encontrado</h2></div>`;
            return;
        }

        const imagenActor = actor.imagen || '';
        const signo = actor.signo_zodiacal || '';
        const peliculas = actor.Peliculas || [];

        // Grid de filmografía: fotos cuadradas medianas clickeables
        let filmografiaHtml = '';
        if (peliculas.length > 0) {
            filmografiaHtml = peliculas.map(p => `
                <div class="cast-item" role="button" tabindex="0" onclick="abrirDetallePelicula(${p.id})" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetallePelicula(${p.id}); }">
                    <div class="cast-foto">
                        ${p.imagen ? `<img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.titulo)}" loading="lazy">` : '<span class="cast-placeholder">🎬</span>'}
                    </div>
                    <div class="cast-nombre">${escapeHtml(p.titulo)}</div>
                    <div class="cast-sub">${p.anio}</div>
                </div>
            `).join('');
        } else {
            filmografiaHtml = '<p class="sin-reparto">Sin películas asignadas aún.</p>';
        }

        contenido.innerHTML = `
            <div class="detail-visual">
                <div class="detail-visual-info">
                    <p class="eyebrow">Actor</p>
                    <h2 id="detailTitle">${escapeHtml(actor.nombre)}</h2>
                </div>
                ${imagenActor ? `<img src="${escapeHtml(imagenActor)}" alt="${escapeHtml(actor.nombre)}">` : ''}
            </div>
            <div class="detail-copy">
                <div class="detail-facts">
                    <div><dt>Fecha de nacimiento</dt><dd>${actor.fecha_nacimiento ? actor.fecha_nacimiento : 'Desconocida'}</dd></div>
                    ${signo ? `<div><dt>Signo zodiacal</dt><dd>${escapeHtml(signo)}</dd></div>` : ''}
                    <div><dt>Películas</dt><dd>${peliculas.length} películas</dd></div>
                </div>
                <h3>Filmografía</h3>
                <div class="cast-grid">${filmografiaHtml}</div>
            </div>
        `;
    } catch (error) {
        contenido.innerHTML = `<div class="detail-error"><h2 id="detailTitle">Error al cargar detalle</h2><p>${escapeHtml(error.message)}</p></div>`;
    }
}

function cerrarDetalle() {
    const modal = document.getElementById('detailModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('detail-is-open');
}

// ============ FORMULARIOS DESPLEGABLES ============
function mostrarFormulario(tipo) {
    const configuracion = {
        pelicula: { panel: 'panelPelicula', boton: 'btnNuevaPelicula' },
        actor: { panel: 'panelActor', boton: 'btnNuevoActor' },
        asignar: { panel: 'panelAsignar', boton: 'btnAsignar' }
    };
    const seleccionado = configuracion[tipo];
    if (!seleccionado) return;

    const panel = document.getElementById(seleccionado.panel);
    const yaEstabaAbierto = !panel.hidden;

    Object.values(configuracion).forEach(({ panel: panelId, boton: botonId }) => {
        document.getElementById(panelId).hidden = true;
        const boton = document.getElementById(botonId);
        if (boton) {
            boton.classList.remove('is-active');
            boton.setAttribute('aria-expanded', 'false');
        }
    });

    if (!yaEstabaAbierto) {
        panel.hidden = false;
        const botonActivo = document.getElementById(seleccionado.boton);
        if (botonActivo) {
            botonActivo.classList.add('is-active');
            botonActivo.setAttribute('aria-expanded', 'true');
        }

        // Si es el formulario de asignar, cargar los selects
        if (tipo === 'asignar') {
            cargarSelectsAsignar();
        }

        const firstInput = panel.querySelector('input, select');
        if (firstInput) firstInput.focus();
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ============ CARGAR SELECTS PARA ASIGNAR ============
async function cargarSelectsAsignar() {
    try {
        // Cargar películas
        const resPelis = await fetch('/peliculas');
        const peliculas = await resPelis.json();
        const selectPeli = document.getElementById('asignarPelicula');
        selectPeli.innerHTML = '<option value="">Selecciona una película...</option>';
        peliculas.forEach(p => {
            selectPeli.innerHTML += `<option value="${p.id}">${escapeHtml(p.titulo)} (${p.anio})</option>`;
        });

        // Cargar actores
        const resActores = await fetch('/actores');
        const actores = await resActores.json();
        const selectActor = document.getElementById('asignarActor');
        selectActor.innerHTML = '<option value="">Selecciona un actor...</option>';
        actores.forEach(a => {
            selectActor.innerHTML += `<option value="${a.id}">${escapeHtml(a.nombre)}</option>`;
        });
    } catch (err) {
        console.error('Error cargando selects:', err);
    }
}

// ============ AGREGAR PELÍCULA ============
async function agregarPelicula(event) {
    event.preventDefault();
    const titulo = document.getElementById('movieTitulo').value.trim();
    const anio = document.getElementById('movieAnio').value.trim();

    const msgDiv = document.getElementById('msgPelicula');
    msgDiv.className = 'message is-loading';
    msgDiv.innerHTML = '<div class="loading-spinner"></div><span>Cargando película...</span>';

    try {
        const response = await fetch('/peliculas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, anio: parseInt(anio, 10) })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.className = 'message success';
            msgDiv.textContent = '✅ Película añadida con éxito';
            document.getElementById('formPelicula').reset();

            // Limpiar búsqueda y recargar el catálogo para mostrar la nueva película
            limpiarBusqueda();
            await cargarPeliculas('');
            resaltarNuevoElemento(data.pelicula ? data.pelicula.id : null);
        } else {
            msgDiv.className = 'message error';
            msgDiv.textContent = '❌ ' + (data.error || 'No se ha podido encontrar la película, por favor verifique el título.');
        }
    } catch (err) {
        msgDiv.className = 'message error';
        msgDiv.textContent = '❌ Error de conexión';
    }

    // Mostrar el mensaje durante 15 segundos
    setTimeout(() => { msgDiv.className = 'message'; }, 15000);
}

// ============ AGREGAR ACTOR ============
async function agregarActor(event) {
    event.preventDefault();
    const nombre = document.getElementById('actorNombre').value.trim();
    const fecha_nacimiento = document.getElementById('actorFecha').value;
    const imagen = document.getElementById('actorImagen').value.trim();

    const msgDiv = document.getElementById('msgActor');
    msgDiv.className = 'message is-loading';
    msgDiv.innerHTML = '<div class="loading-spinner"></div><span>Cargando actor...</span>';

    try {
        const response = await fetch('/actores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                fecha_nacimiento: fecha_nacimiento || undefined,
                imagen: imagen || undefined
            })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.className = 'message success';
            msgDiv.textContent = '✅ Actor agregado con éxito';
            document.getElementById('formActor').reset();

            // Limpiar búsqueda y recargar el catálogo para mostrar el nuevo actor
            limpiarBusqueda();
            await cargarActores('');
            const nuevoId = data.id || (data.actor && data.actor.id) || null;
            resaltarNuevoElemento(nuevoId);
        } else {
            msgDiv.className = 'message error';
            msgDiv.textContent = '❌ ' + data.error;
        }
    } catch (err) {
        msgDiv.className = 'message error';
        msgDiv.textContent = '❌ Error de conexión';
    }

    // Mostrar el mensaje durante 15 segundos
    setTimeout(() => { msgDiv.className = 'message'; }, 15000);
}

// ============ ELIMINAR PELÍCULA ============
async function eliminarPelicula(id) {
    const pelicula = currentData.find(p => p.id === id);
    if (!pelicula) return;

    const confirmar = confirm(`¿Eliminar la película "${pelicula.titulo}"?\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
        const response = await fetch(`/peliculas/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            // Recargar la vista para reflejar la eliminación
            if (currentView === 'peliculas') cargarPeliculas(getSearchValue());
            else cargarPeliculas('');
        } else {
            alert('❌ ' + (data.error || 'Error al eliminar la película.'));
        }
    } catch (err) {
        alert('❌ Error de conexión al eliminar la película.');
    }
}

// ============ RESALTAR ELEMENTO RECIÉN AGREGADO ============
function resaltarNuevoElemento(id) {
    if (!id) return;
    const card = document.querySelector(`.item-card[data-id="${id}"]`);
    if (!card) return;

    // Llevar al usuario hasta el producto cargado
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Iluminarlo de rojo por 15 segundos
    card.classList.add('flash-new');
    setTimeout(() => {
        card.classList.remove('flash-new');
    }, 15000);
}

// ============ LIMPIAR BÚSQUEDA ============
function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = 'none';
}

// ============ ASIGNAR ACTOR A PELÍCULA ============
async function asignarActor(event) {
    event.preventDefault();
    const pelicula_id = parseInt(document.getElementById('asignarPelicula').value, 10);
    const actor_id = parseInt(document.getElementById('asignarActor').value, 10);

    const msgDiv = document.getElementById('msgAsignar');
    msgDiv.className = 'message';

    try {
        const response = await fetch('/asignar-actor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pelicula_id, actor_id })
        });

        const data = await response.json();

        if (response.ok) {
            msgDiv.className = 'message success';
            msgDiv.textContent = `✅ ${data.mensaje}`;
            // Recargar la vista actual para reflejar cambios
            if (currentView === 'peliculas') cargarPeliculas(getSearchValue());
            else if (currentView === 'actores') cargarActores(getSearchValue());
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

// ============ BÚSQUEDA ============
function getSearchValue() {
    const searchInput = document.getElementById('searchInput');
    return searchInput ? searchInput.value : '';
}

function handleSearchInput() {
    // Limpiar el timeout anterior para hacer debounce
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        const searchTerm = getSearchValue();
        const clearBtn = document.getElementById('searchClear');

        // Mostrar/ocultar botón de limpiar
        if (clearBtn) {
            clearBtn.style.display = searchTerm.trim() ? 'flex' : 'none';
        }

        // Recargar según la vista actual
        if (currentView === 'peliculas') {
            cargarPeliculas(searchTerm);
        } else if (currentView === 'actores') {
            cargarActores(searchTerm);
        }
    }, 300); // 300ms de debounce
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    // Recargar según la vista actual
    if (currentView === 'peliculas') {
        cargarPeliculas('');
    } else if (currentView === 'actores') {
        cargarActores('');
    }
    // Enfocar el input
    if (searchInput) searchInput.focus();
}

// ============ SCROLL A FORMULARIOS ============
function scrollAFormularios() {
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') cerrarDetalle();
    });

    // Configurar eventos de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }

    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
        searchClear.addEventListener('click', clearSearch);
        searchClear.style.display = 'none'; // Oculto inicialmente
    }

    // Cargar películas por defecto
    cargarPeliculas();
});

// ============ UTILIDADES ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
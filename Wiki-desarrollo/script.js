// ==================== */
// NOTIFICACIONES
// ==================== */

function mostrarNotificacion(mensaje) {
    const notificacionExistente = document.querySelector('.notificacion-flotante');
    const overlayExistente = document.querySelector('.overlay-oscuro');
    if (notificacionExistente) notificacionExistente.remove();
    if (overlayExistente) overlayExistente.remove();

    const overlay = document.createElement('div');
    overlay.className = 'overlay-oscuro';
    document.body.prepend(overlay);

    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);

    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-flotante';
    notificacion.innerHTML = `
        <span class="notificacion-icono">✅</span>
        <span class="notificacion-mensaje">${mensaje}</span>
        <span class="notificacion-progreso"></span>
    `;

    document.body.prepend(notificacion);

    setTimeout(() => {
        notificacion.classList.add('visible');
    }, 10);

    setTimeout(() => {
        notificacion.classList.remove('visible');
        overlay.classList.remove('visible');
        setTimeout(() => {
            notificacion.remove();
            overlay.remove();
        }, 500);
    }, 3000);
}

// ==================== */
// GUARDAR Y CARGAR CAMBIOS CON LOCALSTORAGE
// ==================== */

function guardarCambios() {
    const contenido = document.documentElement.outerHTML;
    localStorage.setItem('wiki-contenido', contenido);
    localStorage.setItem('wiki-fecha', new Date().toLocaleString());
    guardarEstilosPersonalizados();
    mostrarNotificacion('✅ ¡Cambios guardados!');
}

function guardarEstilosPersonalizados() {
    const estilos = {};
    const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];

    const bodyStyles = window.getComputedStyle(document.body);
    estilos.body = {
        background: document.body.style.background || '',
        color: document.body.style.color || '',
        fontSize: document.body.style.fontSize || '',
        fontFamily: document.body.style.fontFamily || ''
    };

    const header = document.querySelector('header');
    if (header) {
        estilos.header = {
            background: header.style.background || '',
            color: header.style.color || ''
        };
    }

    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            estilos[id] = {
                background: el.style.background || '',
                color: el.style.color || '',
                fontSize: el.style.fontSize || '',
                fontFamily: el.style.fontFamily || ''
            };
        }
    });

    localStorage.setItem('wiki-estilos', JSON.stringify(estilos));
}

function cargarEstilosPersonalizados() {
    const estilosGuardados = localStorage.getItem('wiki-estilos');
    if (!estilosGuardados) return {};
    try {
        return JSON.parse(estilosGuardados);
    } catch {
        return {};
    }
}

function verVistaFinal() {
    const contenido = document.documentElement.outerHTML;
    localStorage.setItem('wiki-contenido', contenido);
    guardarEstilosPersonalizados();

    const contenidoGuardado = localStorage.getItem('wiki-contenido');
    const estilosGuardados = cargarEstilosPersonalizados();

    if (!contenidoGuardado) {
        window.open('vista-final.html', '_blank');
        return;
    }

    const bodyMatch = contenidoGuardado.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let contenidoBody = bodyMatch ? bodyMatch[1] : '';

    // ELIMINAR botones de la vista final
    contenidoBody = contenidoBody
        .replace(/<div[^>]*class="seccion-botones"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="panel-controls"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<button[^>]*class="btn-insertar"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="insertarImagen[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="insertarVideo[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="agregarPanel[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="cambiarLayout[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<div[^>]*style="margin-top:15px;"[^>]*>[\s\S]*?<\/div>/gi, (match) => {
            if (match.includes('btn-vista-final') || match.includes('Ver Vista Final')) {
                return '';
            }
            return match;
        });

    const footerMatch = contenidoBody.match(/<footer>([\s\S]*?)<\/footer>/i);
    if (footerMatch) {
        let footerContent = footerMatch[1];
        footerContent = footerContent
            .replace(/<button[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<div[^>]*style="margin-top:15px;"[^>]*>[\s\S]*?<\/div>/gi, '');
        contenidoBody = contenidoBody.replace(/<footer>[\s\S]*?<\/footer>/i, `<footer>${footerContent}</footer>`);
    }

    const styleMatch = contenidoGuardado.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const estilos = styleMatch ? styleMatch[1] : '';

    let cssPersonalizado = '';

    if (estilosGuardados.body) {
        const s = estilosGuardados.body;
        if (s.background) cssPersonalizado += `body { background: ${s.background} !important; }\n`;
        if (s.color) cssPersonalizado += `body { color: ${s.color} !important; }\n`;
        if (s.fontSize) cssPersonalizado += `body { font-size: ${s.fontSize} !important; }\n`;
        if (s.fontFamily) cssPersonalizado += `body { font-family: ${s.fontFamily} !important; }\n`;
    }

    if (estilosGuardados.header) {
        const s = estilosGuardados.header;
        if (s.background) cssPersonalizado += `header { background: ${s.background} !important; }\n`;
        if (s.color) cssPersonalizado += `header { color: ${s.color} !important; }\n`;
    }

    const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];
    secciones.forEach(id => {
        if (estilosGuardados[id]) {
            const s = estilosGuardados[id];
            if (s.background) cssPersonalizado += `#${id} { background: ${s.background} !important; }\n`;
            if (s.color) cssPersonalizado += `#${id} { color: ${s.color} !important; }\n`;
            if (s.fontSize) cssPersonalizado += `#${id} { font-size: ${s.fontSize} !important; }\n`;
            if (s.fontFamily) cssPersonalizado += `#${id} { font-family: ${s.fontFamily} !important; }\n`;
            if (s.color) cssPersonalizado += `#${id} * { color: ${s.color} !important; }\n`;
            if (s.fontSize) cssPersonalizado += `#${id} * { font-size: ${s.fontSize} !important; }\n`;
        }
    });

    const vistaFinal = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wiki: Planes de Carrera - Vista Final</title>
    <link rel="stylesheet" href="style-final.css">
    <style>
        .edit-notice, .save-button, .btn-abrir-panel, .panel-personalizacion,
        .seccion-botones, .panel-controls, .btn-insertar {
            display: none !important;
        }
        [contenteditable="true"] {
            outline: none !important;
            background: transparent !important;
        }
        [contenteditable="true"]:hover,
        [contenteditable="true"]:focus {
            outline: none !important;
            background: transparent !important;
        }
        .overlay-oscuro, .notificacion-flotante {
            display: none !important;
        }
        ${estilos}
        ${cssPersonalizado}
    </style>
</head>
<body class="vista-final">
    ${contenidoBody}
</body>
</html>`;

    const ventana = window.open('', '_blank');
    if (ventana) {
        ventana.document.write(vistaFinal);
        ventana.document.close();
        mostrarNotificacion('👁️ Vista final abierta con los cambios');
    } else {
        mostrarNotificacion('⚠️ Permite ventanas emergentes para ver la vista final');
    }
}

function resetearPagina() {
    if (confirm('¿Seguro que quieres resetear la página? Perderás todos los cambios.')) {
        localStorage.removeItem('wiki-contenido');
        localStorage.removeItem('wiki-vista-final');
        localStorage.removeItem('wiki-fecha');
        localStorage.removeItem('wiki-estilos');
        location.reload();
    }
}

// ==================== */
// FUNCIONES PARA IMÁGENES, VIDEOS Y PANELES
// ==================== */

let seccionActualModal = '';
let tipoInsercionModal = '';

// Insertar imagen - abre modal
function insertarImagen(seccionId) {
    seccionActualModal = seccionId;
    tipoInsercionModal = 'imagen';
    mostrarModal('Insertar imagen', 'Ingresa la URL de la imagen:', 'https://ejemplo.com/imagen.png');
}

// Insertar video - abre modal
function insertarVideo(seccionId) {
    seccionActualModal = seccionId;
    tipoInsercionModal = 'video';
    mostrarModal('Insertar video', 'Ingresa la URL de YouTube:', 'https://www.youtube.com/watch?v=VIDEO_ID');
}

// Mostrar modal
function mostrarModal(titulo, label, placeholder) {
    // Crear modal si no existe
    let modal = document.getElementById('modalInsertar');
    if (!modal) {
        const modalHTML = `
            <div id="modalInsertar" class="modal-insertar">
                <div class="modal-contenido">
                    <h3 id="modalTitulo">${titulo}</h3>
                    <label id="modalLabel">${label}</label>
                    <input type="text" id="modalInput" placeholder="${placeholder}">
                    <div class="modal-botones">
                        <button onclick="confirmarInsercion()" class="btn-aceptar">✅ Insertar</button>
                        <button onclick="cerrarModal()" class="btn-cancelar">❌ Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalLabel').textContent = label;
        document.getElementById('modalInput').placeholder = placeholder;
        document.getElementById('modalInput').value = '';
    }
    document.getElementById('modalInsertar').classList.add('visible');
}

// Confirmar inserción - inserta imagen o video en el panel
function confirmarInsercion() {
    const input = document.getElementById('modalInput');
    const url = input.value.trim();
    if (!url) {
        alert('⚠️ Por favor ingresa una URL válida.');
        return;
    }

    const contenedor = document.getElementById('contenido-' + seccionActualModal);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        cerrarModal();
        return;
    }

    // Crear un nuevo panel
    const panel = document.createElement('div');
    panel.className = 'panel-editable';
    panel.dataset.id = 'panel-' + Date.now();

    const contenidoPanel = document.createElement('div');
    contenidoPanel.contentEditable = true;

    // Insertar según el tipo
    if (tipoInsercionModal === 'imagen') {
        contenidoPanel.innerHTML = `
            <div class="imagen-container" style="position:relative;display:inline-block;max-width:100%;">
                <img src="${url}" alt="Imagen insertada" style="max-width:100%;max-height:400px;border-radius:8px;margin:10px 0;cursor:pointer;">
                <button class="btn-eliminar-imagen" onclick="eliminarImagen(this)" style="position:absolute;top:5px;right:5px;background:rgba(231,76,60,0.9);color:white;border:none;border-radius:50%;width:25px;height:25px;cursor:pointer;font-size:0.8rem;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
            <p style="font-size:0.8rem;color:#888;margin-top:5px;"><em>Haz clic en la imagen para ajustar su tamaño</em></p>
        `;
        
        // Agregar evento para redimensionar imagen al hacer clic
        setTimeout(() => {
            const img = panel.querySelector('img');
            if (img) {
                img.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const nuevoAncho = prompt('Ingresa el ancho deseado (en px o %):', '100%');
                    if (nuevoAncho !== null) {
                        this.style.width = nuevoAncho;
                        this.style.maxHeight = 'none';
                    }
                });
            }
        }, 100);
        
    } else if (tipoInsercionModal === 'video') {
        let embedUrl = url;
        if (url.includes('watch?v=')) {
            const videoId = url.split('watch?v=')[1].split('&')[0];
            embedUrl = 'https://www.youtube.com/embed/' + videoId;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            embedUrl = 'https://www.youtube.com/embed/' + videoId;
        }
        contenidoPanel.innerHTML = `
            <iframe width="100%" height="315" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius:8px;margin:10px 0;"></iframe>
        `;
    }

    // Agregar controles del panel
    const controles = document.createElement('div');
    controles.className = 'panel-controls';
    controles.innerHTML = `
        <button onclick="moverPanel(this, 'up')">⬆️</button>
        <button onclick="moverPanel(this, 'down')">⬇️</button>
        <button onclick="duplicarPanel(this)">📋</button>
        <button onclick="eliminarPanel(this)" class="btn-eliminar">🗑️</button>
    `;

    panel.appendChild(contenidoPanel);
    panel.appendChild(controles);
    contenedor.appendChild(panel);

    cerrarModal();
    mostrarNotificacion('✅ Contenido insertado correctamente');
    
    // Guardar cambios automáticamente
    guardarCambios();
}

// Eliminar imagen
function eliminarImagen(btn) {
    if (confirm('¿Eliminar esta imagen?')) {
        const contenedor = btn.closest('.imagen-container');
        if (contenedor) contenedor.remove();
        mostrarNotificacion('🗑️ Imagen eliminada');
    }
}

// Cerrar modal
function cerrarModal() {
    const modal = document.getElementById('modalInsertar');
    if (modal) modal.classList.remove('visible');
}

// Agregar panel vacío
function agregarPanel(seccionId) {
    const contenedor = document.getElementById('contenido-' + seccionId);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'panel-editable';
    panel.dataset.id = 'panel-' + Date.now();

    const contenidoPanel = document.createElement('div');
    contenidoPanel.contentEditable = true;
    contenidoPanel.innerHTML = '<p><em>Escribe aquí tu contenido...</em></p>';

    const controles = document.createElement('div');
    controles.className = 'panel-controls';
    controles.innerHTML = `
        <button onclick="moverPanel(this, 'up')">⬆️</button>
        <button onclick="moverPanel(this, 'down')">⬇️</button>
        <button onclick="duplicarPanel(this)">📋</button>
        <button onclick="eliminarPanel(this)" class="btn-eliminar">🗑️</button>
    `;

    panel.appendChild(contenidoPanel);
    panel.appendChild(controles);
    contenedor.appendChild(panel);
    mostrarNotificacion('📦 Panel agregado');
}

// ==================== */
// FUNCIONES DE MOVIMIENTO DE PANELES
// ==================== */

function moverPanel(btn, direccion) {
    const panel = btn.closest('.panel-editable');
    if (!panel) return;

    const contenedor = panel.parentElement;
    const panels = [...contenedor.children];
    const index = panels.indexOf(panel);

    if (direccion === 'up' && index > 0) {
        contenedor.insertBefore(panel, panels[index - 1]);
        mostrarNotificacion('⬆️ Panel movido arriba');
    } else if (direccion === 'down' && index < panels.length - 1) {
        contenedor.insertBefore(panel, panels[index + 2]);
        mostrarNotificacion('⬇️ Panel movido abajo');
    }
}

function duplicarPanel(btn) {
    const panel = btn.closest('.panel-editable');
    if (!panel) return;

    const clone = panel.cloneNode(true);
    const contenedor = panel.parentElement;
    clone.dataset.id = 'panel-' + Date.now();
    contenedor.appendChild(clone);
    mostrarNotificacion('📋 Panel duplicado');
}

function eliminarPanel(btn) {
    if (!confirm('¿Eliminar este panel?')) return;
    const panel = btn.closest('.panel-editable');
    if (panel) {
        panel.remove();
        mostrarNotificacion('🗑️ Panel eliminado');
    }
}

// ==================== */
// FUNCIONES DE LAYOUT
// ==================== */

function cambiarLayout(seccionId, layout) {
    const contenedor = document.getElementById('contenido-' + seccionId);
    if (!contenedor) return;

    contenedor.classList.remove('horizontal', 'grid');
    
    if (layout === 'horizontal') {
        contenedor.classList.add('horizontal');
        mostrarNotificacion('📐 Layout Horizontal');
    } else if (layout === 'grid') {
        contenedor.classList.add('grid');
        mostrarNotificacion('📐 Layout Grid');
    } else {
        mostrarNotificacion('📐 Layout Vertical');
    }
}

function cambiarLayoutGlobal() {
    const selector = document.getElementById('selectorLayout');
    if (!selector) return;
    const layout = selector.value;
    const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];
    secciones.forEach(id => {
        cambiarLayout(id, layout);
    });
}

// ==================== */
// PANEL DE PERSONALIZACIÓN
// ==================== */

let seccionActual = 'global';

function togglePanel() {
    const panel = document.getElementById('panelPersonalizacion');
    const btn = document.getElementById('btnAbrirPanel');
    panel.classList.toggle('abierto');
    btn.classList.toggle('oculto');

    if (panel.classList.contains('abierto')) {
        cargarEstilosSeccion();
    }
}

function cargarEstilosSeccion() {
    const selector = document.getElementById('selectorSeccion');
    seccionActual = selector.value;

    let elemento;
    if (seccionActual === 'global') {
        elemento = document.body;
    } else if (seccionActual === 'header') {
        elemento = document.querySelector('header');
    } else {
        elemento = document.getElementById(seccionActual);
    }

    if (!elemento) return;

    const estilo = window.getComputedStyle(elemento);
    const bgColor = estilo.backgroundColor || '#ffffff';
    const color = estilo.color || '#1a2a3a';
    const fontSize = estilo.fontSize || '16px';
    const fontFamily = estilo.fontFamily || 'Inter, sans-serif';

    const colorFondoInput = document.getElementById('colorFondo');
    const colorFondoText = document.getElementById('colorFondoText');
    const colorTextoInput = document.getElementById('colorTexto');
    const colorTextoText = document.getElementById('colorTextoText');
    const tamanoFuente = document.getElementById('tamanoFuente');
    const tamanoFuenteValor = document.getElementById('tamanoFuenteValor');
    const tipoFuente = document.getElementById('tipoFuente');

    const hexBg = rgbToHex(bgColor);
    const hexText = rgbToHex(color);

    colorFondoInput.value = hexBg;
    colorFondoText.value = hexBg;
    colorTextoInput.value = hexText;
    colorTextoText.value = hexText;

    const sizeNum = parseInt(fontSize);
    tamanoFuente.value = sizeNum;
    tamanoFuenteValor.textContent = sizeNum + 'px';

    for (let option of tipoFuente.options) {
        if (option.value.includes(fontFamily.split(',')[0].replace(/'/g, '').trim()) ||
            fontFamily.includes(option.value.replace(/'/g, '').split(',')[0])) {
            tipoFuente.value = option.value;
            break;
        }
    }
}

function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#ffffff';
    const match = rgb.match(/\d+/g);
    if (!match) return '#ffffff';
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function aplicarColorFondo() {
    const color = document.getElementById('colorFondo').value;
    document.getElementById('colorFondoText').value = color;
    aplicarEstilo('background', color);
}

function aplicarColorTexto() {
    const color = document.getElementById('colorTexto').value;
    document.getElementById('colorTextoText').value = color;
    aplicarEstilo('color', color);
}

function aplicarTamanoFuente() {
    const size = document.getElementById('tamanoFuente').value;
    document.getElementById('tamanoFuenteValor').textContent = size + 'px';
    aplicarEstilo('font-size', size + 'px');
}

function aplicarTipoFuente() {
    const font = document.getElementById('tipoFuente').value;
    aplicarEstilo('font-family', font);
}

function aplicarEstilo(propiedad, valor) {
    let elemento;
    if (seccionActual === 'global') {
        elemento = document.body;
    } else if (seccionActual === 'header') {
        elemento = document.querySelector('header');
    } else {
        elemento = document.getElementById(seccionActual);
    }

    if (!elemento) return;
    elemento.style[propiedad] = valor;
}

function resetearEstilos() {
    if (!confirm('¿Resetear todos los estilos personalizados?')) return;

    const elementos = [document.body, document.querySelector('header')];
    ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) elementos.push(el);
    });

    elementos.forEach(el => {
        el.style.background = '';
        el.style.color = '';
        el.style.fontSize = '';
        el.style.fontFamily = '';
    });

    document.getElementById('colorFondo').value = '#ffffff';
    document.getElementById('colorFondoText').value = '#ffffff';
    document.getElementById('colorTexto').value = '#1a2a3a';
    document.getElementById('colorTextoText').value = '#1a2a3a';
    document.getElementById('tamanoFuente').value = '16';
    document.getElementById('tamanoFuenteValor').textContent = '16px';
    document.getElementById('tipoFuente').value = "'Inter', sans-serif";

    cargarEstilosSeccion();
    mostrarNotificacion('🔄 Estilos reseteados correctamente');
}

console.log('📘 Wiki de Planes de Carrera');
console.log('💡 Haz clic en cualquier texto para editarlo');
console.log('💾 Guardar cambios: guarda en el navegador');
console.log('👁️ Ver Vista Final: muestra los cambios guardados');
console.log('🖼️ Insertar imagen: pega URL de imagen');
console.log('🎬 Insertar video: pega URL de YouTube');
console.log('📦 Panel: agrega un nuevo panel editable');
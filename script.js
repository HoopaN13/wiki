// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD7aTvP0R7n8AoqjBLeZmcIFg8njajokM",
  authDomain: "wiki-desarrollo.firebaseapp.com",
  projectId: "wiki-desarrollo",
  storageBucket: "wiki-desarrollo.firebasestorage.app",
  messagingSenderId: "924009154077",
  appId: "1:924009154077:web:e619808bc7093578b528f4",
  measurementId: "G-DP3Y8TRFV1"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// VARIABLES GLOBALES
const DOCUMENTO_ID = 'wiki-planes-carrera';
const COLECCION = 'wikis';
let guardando = false;


// ==================== */
// GUARDAR EN LA NUBE (FIRESTORE)
// ==================== */

async function guardarEnNube() {
    if (guardando) return;
    guardando = true;
    
    try {
        // Recorrer todos los paneles y guardar sus imágenes
        document.querySelectorAll('.panel-editable').forEach(panel => {
            const style = panel.getAttribute('style') || '';
            const match = style.match(/background-image:\s*url\(["']?([^"')]*)["']?\)/i);
            if (match && match[1] && match[1].startsWith('data:image')) {
                panel.setAttribute('data-imagen-fondo', match[1]);
            }
        });

        // Guardar estilos personalizados
        guardarEstilosPersonalizados();

        // Guardar el contenido sin modales
        const clone = document.documentElement.cloneNode(true);
        const modalVideoClone = clone.querySelector('#modalVideo');
        const modalInsertarClone = clone.querySelector('#modalInsertar');
        if (modalVideoClone) modalVideoClone.remove();
        if (modalInsertarClone) modalInsertarClone.remove();
        
        const contenido = clone.outerHTML;
        const estilos = cargarEstilosPersonalizados();

        // Guardar en Firestore
        await db.collection(COLECCION).doc(DOCUMENTO_ID).set({
            contenido: contenido,
            estilos: estilos,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Backup en localStorage
        localStorage.setItem('wiki-contenido', contenido);
        localStorage.setItem('wiki-fecha', new Date().toLocaleString());

        console.log('💾 Guardado en Firebase exitoso');
    } catch (error) {
        console.error('❌ Error al guardar en Firebase:', error);
        // Fallback a localStorage
        guardarEnLocal();
    } finally {
        guardando = false;
    }
}

// Fallback local
function guardarEnLocal() {
    document.querySelectorAll('.panel-editable').forEach(panel => {
        const style = panel.getAttribute('style') || '';
        const match = style.match(/background-image:\s*url\(["']?([^"')]*)["']?\)/i);
        if (match && match[1] && match[1].startsWith('data:image')) {
            panel.setAttribute('data-imagen-fondo', match[1]);
        }
    });

    guardarEstilosPersonalizados();

    const clone = document.documentElement.cloneNode(true);
    const modalVideoClone = clone.querySelector('#modalVideo');
    const modalInsertarClone = clone.querySelector('#modalInsertar');
    if (modalVideoClone) modalVideoClone.remove();
    if (modalInsertarClone) modalInsertarClone.remove();
    
    const contenido = clone.outerHTML;
    localStorage.setItem('wiki-contenido', contenido);
    localStorage.setItem('wiki-fecha', new Date().toLocaleString());
}

// ==================== */
// CARGAR DESDE LA NUBE (FIRESTORE)
// ==================== */

async function cargarDesdeNube() {
    try {
        const doc = await db.collection(COLECCION).doc(DOCUMENTO_ID).get();
        
        if (!doc.exists) {
            console.log('📂 No hay datos en la nube. Usando contenido local.');
            return false;
        }

        const data = doc.data();
        console.log('📂 Cargando desde la nube.');

        if (data.contenido) {
            const bodyMatch = data.contenido.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
                const nuevoBody = bodyMatch[1];
                document.body.innerHTML = nuevoBody;
            }
        }

        if (data.estilos) {
            localStorage.setItem('wiki-estilos', JSON.stringify(data.estilos));
            restaurarEstilosPersonalizados();
        }

        // Restaurar imágenes de fondo
        document.querySelectorAll('.panel-editable[data-imagen-fondo]').forEach(panel => {
            const imgData = panel.getAttribute('data-imagen-fondo');
            if (imgData && imgData.startsWith('data:image')) {
                panel.style.backgroundImage = `url(${imgData})`;
                panel.style.backgroundSize = 'cover';
                panel.style.backgroundPosition = 'center';
                panel.style.backgroundRepeat = 'no-repeat';
                panel.style.minHeight = '380px';
                panel.style.borderRadius = '16px';
                panel.style.border = '1px solid rgba(255,255,255,0.3)';
                panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
                panel.style.padding = '0';
                panel.style.overflow = 'hidden';
                panel.style.position = 'relative';
                panel.style.backgroundColor = 'transparent';

                if (!panel.querySelector('.panel-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'panel-overlay';
                    overlay.style.cssText = `
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%);
                        z-index: 1; border-radius: 16px; pointer-events: none;
                    `;
                    panel.prepend(overlay);
                }

                const contenidoPanel = panel.querySelector('div:not(.panel-overlay):not(.panel-controls)');
                if (contenidoPanel) {
                    contenidoPanel.style.cssText = `
                        position: relative; z-index: 2; color: #ffffff;
                        text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3);
                        padding: 40px 35px; min-height: 320px; background: transparent;
                        border-radius: 16px; display: flex; flex-direction: column; justify-content: center;
                    `;
                    const textos = contenidoPanel.querySelectorAll('*');
                    textos.forEach(el => {
                        el.style.color = '#ffffff';
                        el.style.textShadow = '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)';
                    });
                }
            }
        });

        mostrarNotificacion('📂 Contenido cargado desde la nube');
        return true;
    } catch (error) {
        console.error('❌ Error al cargar desde la nube:', error);
        return false;
    }
}

// ==================== */
// INICIALIZACIÓN AL CARGAR
// ==================== */

async function cargarDatosIniciales() {
    console.log('🚀 Iniciando carga desde la nube...');
    
    const cargado = await cargarDesdeNube();
    
    if (!cargado) {
        const contenidoGuardado = localStorage.getItem('wiki-contenido');
        if (contenidoGuardado && contenidoGuardado.length > 0) {
            console.log('📂 Cargando desde localStorage (fallback)');
            const bodyMatch = contenidoGuardado.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
                document.body.innerHTML = bodyMatch[1];
            }
            restaurarEstilosPersonalizados();
        }
    }
    
    const panelPersonalizacion = document.getElementById('panelPersonalizacion');
    const btnAbrirPanel = document.getElementById('btnAbrirPanel');
    if (panelPersonalizacion) panelPersonalizacion.classList.remove('abierto');
    if (btnAbrirPanel) btnAbrirPanel.classList.remove('oculto');
    
    if (window.intervaloAutoGuardar) {
        clearInterval(window.intervaloAutoGuardar);
    }
    window.intervaloAutoGuardar = setInterval(autoGuardar, 10000);
    console.log('💾 Auto-guardado en la nube activado cada 10 segundos');
}

// ==================== */
// VERIFICAR FIREBASE Y CARGAR
// ==================== */

let firebaseCargado = false;

function verificarFirebaseYcargar() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        if (!firebaseCargado) {
            firebaseCargado = true;
            cargarDatosIniciales();
        }
        return true;
    }
    return false;
}

// Intentar cargar inmediatamente
if (!verificarFirebaseYcargar()) {
    const interval = setInterval(() => {
        if (verificarFirebaseYcargar()) {
            clearInterval(interval);
        }
    }, 500);
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        if (!firebaseCargado) {
            firebaseCargado = true;
            cargarDatosIniciales();
        }
    }
});


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
    // Recorrer todos los paneles y guardar sus imágenes
    document.querySelectorAll('.panel-editable').forEach(panel => {
        const style = panel.getAttribute('style') || '';
        const match = style.match(/background-image:\s*url\(["']?([^"')]*)["']?\)/i);
        if (match && match[1] && match[1].startsWith('data:image')) {
            panel.setAttribute('data-imagen-fondo', match[1]);
        }
    });

    // GUARDAR ESTILOS DEL BODY
    guardarEstilosPersonalizados();

    // GUARDAR EL CONTENIDO SIN MODALES
    const clone = document.documentElement.cloneNode(true);
    
    const modalVideoClone = clone.querySelector('#modalVideo');
    const modalInsertarClone = clone.querySelector('#modalInsertar');
    if (modalVideoClone) modalVideoClone.remove();
    if (modalInsertarClone) modalInsertarClone.remove();
    
    const contenido = clone.outerHTML;
    localStorage.setItem('wiki-contenido', contenido);
    localStorage.setItem('wiki-fecha', new Date().toLocaleString());
}

function guardarCambiosConNotificacion() {
    guardarEnNube();
    mostrarNotificacion('✅ ¡Cambios guardados en la nube!');
}

function guardarEstilosPersonalizados() {
    const estilos = {};
    const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];

    // Guardar estilos del body
    estilos.body = {
        background: document.body.style.background || '',
        color: document.body.style.color || '',
        fontSize: document.body.style.fontSize || '',
        fontFamily: document.body.style.fontFamily || ''
    };

    // Guardar estilos del header
    const header = document.querySelector('header');
    if (header) {
        estilos.header = {
            background: header.style.background || '',
            color: header.style.color || ''
        };
    }

    // Guardar estilos de cada sección
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
    console.log('🎨 Estilos guardados:', estilos);
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

function restaurarEstilosPersonalizados() {
    const estilosGuardados = localStorage.getItem('wiki-estilos');
    if (!estilosGuardados) {
        console.log('🎨 No hay estilos guardados');
        return;
    }
    
    try {
        const estilos = JSON.parse(estilosGuardados);
        console.log('🎨 Restaurando estilos:', estilos);
        
        // Restaurar estilos del body
        if (estilos.body) {
            if (estilos.body.background) {
                document.body.style.background = estilos.body.background;
            }
            if (estilos.body.color) {
                document.body.style.color = estilos.body.color;
            }
            if (estilos.body.fontSize) {
                document.body.style.fontSize = estilos.body.fontSize;
            }
            if (estilos.body.fontFamily) {
                document.body.style.fontFamily = estilos.body.fontFamily;
            }
        }
        
        // Restaurar estilos del header
        if (estilos.header) {
            const header = document.querySelector('header');
            if (header) {
                if (estilos.header.background) {
                    header.style.background = estilos.header.background;
                }
                if (estilos.header.color) {
                    header.style.color = estilos.header.color;
                }
            }
        }
        
        // Restaurar estilos de cada sección
        const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];
        secciones.forEach(id => {
            if (estilos[id]) {
                const el = document.getElementById(id);
                if (el) {
                    if (estilos[id].background) {
                        el.style.background = estilos[id].background;
                    }
                    if (estilos[id].color) {
                        el.style.color = estilos[id].color;
                    }
                    if (estilos[id].fontSize) {
                        el.style.fontSize = estilos[id].fontSize;
                    }
                    if (estilos[id].fontFamily) {
                        el.style.fontFamily = estilos[id].fontFamily;
                    }
                }
            }
        });
    } catch(e) {
        console.error('Error restaurando estilos:', e);
    }
}

function verVistaFinal() {
    document.querySelectorAll('.panel-editable[data-imagen-fondo]').forEach(panel => {
        const imgData = panel.getAttribute('data-imagen-fondo');
        if (imgData && imgData.startsWith('data:image')) {
            panel.style.backgroundImage = `url(${imgData})`;
            panel.style.backgroundSize = 'cover';
            panel.style.backgroundPosition = 'center';
            panel.style.backgroundRepeat = 'no-repeat';
        }
    });

    guardarCambios();

    const contenidoGuardado = localStorage.getItem('wiki-contenido');
    const estilosGuardados = cargarEstilosPersonalizados();

    if (!contenidoGuardado) {
        window.open('vista-final.html', '_blank');
        return;
    }

    const bodyMatch = contenidoGuardado.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let contenidoBody = bodyMatch ? bodyMatch[1] : '';

    // ✅ ELIMINAR EL BOTÓN "VER VISTA FINAL" DE TODO EL CONTENIDO
    contenidoBody = contenidoBody
        .replace(/<button[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="verVistaFinal\(\)"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<a[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/a>/gi, '')
        .replace(/<div[^>]*style="margin-top:15px;"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/Ver Vista Final/g, '')
        .replace(/Ver Vista Final \(Solo Lectura\)/g, '');

    // Eliminar contenteditable
    contenidoBody = contenidoBody.replace(/contenteditable="true"/gi, '');
    contenidoBody = contenidoBody.replace(/contenteditable='true'/gi, '');

    // ✅ ELIMINAR TODOS LOS ELEMENTOS DE EDICIÓN
    contenidoBody = contenidoBody
        .replace(/<div[^>]*class="edit-notice"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="seccion-botones"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="panel-controls"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<button[^>]*class="btn-insertar"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="insertarImagen[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="insertarVideo[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="agregarPanel[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*onclick="cambiarLayout[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<div[^>]*class="save-button"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*id="panelPersonalizacion"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<button[^>]*id="btnAbrirPanel"[^>]*>[\s\S]*?<\/button>/gi, '')
        .replace(/<button[^>]*class="btn-abrir-panel"[^>]*>[\s\S]*?<\/button>/gi, '');

    // ✅ LIMPIAR HEADER Y AGREGAR INDICADOR
    contenidoBody = contenidoBody.replace(/<header>([\s\S]*?)<\/header>/gi, function(match, headerContent) {
        headerContent = headerContent
            .replace(/<button[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<button[^>]*onclick="verVistaFinal\(\)"[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<a[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/a>/gi, '')
            .replace(/<div[^>]*style="margin-top:15px;"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/Ver Vista Final/g, '');
        
        if (!headerContent.includes('Vista Final - Solo Lectura')) {
            headerContent += `<div style="background:rgba(255,215,0,0.15);padding:8px 20px;border-radius:30px;display:inline-block;margin-top:10px;border:1px solid rgba(255,215,0,0.2);font-size:0.8rem;color:#ffd700;">👁️ Vista Final - Solo Lectura</div>`;
        }
        return `<header>${headerContent}</header>`;
    });

    // ✅ LIMPIAR FOOTER
    contenidoBody = contenidoBody.replace(/<footer>([\s\S]*?)<\/footer>/gi, function(match, footerContent) {
        footerContent = footerContent
            .replace(/<button[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<button[^>]*onclick="verVistaFinal\(\)"[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<a[^>]*class="btn-vista-final"[^>]*>[\s\S]*?<\/a>/gi, '')
            .replace(/<div[^>]*style="margin-top:15px;"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/Ver Vista Final/g, '');
        return `<footer>${footerContent}</footer>`;
    });

    // ✅ ELIMINAR MODALES
    contenidoBody = contenidoBody.replace(/<div id="modalInsertar"[^>]*>[\s\S]*?<\/div>/gi, '');
    contenidoBody = contenidoBody.replace(/<div id="modalVideo"[^>]*>[\s\S]*?<\/div>/gi, '');

    // Extraer estilos del documento original
    const styleMatch = contenidoGuardado.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    let estilosOriginales = '';
    if (styleMatch) {
        styleMatch.forEach(s => {
            estilosOriginales += s.replace(/<\/?style[^>]*>/gi, '') + '\n';
        });
    }

    let cssPersonalizado = '';

    // Recuperar imágenes de fondo
    const panelRegex = /<div[^>]*class="panel-editable"[^>]*data-imagen-fondo="([^"]*)"[^>]*>/gi;
    let match;
    let imagenesGuardadas = [];
    while ((match = panelRegex.exec(contenidoBody)) !== null) {
        if (match[1] && match[1].startsWith('data:image')) {
            imagenesGuardadas.push(match[1]);
        }
    }

    if (imagenesGuardadas.length > 0) {
        imagenesGuardadas.forEach((imgData, index) => {
            const selector = `.panel-editable[data-imagen-fondo="${imgData}"]`;
            cssPersonalizado += `
                ${selector} {
                    background-image: url('${imgData}') !important;
                    background-size: cover !important;
                    background-position: center !important;
                    background-repeat: no-repeat !important;
                    min-height: 380px !important;
                    border-radius: 16px !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    position: relative !important;
                    background-color: transparent !important;
                }
                
                ${selector} .panel-overlay {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%) !important;
                    z-index: 1 !important;
                    border-radius: 16px !important;
                    pointer-events: none !important;
                }
                
                ${selector} > div:not(.panel-overlay):not(.panel-controls) {
                    position: relative !important;
                    z-index: 2 !important;
                    color: #ffffff !important;
                    text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3) !important;
                    padding: 40px 35px !important;
                    min-height: 320px !important;
                    background: transparent !important;
                    border-radius: 16px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                }
                
                ${selector} h2,
                ${selector} h3,
                ${selector} p,
                ${selector} ul li,
                ${selector} li,
                ${selector} strong,
                ${selector} em {
                    color: #ffffff !important;
                    text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3) !important;
                }
                
                ${selector} h2 {
                    border-bottom: 2px solid rgba(255,255,255,0.2) !important;
                    font-family: 'Playfair Display', serif !important;
                    font-size: 1.8rem !important;
                    padding-bottom: 12px !important;
                    margin-bottom: 16px !important;
                }
            `;
        });
    }

    if (estilosGuardados.body) {
        const s = estilosGuardados.body;
        if (s.background) cssPersonalizado += `body { background: ${s.background} !important; }\n`;
        if (s.color) cssPersonalizado += `body { color: ${s.color} !important; }\n`;
        if (s.fontSize) cssPersonalizado += `body { font-size: ${s.fontSize} !important; }\n`;
        if (s.fontFamily) cssPersonalizado += `body { font-family: ${s.fontFamily} !important; }\n`;
    }

    cssPersonalizado += `
        .panel-editable {
            background: #ffffff !important;
            border: 1px solid #e8ecf1 !important;
            border-radius: 16px !important;
            padding: 22px 25px !important;
            margin-bottom: 20px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
        }
        .panel-editable h2 {
            color: #0a2f44 !important;
            font-family: 'Playfair Display', serif !important;
            font-size: 1.8rem !important;
            border-bottom: 3px solid rgba(10, 47, 68, 0.10) !important;
            padding-bottom: 10px !important;
            margin-bottom: 15px !important;
        }
        .panel-editable h3 {
            color: #1a4b6e !important;
            font-weight: 700 !important;
            margin: 18px 0 10px 0 !important;
            font-size: 1.2rem !important;
        }
        .panel-editable p {
            color: #1a2a3a !important;
            margin: 10px 0 !important;
            font-size: 1rem !important;
            line-height: 1.7 !important;
        }
        .panel-editable ul {
            padding-left: 25px !important;
            margin: 10px 0 !important;
        }
        .panel-editable ul li {
            color: #1a2a3a !important;
            margin-bottom: 8px !important;
            font-size: 1rem !important;
        }
        .panel-editable strong {
            color: #0a2f44 !important;
            font-weight: 700 !important;
        }
        section {
            background: transparent !important;
        }
        [contenteditable="true"] {
            outline: none !important;
            background: transparent !important;
            cursor: default !important;
        }
        [contenteditable="true"]:hover,
        [contenteditable="true"]:focus {
            outline: none !important;
            background: transparent !important;
            cursor: default !important;
        }
    `;

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
        }
    });

    const vistaFinal = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wiki: Planes de Carrera - Vista Final</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%);
            color: #1a2a3a;
            line-height: 1.6;
            padding: 20px;
            min-height: 100vh;
        }
        
        header {
            background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #0a1a2e 100%);
            color: white;
            padding: 40px 50px;
            border-radius: 20px;
            margin-bottom: 35px;
            text-align: center;
            box-shadow: 0 15px 50px rgba(15, 52, 96, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 2.8rem;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 20px rgba(0,0,0,0.2);
        }
        
        header p {
            font-size: 1.1rem;
            opacity: 0.85;
            position: relative;
            z-index: 1;
            font-weight: 300;
            letter-spacing: 1px;
        }
        
        nav {
            margin-top: 25px;
            position: relative;
            z-index: 1;
        }
        
        nav ul {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }
        
        nav ul li a {
            color: white;
            background: rgba(255, 255, 255, 0.1);
            padding: 10px 22px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
        }
        
        nav ul li a:hover {
            background: rgba(255, 215, 0, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(255, 215, 0, 0.15);
            border-color: rgba(255, 215, 0, 0.3);
        }
        
        main section {
            background: transparent !important;
            padding: 10px 0 30px 0;
            margin-bottom: 20px;
        }
        
        footer {
            text-align: center;
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #1a1a2e, #0f3460);
            color: white;
            border-radius: 20px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
        }
        
        footer p {
            opacity: 0.8;
            font-weight: 300;
            letter-spacing: 0.5px;
        }
        
        .edit-notice, .save-button, .btn-abrir-panel, .panel-personalizacion,
        .seccion-botones, .panel-controls, .btn-insertar, .btn-vista-final {
            display: none !important;
        }
        
        [contenteditable="true"] {
            outline: none !important;
            background: transparent !important;
            cursor: default !important;
        }
        [contenteditable="true"]:hover,
        [contenteditable="true"]:focus {
            outline: none !important;
            background: transparent !important;
            cursor: default !important;
        }
        
        .overlay-oscuro, .notificacion-flotante {
            display: none !important;
        }
        .modal-insertar {
            display: none !important;
        }
        
        ${estilosOriginales}
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

function restaurarEstilosPersonalizados() {
    const estilosGuardados = localStorage.getItem('wiki-estilos');
    if (!estilosGuardados) {
        console.log('🎨 No hay estilos guardados');
        return;
    }
    
    try {
        const estilos = JSON.parse(estilosGuardados);
        console.log('🎨 Restaurando estilos:', estilos);
        
        // Restaurar estilos del body
        if (estilos.body) {
            if (estilos.body.background) {
                document.body.style.background = estilos.body.background;
            }
            if (estilos.body.color) {
                document.body.style.color = estilos.body.color;
            }
            if (estilos.body.fontSize) {
                document.body.style.fontSize = estilos.body.fontSize;
            }
            if (estilos.body.fontFamily) {
                document.body.style.fontFamily = estilos.body.fontFamily;
            }
        }
        
        // Restaurar estilos del header
        if (estilos.header) {
            const header = document.querySelector('header');
            if (header) {
                if (estilos.header.background) {
                    header.style.background = estilos.header.background;
                }
                if (estilos.header.color) {
                    header.style.color = estilos.header.color;
                }
            }
        }
        
        // Restaurar estilos de cada sección
        const secciones = ['plan-carrera', 'sucesion', 'movilidad', 'talento-humano', 'recursos', 'estadisticas'];
        secciones.forEach(id => {
            if (estilos[id]) {
                const el = document.getElementById(id);
                if (el) {
                    if (estilos[id].background) {
                        el.style.background = estilos[id].background;
                    }
                    if (estilos[id].color) {
                        el.style.color = estilos[id].color;
                    }
                    if (estilos[id].fontSize) {
                        el.style.fontSize = estilos[id].fontSize;
                    }
                    if (estilos[id].fontFamily) {
                        el.style.fontFamily = estilos[id].fontFamily;
                    }
                }
            }
        });
    } catch(e) {
        console.error('Error restaurando estilos:', e);
    }
}

function resetearPagina() {
    if (confirm('⚠️ ¿Seguro que quieres resetear la página? PERDERÁS TODOS LOS CAMBIOS GUARDADOS en la nube y localmente.')) {
        sessionStorage.setItem('resetEnProgreso', 'true');
        
        // Eliminar de Firestore
        db.collection(COLECCION).doc(DOCUMENTO_ID).delete()
            .then(() => console.log('🗑️ Datos eliminados de Firestore'))
            .catch(err => console.error('Error al eliminar de Firestore:', err));
        
        localStorage.clear();
        
        if (window.intervaloAutoGuardar) {
            clearInterval(window.intervaloAutoGuardar);
            window.intervaloAutoGuardar = null;
        }
        
        location.reload(true);
    }
}


// Insertar imagen - abre modal
function insertarImagen(seccionId) {
    if (document.body.classList.contains('vista-final')) {
        return;
    }
    imagenSubida = null;
    seccionActualModal = seccionId;
    tipoInsercionModal = 'imagen';
    
    // Resetear el modal
    const modal = document.getElementById('modalInsertar');
    if (modal) {
        document.getElementById('modalFileInput').value = '';
        document.getElementById('modalPreview').style.display = 'none';
        const btnInsertar = document.getElementById('btnInsertarImagen');
        if (btnInsertar) {
            btnInsertar.disabled = true;
            btnInsertar.style.opacity = '0.5';
            btnInsertar.style.cursor = 'not-allowed';
        }
    }
    
    mostrarModal('Insertar imagen', 'Selecciona una imagen desde tu dispositivo:', '');
}

// Insertar video - abre modal
function insertarVideo(seccionId) {
    if (document.body.classList.contains('vista-final')) {
        return;
    }
    seccionActualModal = seccionId;
    tipoInsercionModal = 'video';
    
    const modalHTML = `
        <div id="modalVideo" class="modal-insertar" style="display:flex;">
            <div class="modal-contenido" style="max-width:550px;">
                <h3 style="color:#0f3460;margin-bottom:15px;">🎬 Insertar Video de YouTube</h3>
                <p style="color:#666;margin-bottom:15px;font-size:0.95rem;">Pega la URL del video de YouTube:</p>
                <input type="text" id="videoUrlInput" placeholder="https://www.youtube.com/watch?v=VIDEO_ID" style="width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:10px;font-size:1rem;margin-bottom:15px;">
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="confirmarVideo()" class="btn-aceptar" style="padding:10px 24px;border:none;border-radius:25px;background:linear-gradient(135deg,#0f3460,#1a4b6e);color:white;font-weight:600;cursor:pointer;">✅ Insertar</button>
                    <button onclick="cerrarModalVideo()" class="btn-cancelar" style="padding:10px 24px;border:none;border-radius:25px;background:#e74c3c;color:white;font-weight:600;cursor:pointer;">❌ Cancelar</button>
                </div>
                <p style="color:#999;font-size:0.8rem;margin-top:15px;text-align:center;">💡 Ejemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
            </div>
        </div>
    `;
    
    const modalExistente = document.getElementById('modalVideo');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Confirmar inserción - SOLO IMAGEN SUBIDA
function confirmarInsercion() {
    if (!imagenSubida) {
        alert('⚠️ Por favor selecciona o pega una imagen desde tu dispositivo.');
        return;
    }

    const contenedor = document.getElementById('contenido-' + seccionActualModal);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        cerrarModal();
        return;
    }

    let panel = contenedor.querySelector('.panel-editable:first-child');
    
    if (!panel) {
        panel = document.createElement('div');
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
            <button onclick="eliminarImagen(this)" class="btn-eliminar-imagen" style="background:rgba(231,76,60,0.3);">🖼️ Eliminar imagen</button>
        `;
        
        panel.appendChild(contenidoPanel);
        panel.appendChild(controles);
        contenedor.appendChild(panel);
    }
    
    panel.setAttribute('data-imagen-fondo', imagenSubida);
    
    panel.style.backgroundImage = `url(${imagenSubida})`;
    panel.style.backgroundSize = 'cover';
    panel.style.backgroundPosition = 'center';
    panel.style.backgroundRepeat = 'no-repeat';
    panel.style.minHeight = '380px';
    panel.style.borderRadius = '16px';
    panel.style.border = '1px solid rgba(255,255,255,0.3)';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
    panel.style.padding = '0';
    panel.style.overflow = 'hidden';
    panel.style.position = 'relative';
    panel.style.backgroundColor = 'transparent';
    
    const overlayExistente = panel.querySelector('.panel-overlay');
    if (overlayExistente) overlayExistente.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)';
    overlay.style.borderRadius = '16px';
    overlay.style.pointerEvents = 'none';
    panel.prepend(overlay);

    const contenidoPanel = panel.querySelector('div:not(.panel-overlay):not(.panel-controls)');
    if (contenidoPanel) {
        contenidoPanel.style.position = 'relative';
        contenidoPanel.style.zIndex = '2';
        contenidoPanel.style.color = '#ffffff';
        contenidoPanel.style.textShadow = '0 2px 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)';
        contenidoPanel.style.padding = '40px 35px';
        contenidoPanel.style.minHeight = '320px';
        contenidoPanel.style.backgroundColor = 'transparent';
        contenidoPanel.style.borderRadius = '16px';
        contenidoPanel.style.display = 'flex';
        contenidoPanel.style.flexDirection = 'column';
        contenidoPanel.style.justifyContent = 'center';
        
        const textos = contenidoPanel.querySelectorAll('*');
        textos.forEach(el => {
            el.style.color = '#ffffff';
            el.style.textShadow = '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)';
        });
        
        const titulos = contenidoPanel.querySelectorAll('h2, h3');
        titulos.forEach(el => {
            el.style.color = '#ffffff';
            el.style.textShadow = '0 2px 30px rgba(0,0,0,0.7), 0 0 50px rgba(0,0,0,0.4)';
            el.style.borderBottomColor = 'rgba(255,255,255,0.2)';
        });
    }

    const controlesPanel = panel.querySelector('.panel-controls');
    if (controlesPanel) {
        controlesPanel.style.position = 'relative';
        controlesPanel.style.zIndex = '2';
        controlesPanel.style.marginTop = '10px';
        controlesPanel.style.paddingTop = '12px';
        controlesPanel.style.borderTop = '1px solid rgba(255,255,255,0.15)';
        const botones = controlesPanel.querySelectorAll('button');
        botones.forEach(btn => {
            btn.style.background = 'rgba(255,255,255,0.15)';
            btn.style.color = '#ffffff';
            btn.style.border = '1px solid rgba(255,255,255,0.1)';
            btn.style.backdropFilter = 'blur(4px)';
        });
        const btnEliminar = controlesPanel.querySelector('.btn-eliminar');
        if (btnEliminar) {
            btnEliminar.style.background = 'rgba(231,76,60,0.5)';
            btnEliminar.style.border = '1px solid rgba(231,76,60,0.3)';
        }
    }

    limpiarModal();
    cerrarModal();
    mostrarNotificacion('✅ Imagen de fondo aplicada al panel');
    guardarCambios();
}

function eliminarImagen(btn) {
    if (!confirm('¿Eliminar esta imagen de fondo?')) return;
    
    const panel = btn.closest('.panel-editable');
    if (!panel) return;
    
    panel.removeAttribute('data-imagen-fondo');
    
    panel.style.backgroundImage = '';
    panel.style.backgroundColor = '#ffffff';
    panel.style.minHeight = '';
    panel.style.border = '1px solid #e8ecf1';
    panel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
    panel.style.padding = '22px 25px';
    panel.style.overflow = '';
    panel.style.position = '';
    
    const overlay = panel.querySelector('.panel-overlay');
    if (overlay) overlay.remove();
    
    const contenidoPanel = panel.querySelector('div:not(.panel-overlay):not(.panel-controls)');
    if (contenidoPanel) {
        contenidoPanel.style.color = '';
        contenidoPanel.style.textShadow = '';
        contenidoPanel.style.padding = '';
        contenidoPanel.style.minHeight = '';
        contenidoPanel.style.backgroundColor = '';
        contenidoPanel.style.borderRadius = '';
        contenidoPanel.style.display = '';
        contenidoPanel.style.flexDirection = '';
        contenidoPanel.style.justifyContent = '';
        
        const textos = contenidoPanel.querySelectorAll('*');
        textos.forEach(el => {
            el.style.color = '';
            el.style.textShadow = '';
        });
    }
    
    const controles = panel.querySelector('.panel-controls');
    if (controles) {
        controles.style.borderTop = '';
        const botones = controles.querySelectorAll('button');
        botones.forEach(btn => {
            btn.style.background = '';
            btn.style.color = '';
            btn.style.border = '';
            btn.style.backdropFilter = '';
        });
    }
    
    mostrarNotificacion('🗑️ Imagen de fondo eliminada');
    guardarCambios();
}
// ==================== */
// FUNCIONES PARA IMÁGENES, VIDEOS Y PANELES
// ==================== */

let seccionActualModal = '';
let tipoInsercionModal = '';
let imagenSubida = null;

// Insertar imagen - abre modal
function insertarImagen(seccionId) {
    if (document.body.classList.contains('vista-final')) {
        return;
    }
    imagenSubida = null;
    seccionActualModal = seccionId;
    tipoInsercionModal = 'imagen';
    
    const modal = document.getElementById('modalInsertar');
    if (modal) {
        document.getElementById('modalFileInput').value = '';
        document.getElementById('modalPreview').style.display = 'none';
        const btnInsertar = document.getElementById('btnInsertarImagen');
        if (btnInsertar) {
            btnInsertar.disabled = true;
            btnInsertar.style.opacity = '0.5';
            btnInsertar.style.cursor = 'not-allowed';
        }
    }
    
    mostrarModal('Insertar imagen', 'Selecciona una imagen desde tu dispositivo:', '');
}

// Insertar video - abre modal
function insertarVideo(seccionId) {
    if (document.body.classList.contains('vista-final')) {
        return;
    }
    seccionActualModal = seccionId;
    tipoInsercionModal = 'video';
    
    // ✅ ELIMINAR cualquier modal de video existente antes de crear uno nuevo
    const modalExistente = document.getElementById('modalVideo');
    if (modalExistente) modalExistente.remove();
    
    const modalHTML = `
        <div id="modalVideo" class="modal-insertar" style="display:none;">
            <div class="modal-contenido" style="max-width:550px;">
                <h3 style="color:#0f3460;margin-bottom:15px;">🎬 Insertar Video de YouTube</h3>
                <p style="color:#666;margin-bottom:15px;font-size:0.95rem;">Pega la URL del video de YouTube:</p>
                <input type="text" id="videoUrlInput" placeholder="https://www.youtube.com/watch?v=VIDEO_ID" style="width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:10px;font-size:1rem;margin-bottom:15px;">
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="confirmarVideo()" class="btn-aceptar" style="padding:10px 24px;border:none;border-radius:25px;background:linear-gradient(135deg,#0f3460,#1a4b6e);color:white;font-weight:600;cursor:pointer;">✅ Insertar</button>
                    <button onclick="cerrarModalVideo()" class="btn-cancelar" style="padding:10px 24px;border:none;border-radius:25px;background:#e74c3c;color:white;font-weight:600;cursor:pointer;">❌ Cancelar</button>
                </div>
                <p style="color:#999;font-size:0.8rem;margin-top:15px;text-align:center;">💡 Ejemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ✅ Mostrar el modal después de crearlo
    const modal = document.getElementById('modalVideo');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function confirmarVideo() {
    const urlInput = document.getElementById('videoUrlInput');
    if (!urlInput) return;
    
    let url = urlInput.value.trim();
    if (!url) {
        alert('⚠️ Por favor ingresa una URL de YouTube.');
        return;
    }
    
    let videoId = null;
    const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/i,
        /youtu\.be\/([^?]+)/i,
        /youtube\.com\/embed\/([^?]+)/i,
        /youtube\.com\/shorts\/([^?]+)/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            videoId = match[1];
            break;
        }
    }
    
    if (!videoId) {
        alert('⚠️ No se pudo identificar el video. Asegúrate de usar una URL válida de YouTube.');
        return;
    }
    
    videoId = videoId.split('&')[0];
    videoId = videoId.split('?')[0];
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&origin=${window.location.origin}`;
    
    const contenedor = document.getElementById('contenido-' + seccionActualModal);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        cerrarModalVideo();
        return;
    }
    
    let panel = contenedor.querySelector('.panel-editable:first-child');
    if (!panel) {
        panel = document.createElement('div');
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
            <button onclick="eliminarVideo(this)" class="btn-eliminar-video" style="background:rgba(231,76,60,0.3);padding:4px 10px;border:none;border-radius:15px;color:white;font-size:0.75rem;cursor:pointer;">🎬 Eliminar video</button>
        `;
        
        panel.appendChild(contenidoPanel);
        panel.appendChild(controles);
        contenedor.appendChild(panel);
    }
    
    const contenidoPanel = panel.querySelector('div:not(.panel-controls)');
    if (contenidoPanel) {
        const existingIframe = contenidoPanel.querySelector('.video-container');
        if (existingIframe) existingIframe.remove();
        
        const wrapper = document.createElement('div');
        wrapper.className = 'video-layout';
        wrapper.style.cssText = `
            display: flex;
            gap: 25px;
            align-items: flex-start;
            flex-wrap: wrap;
        `;
        
        const children = Array.from(contenidoPanel.children);
        children.forEach(child => {
            if (!child.classList || !child.classList.contains('video-layout')) {
                wrapper.appendChild(child);
            }
        });
        
        const videoColumn = document.createElement('div');
        videoColumn.className = 'video-column';
        videoColumn.style.cssText = `
            flex: 0 0 720px;
            max-width: 720px;
            min-width: 620px;
        `;
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.style.cssText = `
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            background: #000;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 12px;
        `;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        
        videoContainer.appendChild(iframe);
        videoColumn.appendChild(videoContainer);
        
        const videoLabel = document.createElement('p');
        videoLabel.style.cssText = `
            font-size: 0.75rem;
            color: #888;
            margin-top: 6px;
            text-align: center;
            font-style: italic;
        `;
        videoLabel.textContent = '🎬 Video relacionado';
        videoColumn.appendChild(videoLabel);
        
        const textColumn = document.createElement('div');
        textColumn.className = 'text-column';
        textColumn.style.cssText = `
            flex: 1;
            min-width: 200px;
        `;
        
        while (wrapper.firstChild) {
            textColumn.appendChild(wrapper.firstChild);
        }
        
        wrapper.appendChild(textColumn);
        wrapper.appendChild(videoColumn);
        
        contenidoPanel.insertBefore(wrapper, contenidoPanel.firstChild);
    }
    
    cerrarModalVideo();
    mostrarNotificacion('🎬 Video insertado correctamente');
    guardarCambios();
}

function cerrarModalVideo() {
    const modal = document.getElementById('modalVideo');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

function eliminarVideo(btn) {
    if (!confirm('¿Eliminar este video?')) return;
    
    const panel = btn.closest('.panel-editable');
    if (!panel) return;
    
    const videoContainer = panel.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.remove();
        const label = panel.querySelector('.video-column p');
        if (label) label.remove();
        const videoColumn = panel.querySelector('.video-column');
        if (videoColumn) videoColumn.remove();
        const wrapper = panel.querySelector('.video-layout');
        if (wrapper) {
            const textColumn = wrapper.querySelector('.text-column');
            if (textColumn) {
                while (textColumn.firstChild) {
                    panel.querySelector('div:not(.panel-controls)').appendChild(textColumn.firstChild);
                }
                wrapper.remove();
            }
        }
        mostrarNotificacion('🎬 Video eliminado');
        guardarCambios();
    } else {
        mostrarNotificacion('⚠️ No se encontró ningún video para eliminar');
    }
}

// Mostrar modal
// Mostrar modal
function mostrarModal(titulo, label, placeholder) {
    if (document.body.classList.contains('vista-final')) {
        return;
    }
    
    imagenSubida = null;
    
    let modal = document.getElementById('modalInsertar');
    if (!modal) {
        const modalHTML = `
            <div id="modalInsertar" class="modal-insertar">
                <div class="modal-contenido">
                    <h3 id="modalTitulo">${titulo}</h3>
                    <label id="modalLabel" style="display:none;">${label}</label>
                    <input type="text" id="modalInput" placeholder="${placeholder}" style="display:none;">
                    <div style="text-align:center;margin:15px 0;">
                        <input type="file" id="modalFileInput" accept="image/*" style="width:100%;padding:12px;border:2px dashed #0f3460;border-radius:10px;cursor:pointer;font-size:0.95rem;">
                        <p style="color:#999;font-size:0.85rem;margin-top:8px;">📋 También puedes pegar una imagen con Ctrl+V</p>
                    </div>
                    <div id="modalPreview" style="margin-top:10px;display:none;text-align:center;">
                        <img id="previewImagen" src="#" alt="Vista previa" style="max-width:100%;max-height:250px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                        <p style="color:#27ae60;font-size:0.9rem;margin-top:8px;">✅ Imagen cargada correctamente</p>
                    </div>
                    <div class="modal-botones">
                        <button onclick="confirmarInsercion()" class="btn-aceptar" id="btnInsertarImagen" disabled style="opacity:0.5;cursor:not-allowed;">✅ Insertar</button>
                        <button onclick="cerrarModal()" class="btn-cancelar">❌ Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const fileInput = document.getElementById('modalFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        imagenSubida = event.target.result;
                        const preview = document.getElementById('modalPreview');
                        const previewImg = document.getElementById('previewImagen');
                        previewImg.src = imagenSubida;
                        preview.style.display = 'block';
                        document.getElementById('modalInput').value = '';
                        const btnInsertar = document.getElementById('btnInsertarImagen');
                        btnInsertar.disabled = false;
                        btnInsertar.style.opacity = '1';
                        btnInsertar.style.cursor = 'pointer';
                        mostrarNotificacion('📸 Imagen cargada correctamente');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        document.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        imagenSubida = event.target.result;
                        const preview = document.getElementById('modalPreview');
                        const previewImg = document.getElementById('previewImagen');
                        previewImg.src = imagenSubida;
                        preview.style.display = 'block';
                        const btnInsertar = document.getElementById('btnInsertarImagen');
                        btnInsertar.disabled = false;
                        btnInsertar.style.opacity = '1';
                        btnInsertar.style.cursor = 'pointer';
                        mostrarNotificacion('📸 Imagen pegada correctamente');
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        });
        
    } else {
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalFileInput').value = '';
        document.getElementById('modalPreview').style.display = 'none';
        const btnInsertar = document.getElementById('btnInsertarImagen');
        if (btnInsertar) {
            btnInsertar.disabled = true;
            btnInsertar.style.opacity = '0.5';
            btnInsertar.style.cursor = 'not-allowed';
        }
        imagenSubida = null;
    }
    // ✅ IMPORTANTE: SOLO mostrar modal si NO estamos en vista final
    if (!document.body.classList.contains('vista-final')) {
        document.getElementById('modalInsertar').classList.add('visible');
    }
}

// Confirmar inserción - IMAGEN COMO FONDO ELEGANTE
function confirmarInsercion() {
    if (!imagenSubida) {
        alert('⚠️ Por favor selecciona o pega una imagen desde tu dispositivo.');
        return;
    }

    const contenedor = document.getElementById('contenido-' + seccionActualModal);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        cerrarModal();
        return;
    }

    let panel = contenedor.querySelector('.panel-editable:first-child');
    
    if (!panel) {
        panel = document.createElement('div');
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
    }
    
    panel.setAttribute('data-imagen-fondo', imagenSubida);
    
    panel.style.backgroundImage = `url(${imagenSubida})`;
    panel.style.backgroundSize = 'cover';
    panel.style.backgroundPosition = 'center';
    panel.style.backgroundRepeat = 'no-repeat';
    panel.style.minHeight = '320px';
    panel.style.borderRadius = '16px';
    panel.style.border = '1px solid rgba(255,255,255,0.3)';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
    panel.style.padding = '0';
    panel.style.overflow = 'hidden';
    panel.style.position = 'relative';
    panel.style.backgroundColor = 'transparent';
    
    const overlayExistente = panel.querySelector('.panel-overlay');
    if (overlayExistente) overlayExistente.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)';
    overlay.style.zIndex = '1';
    overlay.style.borderRadius = '16px';
    panel.prepend(overlay);

    const contenidoPanel = panel.querySelector('div:not(.panel-overlay):not(.panel-controls)');
    if (contenidoPanel) {
        contenidoPanel.style.position = 'relative';
        contenidoPanel.style.zIndex = '2';
        contenidoPanel.style.color = '#ffffff';
        contenidoPanel.style.textShadow = '0 2px 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)';
        contenidoPanel.style.padding = '40px 35px';
        contenidoPanel.style.minHeight = '320px';
        contenidoPanel.style.backgroundColor = 'transparent';
        contenidoPanel.style.borderRadius = '16px';
        contenidoPanel.style.display = 'flex';
        contenidoPanel.style.flexDirection = 'column';
        contenidoPanel.style.justifyContent = 'center';
        
        const textos = contenidoPanel.querySelectorAll('*');
        textos.forEach(el => {
            el.style.color = '#ffffff';
            el.style.textShadow = '0 2px 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)';
        });
        
        const titulos = contenidoPanel.querySelectorAll('h2, h3');
        titulos.forEach(el => {
            el.style.color = '#ffffff';
            el.style.textShadow = '0 2px 30px rgba(0,0,0,0.7), 0 0 50px rgba(0,0,0,0.4)';
            el.style.borderBottomColor = 'rgba(255,255,255,0.2)';
        });
    }

    const controlesPanel = panel.querySelector('.panel-controls');
    if (controlesPanel) {
        controlesPanel.style.position = 'relative';
        controlesPanel.style.zIndex = '2';
        controlesPanel.style.marginTop = '10px';
        controlesPanel.style.paddingTop = '12px';
        controlesPanel.style.borderTop = '1px solid rgba(255,255,255,0.15)';
        const botones = controlesPanel.querySelectorAll('button');
        botones.forEach(btn => {
            btn.style.background = 'rgba(255,255,255,0.15)';
            btn.style.color = '#ffffff';
            btn.style.border = '1px solid rgba(255,255,255,0.1)';
            btn.style.backdropFilter = 'blur(4px)';
        });
        const btnEliminar = controlesPanel.querySelector('.btn-eliminar');
        if (btnEliminar) {
            btnEliminar.style.background = 'rgba(231,76,60,0.5)';
            btnEliminar.style.border = '1px solid rgba(231,76,60,0.3)';
        }
    }

    limpiarModal();
    cerrarModal();
    mostrarNotificacion('✅ Imagen de fondo aplicada al panel');
    guardarCambios();
}

function limpiarModal() {
    document.getElementById('modalInput').value = '';
    const fileInput = document.getElementById('modalFileInput');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('modalPreview');
    if (preview) preview.style.display = 'none';
    imagenSubida = null;
    const btnInsertar = document.getElementById('btnInsertarImagen');
    if (btnInsertar) {
        btnInsertar.disabled = true;
        btnInsertar.style.opacity = '0.5';
        btnInsertar.style.cursor = 'not-allowed';
    }
}

function cerrarModal() {
    const modal = document.getElementById('modalInsertar');
    if (modal) modal.classList.remove('visible');
    limpiarModal();
}

function agregarPanel(seccionId) {
    const contenedor = document.getElementById('contenido-' + seccionId);
    if (!contenedor) {
        alert('⚠️ No se encontró la sección.');
        return;
    }

    const panel = document.createElement('div');
    panel.className = 'panel-editable';
    panel.dataset.id = 'panel-' + Date.now();
    panel.style.background = '#ffffff';
    panel.style.border = '1px solid #e8ecf1';
    panel.style.borderRadius = '16px';
    panel.style.padding = '22px 25px';
    panel.style.marginBottom = '20px';
    panel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';

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
    if (!panel || !btn) return;
    
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

// ==================== */
// FUNCIÓN AJUSTAR COLOR (para degradados suaves)
// ==================== */
function ajustarColor(hex, percent) {
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// ==================== */
// FUNCIÓN APLICAR COLOR DE FONDO - DIRECTO EN BODY
// ==================== */
function aplicarColorFondo() {
    const color = document.getElementById('colorFondo').value;
    document.getElementById('colorFondoText').value = color;
    
    document.body.style.background = color;
}

// ==================== */
// FUNCIÓN APLICAR COLOR DE TEXTO - NO AFECTA A ENCABEZADOS
// ==================== */
function aplicarColorTexto() {
    const color = document.getElementById('colorTexto').value;
    document.getElementById('colorTextoText').value = color;
    
    const elementos = document.querySelectorAll('p, li, span:not(.encabezado), .panel-editable p, .panel-editable li, section p, section li');
    elementos.forEach(el => {
        if (!el.closest('h1') && !el.closest('h2') && !el.closest('h3') && !el.closest('h4') && !el.closest('h5') && !el.closest('h6')) {
            el.style.color = color;
        }
    });
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

// ==================== */
// FUNCIÓN APLICAR ESTILO - NO AFECTA A ENCABEZADOS NI PANELES
// ==================== */
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
    
    if (seccionActual === 'global' && propiedad === 'background') {
        elemento.style.background = valor;
        return;
    }
    
    if (propiedad === 'color') {
        const elementos = elemento.querySelectorAll('p, li, span:not(.encabezado)');
        elementos.forEach(el => {
            if (!el.closest('h1') && !el.closest('h2') && !el.closest('h3') && !el.closest('h4') && !el.closest('h5') && !el.closest('h6')) {
                el.style.color = valor;
            }
        });
        return;
    }
    
    elemento.style[propiedad] = valor;
}

// ==================== */
// RESETEAR ESTILOS
// ==================== */
function resetearEstilos() {
    if (!confirm('¿Resetear todos los estilos personalizados?')) return;

    document.body.style.background = 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f0ff 100%)';
    document.body.style.color = '';
    document.body.style.fontSize = '';
    document.body.style.fontFamily = '';

    const header = document.querySelector('header');
    if (header) {
        header.style.background = '';
        header.style.color = '';
    }

    const elementos = document.querySelectorAll('p, li');
    elementos.forEach(el => {
        if (!el.closest('h1') && !el.closest('h2') && !el.closest('h3') && !el.closest('h4') && !el.closest('h5') && !el.closest('h6')) {
            el.style.color = '';
            el.style.fontSize = '';
            el.style.fontFamily = '';
        }
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

// Función para cargar imagen desde el input file
function cargarImagenDesdeInput(input) {
    const file = input.files[0];
    if (!file) {
        alert('⚠️ No se seleccionó ningún archivo.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        // Guardar imagen en variable global
        imagenSubida = event.target.result;
        
        // Mostrar vista previa
        const preview = document.getElementById('modalPreview');
        const previewImg = document.getElementById('previewImagen');
        previewImg.src = imagenSubida;
        preview.style.display = 'block';
        
        // HABILITAR BOTÓN INSERTAR
        const btnInsertar = document.getElementById('btnInsertarImagen');
        if (btnInsertar) {
            btnInsertar.disabled = false;
            btnInsertar.style.opacity = '1';
            btnInsertar.style.cursor = 'pointer';
            btnInsertar.style.background = 'linear-gradient(135deg, #0f3460, #1a4b6e)';
            btnInsertar.style.color = 'white';
            btnInsertar.style.border = 'none';
            btnInsertar.style.padding = '10px 24px';
            btnInsertar.style.borderRadius = '25px';
            btnInsertar.style.fontWeight = '600';
        }
        
        mostrarNotificacion('📸 Imagen cargada correctamente');
    };
    reader.readAsDataURL(file);
}

// ==================== */
// GUARDADO AUTOMÁTICO
// ==================== */

function autoGuardar() {
    if (sessionStorage.getItem('resetEnProgreso') === 'true') {
        return;
    }
    guardarEnNube();
}

// Guardar automáticamente cada 5 segundos
let intervaloAutoGuardar = setInterval(autoGuardar, 5000);

// Guardar automáticamente antes de cerrar la página
window.addEventListener('beforeunload', function() {
    guardarCambios();
});

// Guardar automáticamente cuando se pierde el foco (cambias de pestaña)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        guardarCambios();
    }
});

// Guardar automáticamente al hacer clic en cualquier parte (cada 10 segundos)
let ultimoClick = Date.now();
document.addEventListener('click', function() {
    const ahora = Date.now();
    if (ahora - ultimoClick > 10000) {
        guardarCambios();
        ultimoClick = ahora;
    }
});

// ==================== */
// CARGAR CONTENIDO GUARDADO
// ==================== */

function cargarContenidoGuardado() {
    const contenidoGuardado = localStorage.getItem('wiki-contenido');
    if (contenidoGuardado) {
        // Extraer solo el body del contenido guardado
        const bodyMatch = contenidoGuardado.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            const nuevoBody = bodyMatch[1];
            // Reemplazar el contenido del body actual
            document.body.innerHTML = nuevoBody;
            
            // Re-ejecutar los scripts después de cargar el contenido
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                const nuevoScript = document.createElement('script');
                if (script.src) {
                    nuevoScript.src = script.src;
                } else {
                    nuevoScript.textContent = script.textContent;
                }
                document.body.appendChild(nuevoScript);
            });
        }
    }
}

console.log('📘 Wiki de Planes de Carrera');
console.log('💡 Haz clic en cualquier texto para editarlo');
console.log('💾 Guardar cambios: guarda en el navegador');
console.log('👁️ Ver Vista Final: muestra los cambios guardados');
console.log('🖼️ Insertar imagen: selecciona o pega una imagen desde tu dispositivo');
console.log('🎬 Insertar video: pega URL de YouTube');
console.log('📦 Panel: agrega un nuevo panel editable');
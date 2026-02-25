const URL_API = "https://script.google.com/macros/s/AKfycbylbsekE_KPfJpGXkBT5xte1e-yRCrSBXX6PgCvsvoAJxecPgrVSgHGwOzTcVkUGp1Zuw/exec";

let noticiasGlobales = []; // Guardamos las noticias en memoria para poder abrirlas luego

document.addEventListener('DOMContentLoaded', () => {
    cargarNoticias();
    cargarFormularios();
});

// ==========================================
// 1. LÓGICA DE NOTICIAS CON ESTILOS PRO
// ==========================================
async function cargarNoticias() {
    const contenedor = document.getElementById('contenedor-noticias');
    
    try {
        const respuesta = await fetch(`${URL_API}?action=get_news`);
        const noticias = await respuesta.json();
        
        contenedor.innerHTML = ''; 

        if (!noticias || noticias.length === 0) {
            contenedor.innerHTML = `<p class="text-slate-500 col-span-3 text-center py-10">No hay comunicados recientes.</p>`;
            return;
        }

        // Guardamos las noticias al revés (la más nueva primero) en la variable global
        noticiasGlobales = noticias.reverse();

        noticiasGlobales.forEach((noticia, index) => {
            let badgeClass = "bg-slate-100 text-slate-700"; 
            let pulseDot = "";
            let nivel = (noticia.Nivel || noticia.nivel || "Informativo").trim().toLowerCase();

            if (nivel === "urgente") {
                badgeClass = "bg-red-50 text-red-700 border border-red-200";
                pulseDot = `<span class="flex w-2 h-2 mr-2 bg-red-600 rounded-full animate-pulse"></span>`;
            } else if (nivel === "importante") {
                badgeClass = "bg-orange-50 text-orange-700 border border-orange-200";
                pulseDot = `<span class="flex w-2 h-2 mr-2 bg-orange-500 rounded-full"></span>`;
            } else if (nivel === "informativo") {
                badgeClass = "bg-blue-50 text-blue-700 border border-blue-200";
                pulseDot = `<span class="flex w-2 h-2 mr-2 bg-blue-500 rounded-full"></span>`;
            }

            const nivelShow = nivel.charAt(0).toUpperCase() + nivel.slice(1);

            const imgHTML = noticia.Imagen 
                ? `<div class="h-48 w-full overflow-hidden"><img src="${noticia.Imagen}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt="Noticia"></div>` 
                : '';

            // Cortamos el texto a 100 caracteres para la vista previa en la tarjeta
            let textoCorto = noticia.Mensaje || "";
            if (textoCorto.length > 100) textoCorto = textoCorto.substring(0, 100) + "...";

            // ¡AÑADIMOS EL ONCLICK Y EL CURSOR-POINTER A LA TARJETA!
            const tarjetaHTML = `
                <div onclick="abrirModalNoticia(${index})" class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 flex flex-col h-full group cursor-pointer">
                    ${imgHTML}
                    <div class="p-6 flex flex-col flex-1">
                        <div class="flex justify-between items-center mb-4">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}">
                                ${pulseDot} ${nivelShow}
                            </span>
                            <span class="text-xs font-medium text-slate-400">
                                ${new Date(noticia.Fecha || new Date()).toLocaleDateString('es-CO')}
                            </span>
                        </div>
                        <h3 class="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">${noticia.Titulo}</h3>
                        <p class="text-slate-600 text-sm leading-relaxed mb-4 flex-1">${textoCorto}</p>
                        <div class="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center">
                            <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atte: ${noticia.Autor || 'Administración'}</p>
                            <span class="text-blue-600 text-xs font-bold group-hover:underline">Leer más →</span>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += tarjetaHTML;
        });

    } catch (error) {
        contenedor.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Error al cargar las noticias. Verifica tu conexión.</p>`;
    }
}

// ==========================================
// NUEVO: FUNCIONES DE LA VENTANA EMERGENTE
// ==========================================
function abrirModalNoticia(index) {
    const noticia = noticiasGlobales[index];
    if (!noticia) return;

    // Colores del Badge para la Modal
    let badgeClass = "bg-slate-100 text-slate-700";
    let pulseDot = "";
    let nivel = (noticia.Nivel || noticia.nivel || "Informativo").trim().toLowerCase();

    if (nivel === "urgente") {
        badgeClass = "bg-red-100 text-red-800 border border-red-200";
        pulseDot = `<span class="flex w-2.5 h-2.5 mr-2 bg-red-600 rounded-full animate-pulse"></span>`;
    } else if (nivel === "importante") {
        badgeClass = "bg-orange-100 text-orange-800 border border-orange-200";
        pulseDot = `<span class="flex w-2.5 h-2.5 mr-2 bg-orange-500 rounded-full"></span>`;
    } else if (nivel === "informativo") {
        badgeClass = "bg-blue-100 text-blue-800 border border-blue-200";
        pulseDot = `<span class="flex w-2.5 h-2.5 mr-2 bg-blue-600 rounded-full"></span>`;
    }

    const nivelShow = nivel.charAt(0).toUpperCase() + nivel.slice(1);
    
    // Inyectar datos en la modal
    document.getElementById('modal-noticia-badge').className = `inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${badgeClass}`;
    document.getElementById('modal-noticia-badge').innerHTML = `${pulseDot} ${nivelShow}`;
    
    document.getElementById('modal-noticia-fecha').innerText = new Date(noticia.Fecha || new Date()).toLocaleDateString('es-CO');
    document.getElementById('modal-noticia-titulo').innerText = noticia.Titulo;
    document.getElementById('modal-noticia-mensaje').innerText = noticia.Mensaje;
    document.getElementById('modal-noticia-autor').innerText = noticia.Autor || 'Administración';

    // Manejar la imagen
    const imgContainer = document.getElementById('modal-noticia-img-container');
    const imgElement = document.getElementById('modal-noticia-img');
    
    if (noticia.Imagen) {
        imgElement.src = noticia.Imagen;
        imgContainer.classList.remove('hidden');
    } else {
        imgElement.src = "";
        imgContainer.classList.add('hidden'); // Ocultar el recuadro si no hay foto
    }

    // Mostrar modal y bloquear scroll trasero
    document.getElementById('modal-noticia').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function cerrarModalNoticia() {
    document.getElementById('modal-noticia').classList.add('hidden');
    document.body.classList.remove('overflow-hidden'); // Devolver el scroll al fondo
}

// ==========================================
// 2. LÓGICA DE FORMULARIOS
// ==========================================
async function cargarFormularios() {
    try {
        const respuesta = await fetch(`${URL_API}?action=get_config`);
        const config = await respuesta.json();

        const espacios = [
            { idBox: 'box-form-1', idFrame: 'iframe-form-1', idTitle: 'title-form-1', url: config.Form1_URL, title: config.Form1_Titulo },
            { idBox: 'box-form-2', idFrame: 'iframe-form-2', idTitle: 'title-form-2', url: config.Form2_URL, title: config.Form2_Titulo },
            { idBox: 'box-form-3', idFrame: 'iframe-form-3', idTitle: 'title-form-3', url: config.Form3_URL, title: config.Form3_Titulo },
            { idBox: 'box-form-4', idFrame: 'iframe-form-4', idTitle: 'title-form-4', url: config.Form4_URL, title: config.Form4_Titulo }
        ];

        espacios.forEach(espacio => {
            if (espacio.url) {
                const box = document.getElementById(espacio.idBox);
                box.classList.remove('hidden');
                box.classList.add('flex');
                document.getElementById(espacio.idFrame).src = espacio.url;
                document.getElementById(espacio.idTitle).innerText = espacio.title || "Servicio / Reserva";
            }
        });

    } catch (error) {
        console.error("Error cargando configuración de formularios:", error);
    }
}
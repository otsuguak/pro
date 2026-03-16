// 1. CONFIGURACIÓN GLOBAL
const URL_API = "https://script.google.com/macros/s/AKfycbyO0Lp_TiWAM6NnO0kUK-TxbhEgJ9snt6anJc4XgY8OiG9LvgNzHZ-akr1T3Vtjt8svMQ/exec"; 

let usuarioActual = "";
let rolActual = "";
let pqrSeleccionada = null; 
let datosGlobales = [];

// =====================================================================
// --- NUEVO: CONTROLADOR DE PANTALLA DE CARGA ---
// =====================================================================

function mostrarLoader(titulo1, titulo2, subtitulo) {
    const loader = document.getElementById('loading-pro');
    if (!loader) return; // Protección: Si el HTML no tiene la pantalla, no hace nada

    const titleEl = document.getElementById('loader-title');
    const subEl = document.getElementById('loader-subtitle');

    // Solo cambia los textos si existen en el HTML
    if (titleEl) titleEl.innerHTML = `${titulo1} <span class="font-bold text-indigo-400">${titulo2}</span>`;
    if (subEl) subEl.innerText = subtitulo;
    
    loader.style.display = 'flex';
    document.body.classList.add('overflow-hidden');
    
    setTimeout(() => {
        loader.classList.remove('opacity-0');
    }, 10);
}

function ocultarLoader() {
    const loader = document.getElementById('loading-pro');
    if (!loader) return;

    loader.classList.add('opacity-0');
    setTimeout(() => {
        loader.style.display = 'none';
        document.body.classList.remove('overflow-hidden');
    }, 700); 
}

// Apagar la pantalla inicial apenas cargue la página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ocultarLoader, 1000);
});


// =====================================================================
// --- FUNCIONES DE NAVEGACIÓN ---
// =====================================================================

function mostrarLogin() {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('recovery-section').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    limpiarFormulario(); 
}

function limpiarFormulario() {
    document.getElementById('reg-nombre').value = "";
    document.getElementById('reg-email').value = "";
    document.getElementById('reg-inmueble').value = "";
    document.getElementById('reg-pass').value = "";
    document.getElementById('reg-pass-confirm').value = "";
    if(document.getElementById('captcha')) document.getElementById('captcha').checked = false;
}

function mostrarRegistro() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
}

function mostrarRecuperacion() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('recovery-section').classList.remove('hidden');
}

function ocultarRecuperacion() {
    document.getElementById('recovery-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
}

// =====================================================================
// --- SISTEMA DE RECUPERACIÓN (OTP) ---
// =====================================================================

async function solicitarCodigo() {
    const email = document.getElementById('rec-email').value.trim();
    const inmueble = document.getElementById('rec-inmueble').value.trim();

    if (!email || !inmueble) return mostrarMensaje("Faltan datos", "Ingresa correo e inmueble.", "error");

    const btn = document.querySelector("#step-1-otp button");
    const textoOriginal = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Verificando", "Usuario", "Comprobando datos y enviando código de seguridad...");

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: "request_otp", email: email, inmueble: inmueble })
        });
        
        const resultado = await response.json();

        if (resultado.result === "success") {
            document.getElementById('step-1-otp').classList.add('hidden');
            document.getElementById('step-2-otp').classList.remove('hidden');
            mostrarMensaje("Código Enviado", "Revisa tu correo y copia el código de verificación.", "success");
        } else {
            mostrarMensaje("Error", resultado.message, "error");
        }
    } catch (e) {
        mostrarMensaje("Error", "No se pudo conectar.", "error");
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

async function cambiarPasswordConCodigo() {
    const email = document.getElementById('rec-email').value.trim(); 
    const codigo = document.getElementById('rec-codigo').value.trim();
    const newPass = document.getElementById('rec-pass').value;

    if (!codigo || !newPass) return mostrarMensaje("Faltan datos", "Ingresa el código y la nueva clave.", "error");

    const passEncriptada = CryptoJS.SHA256(newPass).toString();
    const btn = document.querySelector("#step-2-otp button");
    btn.innerText = "Validando...";
    btn.disabled = true;

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Actualizando", "Seguridad", "Guardando tu nueva contraseña encriptada...");

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: "reset_pass_otp", email: email, codigo: codigo, newPass: passEncriptada })
        });

        const resultado = await response.json();

        if (resultado.result === "success") {
            mostrarMensaje("¡Éxito!", "Contraseña actualizada correctamente. Inicia sesión.", "success");
            ocultarRecuperacion();
            document.getElementById('step-1-otp').classList.remove('hidden');
            document.getElementById('step-2-otp').classList.add('hidden');
            document.getElementById('rec-email').value = "";
            document.getElementById('rec-inmueble').value = "";
            document.getElementById('rec-codigo').value = "";
            document.getElementById('rec-pass').value = "";
        } else {
            mostrarMensaje("Error", resultado.message, "error");
        }
    } catch (e) {
        mostrarMensaje("Error", "Problema de conexión.", "error");
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
        btn.innerText = "Confirmar Cambio";
        btn.disabled = false;
    }
}

// =====================================================================
// --- LOGICA DE LOGIN ---
// =====================================================================

async function login() {
    const email = document.getElementById('email-input').value.trim();
    const pass = document.getElementById('pass-input').value;
    const role = document.getElementById('role-input').value;

    if (!email || !pass) return mostrarMensaje("Faltan datos", "Por favor, ingresa correo y contraseña.", "error");

    const passEncriptada = CryptoJS.SHA256(pass).toString();
    const btn = document.querySelector("#login-section button");
    const originalText = btn.innerText;
    btn.innerText = "Validando...";
    btn.disabled = true;

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Iniciando", "Sesión", "Consultando la base de datos de la copropiedad...");

    try {
        const url = `${URL_API}?action=login&email=${email}&pass=${passEncriptada}&rol=${role}`;
        const resp = await fetch(url);
        const resultado = await resp.json();

        if (resultado.auth) {
            usuarioActual = email;
            rolActual = role;

            // --- MAGIA PRO: BUSCAMOS EL NOMBRE ---
            // Si el servidor envía el nombre, lo usamos. Si no, ponemos el correo por defecto.
            const nombreReal = resultado.nombre || email;

            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            
            // Reemplazamos el correo por el nombreReal
            document.getElementById('welcome-text').innerText = `Hola, ${nombreReal}`;
            document.getElementById('role-badge').innerText = rolActual;

            if (rolActual === 'usuario') {
                document.getElementById('menu-crear').classList.remove('hidden');
                document.getElementById('menu-descargar').classList.add('hidden'); 
                document.getElementById('admin-filters').classList.add('hidden'); 
                document.getElementById('admin-filters').classList.remove('flex');
                // Ocultar botones de admin:
                document.getElementById('menu-admin-noticias').classList.add('hidden');
                document.getElementById('menu-admin-config').classList.add('hidden');
            } else {
                document.getElementById('menu-crear').classList.add('hidden');
                document.getElementById('menu-descargar').classList.remove('hidden'); 
                document.getElementById('admin-filters').classList.remove('hidden');
                document.getElementById('admin-filters').classList.add('flex');
                // Mostrar botones de admin:
                document.getElementById('menu-admin-noticias').classList.remove('hidden');
                document.getElementById('menu-admin-config').classList.remove('hidden');
            }

            await cargarDatosReales();
        } else {
            mostrarMensaje("Acceso Denegado", "Verifica tu correo, contraseña o el rol seleccionado.", "error");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        mostrarMensaje("Error de Conexión", "No se pudo conectar con el servidor.", "error");
        btn.innerText = originalText;
        btn.disabled = false;
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
    }
}

// =====================================================================
// --- LOGICA DE REGISTRO ---
// =====================================================================

async function registrarUsuario() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const rol = document.getElementById('reg-rol').value;
    const celular = document.getElementById('reg-celular').value; 
    const inmueble = document.getElementById('reg-inmueble').value;
    const tipoResidente = document.getElementById('reg-tipo-residente').value; 
    const pass = document.getElementById('reg-pass').value;
    const passConfirm = document.getElementById('reg-pass-confirm').value;
    const captcha = document.getElementById('captcha').checked;

    if (!nombre || !email || !pass || !inmueble || !celular || !tipoResidente) {
        return mostrarMensaje("Faltan datos", "Por favor completa todos los campos.", "error");
    }
    if (pass !== passConfirm) return mostrarMensaje("Error", "Las contraseñas no coinciden.", "error");
    if (!captcha) return mostrarMensaje("Seguridad", "Confirma que no eres un robot.", "error");

    const passEncriptada = CryptoJS.SHA256(pass).toString();

    const nuevoUsuario = {
        action: "register", nombre: nombre, email: email, rol: rol, celular: celular,       
        inmueble: inmueble, tipoResidente: tipoResidente, password: passEncriptada
    };

    const btn = document.querySelector("#register-section button");
    const textoOriginal = btn.innerText;
    btn.innerText = "Creando cuenta...";
    btn.disabled = true;

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Creando", "Cuenta", "Configurando tu nuevo perfil de usuario...");

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify(nuevoUsuario)
        });
        
        const textoRespuesta = await response.text();
        
        if (textoRespuesta.includes('"result":"success"') || textoRespuesta.includes('"result": "success"')) {
            mostrarMensaje("¡Bienvenido!", "Cuenta creada exitosamente. Ya puedes ingresar.", "success");
            limpiarFormulario();
            mostrarLogin();
        } else if (textoRespuesta.includes("error")) {
             try {
                 const jsonErr = JSON.parse(textoRespuesta);
                 mostrarMensaje("Atención", jsonErr.message, "error");
             } catch(e) {
                 mostrarMensaje("Atención", "El correo ya está registrado.", "error");
             }
        } else {
             mostrarMensaje("¡Registro Exitoso!", "Cuenta creada.", "success");
             limpiarFormulario();
             mostrarLogin();
        }
    } catch (error) {
        mostrarMensaje("Revisa tu conexión", "Hubo un problema de red.", "error");
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

// =====================================================================
// --- LOGICA DE PQRs ---
// =====================================================================

async function enviarPQR() {
    const descElement = document.getElementById('pqr-desc');
    const tipoElement = document.getElementById('pqr-tipo');
    const subTipoElement = document.getElementById('pqr-subtipo');
    const archivoElement = document.getElementById('pqr-archivo');

    if (!descElement.value) return mostrarMensaje("Falta información", "Por favor describe tu solicitud.", "error");

    const btn = document.querySelector("#modal-crear-pqr button"); 
    const textoOriginal = btn.innerText;
    btn.innerText = "Subiendo...";
    btn.disabled = true;

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Radicando", "Solicitud", "Subiendo la información al sistema...");

    let datos = {
        email: usuarioActual, tipo: tipoElement.value,
        subTipo: subTipoElement.value, descripcion: descElement.value
    };

    if (archivoElement.files.length > 0) {
        const file = archivoElement.files[0];
        
        if (file.size > 2 * 1024 * 1024) {
            ocultarLoader();
            mostrarMensaje("Archivo muy pesado", "El archivo no debe superar los 2MB.", "error");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }

        try {
            const base64 = await toBase64(file);
            datos.archivoBase64 = base64.split(',')[1];
            datos.mimeType = file.type;
            datos.nombreArchivo = file.name;
        } catch (e) {
            ocultarLoader();
            mostrarMensaje("Error de archivo", "No se pudo procesar el adjunto.", "error");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }
    }

    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datos) });
        mostrarMensaje("¡Enviado!", "Tu solicitud ha sido radicada con éxito.", "success");
        cerrarModalPQR(); 
        descElement.value = ""; archivoElement.value = ""; 
        await cargarDatosReales(); 
    } catch (error) {
        mostrarMensaje("Error", "No se pudo enviar la solicitud.", "error");
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function cargarDatosReales() {
    try {
        const urlFinal = `${URL_API}?email=${encodeURIComponent(usuarioActual)}&rol=${rolActual}&t=${new Date().getTime()}`;
        const respuesta = await fetch(urlFinal);
        const datos = await respuesta.json(); 

        datosGlobales = datos; // <--- AGREGAMOS ESTA LÍNEA AQUÍ
        renderizarTabla(datosGlobales);
        actualizarGrafica(datosGlobales);
    } catch (error) {
        console.log("Error de lectura de datos:", error);
    }
}

function renderizarTabla(datos) {
    const tableBody = document.getElementById('pqr-table-body');

    if (!datos || datos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">No hay registros aún.</td></tr>`;
        return;
    }

    tableBody.innerHTML = datos.map(item => {
        const estadoReal = item.Estado || item.estado || 'Abierto';
        let fechaBonita = "---";
        if (item.FechaC) {
            const f = new Date(item.FechaC);
            fechaBonita = f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        const colorClase = estadoReal.trim().toLowerCase() === 'cerrado' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : (estadoReal.trim().toLowerCase() === 'en proceso' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-red-100 text-red-800 border border-red-200');

        return `
            <tr class="border-b hover:bg-slate-50 transition duration-150 text-sm">
                <td class="p-4 font-medium text-gray-700">${item.ID || '---'}</td>
                <td class="p-4 text-gray-500">${fechaBonita}</td> <td class="p-4 text-gray-600">${item.Email || '---'}</td>
                <td class="p-4 text-gray-600">${item.Tipo || '---'}</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full text-xs font-bold shadow-sm ${colorClase}">${estadoReal}</span></td>
                <td class="p-4 text-center">
                    <button class="text-blue-600 hover:text-blue-800 font-semibold hover:underline" onclick="verDetalle('${item.ID}')">Gestionar</button>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarGrafica(datos) {
    // 1. Tarjetas KPI Superiores (Se mantienen intactas)
    const cerrados = datos.filter(d => (d.Estado || d.estado) === 'Cerrado').length;
    const abiertos = datos.filter(d => (d.Estado || d.estado) === 'Abierto').length;
    const procesos = datos.filter(d => (d.Estado || d.estado) === 'En Proceso').length;
    
    document.getElementById('kpi-total').innerText = datos.length;
    document.getElementById('kpi-abiertos').innerText = abiertos; 
    if(document.getElementById('kpi-proceso')) document.getElementById('kpi-proceso').innerText = procesos; 
    document.getElementById('kpi-cerrados').innerText = cerrados;

    const ctx = document.getElementById('myChart').getContext('2d');
    if (window.chartPQR) { window.chartPQR.destroy(); }

    // =========================================================
    // 2. MAGIA PRO: Gráfico Mixto (Línea + Barras) de 7 Días
    // =========================================================
    const ultimos7Dias = [];
    const recibidosPorDia = [];
    const pendientesPorDia = [];

    // Generamos la "Ventana Móvil" de los últimos 7 días
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        ultimos7Dias.push(fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }));

        // Filtramos los casos que llegaron ese día exacto
        const casosDelDia = datos.filter(item => {
            const f = item.FechaC || item.Fecha || item['Fecha Creacion'];
            if (!f) return false;
            const d = new Date(f);
            return d.getDate() === fecha.getDate() && d.getMonth() === fecha.getMonth();
        });

        // 1. Total recibidos
        recibidosPorDia.push(casosDelDia.length);
        
        // 2. De esos recibidos, ¿cuántos siguen Abiertos o En Proceso?
        const pendientes = casosDelDia.filter(c => (c.Estado || c.estado) !== 'Cerrado').length;
        pendientesPorDia.push(pendientes);
    }

    // Degradado azul elegante para la línea
    const gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(37, 99, 235, 0.25)'); // Azul muy suave
    gradientBlue.addColorStop(1, 'rgba(37, 99, 235, 0.0)');  // Transparente

    // 3. Dibujamos el Gráfico Mixto
    window.chartPQR = new Chart(ctx, {
        data: {
            labels: ultimos7Dias,
            datasets: [
                {
                    type: 'line',
                    label: 'Total Casos Recibidos',
                    data: recibidosPorDia,
                    borderColor: '#2563eb', // Azul vibrante
                    backgroundColor: gradientBlue,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // Curva suave y elegante
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    order: 1 // Dibuja la línea por encima de las barras
                },
                {
                    type: 'bar',
                    label: 'Casos Aún Pendientes',
                    data: pendientesPorDia,
                    backgroundColor: 'rgba(239, 68, 68, 0.85)', // Rojo alerta
                    borderRadius: 6, // Bordes redondeados en la barra
                    barPercentage: 0.3, // Barras delgadas y modernas
                    order: 2 // Dibuja las barras por debajo
                }
            ]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false, // Muestra los datos de ambos al pasar el mouse
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(0, 0, 0, 0.04)', borderDash: [5, 5] }, 
                    ticks: { precision: 0, color: '#64748b' }
                }, 
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#64748b', font: { family: "'Inter', sans-serif" } }
                } 
            },
            plugins: { 
                legend: { 
                    display: true, 
                    position: 'top',
                    labels: { usePointStyle: true, boxWidth: 8, font: { family: "'Inter', sans-serif", size: 12 } }
                }, 
                tooltip: { 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    titleFont: { family: "'Inter', sans-serif", size: 13 }, 
                    bodyFont: { family: "'Inter', sans-serif", size: 13 }, 
                    padding: 12, 
                    cornerRadius: 8,
                    usePointStyle: true
                } 
            }
        }
    });
}

function verDetalle(id) {
    const caso = datosGlobales.find(item => item.ID === id);
    if (!caso) return mostrarMensaje("No se pudo cargar la información del caso.");

    pqrSeleccionada = id;
    document.getElementById('modal-detalle').classList.remove('hidden');
    document.getElementById('det-id').innerText = caso.ID;

    // 1. EXTRAEMOS LOS DATOS
    const subTipo = caso['Sub Tipo'] || caso.subTipo || '';
    const descripcionOriginal = caso.Descripcion || "Sin descripción";
    const historialRespuestas = caso.Respuesta || "";

    // 2. MAGIA CTO: ARMAMOS LA CAJA DE DESCRIPCIÓN + HISTORIAL CON SCROLL
    let htmlContenido = `<span class="block font-bold text-xs text-blue-600 mb-1">${subTipo}</span>`;
    htmlContenido += `<p class="text-sm text-gray-700">${descripcionOriginal}</p>`;

    // Si hay historial, le agregamos la caja con scroll (max-h-32 y overflow-y-auto)
    if (historialRespuestas.trim() !== "") {
        htmlContenido += `
            <div class="mt-4 pt-3 border-t border-gray-200">
                <span class="block font-bold text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                    <i class="fas fa-history mr-1"></i> Historial de Gestión
                </span>
                <div class="bg-slate-50 p-3 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap border border-slate-200 shadow-inner custom-scroll">
                    ${historialRespuestas}
                </div>
            </div>
        `;
    }
    document.getElementById('det-desc').innerHTML = htmlContenido;

    // 3. ENLACE DE ADJUNTO
    const linkAdjunto = caso.Adjunto || "";
    const divAdjunto = document.getElementById('det-adjunto-container'); 
    
    if (divAdjunto) {
        if (linkAdjunto && linkAdjunto.startsWith("http")) {
            divAdjunto.innerHTML = `<a href="${linkAdjunto}" target="_blank" class="text-blue-600 font-bold hover:text-blue-800 underline text-sm flex items-center mt-3"><i class="fas fa-paperclip mr-1"></i> Ver archivo adjunto</a>`;
        } else {
            divAdjunto.innerHTML = "";
        }
    }
    
    // 4. DATOS EXTRA
    if (document.getElementById('det-email')) document.getElementById('det-email').innerText = caso.Email || "Desconocido";
    if (document.getElementById('det-estado')) document.getElementById('det-estado').innerText = caso.Estado || "Abierto";

    // 5. LÓGICA DE VISTAS (RESIDENTE VS ADMIN)
    if (rolActual === 'usuario') {
        document.getElementById('seccion-respuesta').classList.add('hidden');
        // Ocultamos la vista vieja porque ya el historial está arriba en la descripción
        if (document.getElementById('vista-respuesta-usuario')) document.getElementById('vista-respuesta-usuario').classList.add('hidden');
        if (typeof toggleBtnGuardar === 'function') toggleBtnGuardar(false); 
    } else {
        document.getElementById('seccion-respuesta').classList.remove('hidden');
        if (document.getElementById('vista-respuesta-usuario')) document.getElementById('vista-respuesta-usuario').classList.add('hidden');
        document.getElementById('input-respuesta').value = ""; 
        
        const estadoActual = caso.Estado || "Abierto";
        const selector = document.getElementById('input-estado');
        if (selector) selector.value = (estadoActual === 'Cerrado') ? 'Cerrado' : 'En Proceso';
        if (typeof toggleBtnGuardar === 'function') toggleBtnGuardar(true); 
    }
}

function cerrarModal() {
    document.getElementById('modal-detalle').classList.add('hidden');
    document.getElementById('input-respuesta').value = ""; 
}

function abrirModalPQR() {
    document.getElementById('pqr-desc').value = ""; document.getElementById('pqr-archivo').value = "";
    document.getElementById('modal-crear-pqr').classList.remove('hidden');
}

function cerrarModalPQR() {
    document.getElementById('modal-crear-pqr').classList.add('hidden');
}

async function guardarRespuesta() {
    const respuestaTexto = document.getElementById('input-respuesta').value;
    const nuevoEstado = document.getElementById('input-estado').value;

    if (!respuestaTexto) return mostrarMensaje("Falta información", "Por favor escribe una respuesta para el usuario antes de guardar.", "error");

    // 🛡️ BÚSQUEDA DEL BOTÓN A PRUEBA DE BALAS
    // Intenta buscar el botón de varias formas, o usa el que recibió el clic
    const btn = document.querySelector("#seccion-respuesta button") || document.querySelector("button[onclick='guardarRespuesta()']");
    let textoOriginal = "Guardar";
    
    if (btn) {
        textoOriginal = btn.innerText;
        btn.innerText = "Guardando...";
        btn.disabled = true;
    }

    // ENCENDEMOS PANTALLA DE CARGA
    mostrarLoader("Guardando", "Gestión", "Actualizando el caso y notificando al residente...");

    const datosActualizacion = { action: "update_pqr", id: pqrSeleccionada, respuesta: respuestaTexto, estado: nuevoEstado };

    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(datosActualizacion) });
        cerrarModal();
        mostrarMensaje("¡Gestión Guardada!", "El caso ha sido actualizado y notificado correctamente.", "success");
        setTimeout(async () => { await cargarDatosReales(); }, 1000); 
    } catch (e) {
        mostrarMensaje("Error", "No se pudo guardar la respuesta. Intenta nuevamente.", "error");
    } finally {
        // APAGAMOS PANTALLA DE CARGA
        ocultarLoader();
        // Restauramos el botón solo si existe
        if (btn) {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    }
}

function mostrarMensaje(titulo, texto, tipo = 'info') {
    const modal = document.getElementById('msg-modal');
    const content = document.getElementById('msg-modal-content');
    const titleEl = document.getElementById('msg-title');
    const bodyEl = document.getElementById('msg-body');
    const iconEl = document.getElementById('msg-icon');

    titleEl.innerText = titulo; bodyEl.innerText = texto || ""; modal.classList.remove('hidden');

    if (tipo === 'error') {
        content.classList.replace('border-blue-600', 'border-red-500'); content.classList.replace('border-green-600', 'border-red-500');
        iconEl.innerHTML = `<svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (tipo === 'success') {
        content.classList.replace('border-red-500', 'border-green-600'); content.classList.replace('border-blue-600', 'border-green-600');
        iconEl.innerHTML = `<svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else {
        content.classList.replace('border-red-500', 'border-blue-600'); content.classList.replace('border-green-600', 'border-blue-600');
        iconEl.innerHTML = `<svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }
}

function cerrarMensaje() { document.getElementById('msg-modal').classList.add('hidden'); }

function descargarExcel() {
    if (rolActual !== 'agente') return mostrarMensaje("Acceso Denegado", "Solo los administradores pueden exportar datos.", "error");
    if (!datosGlobales || datosGlobales.length === 0) return mostrarMensaje("Sin datos", "No hay registros para exportar.", "error");

    // 1. Quitamos "Fecha Cierre" de los títulos
    let csvContent = "ID,Fecha Creacion,Usuario,Nombre,Tipo,SubTipo,Descripcion,Estado,Respuesta Agente\n";

    datosGlobales.forEach(row => {
        const cleanText = (text) => text ? `"${text.toString().replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
        
        let fechaCrea = row.FechaC || row['Fecha Creacion'] || row.Fecha || ""; 
        if (fechaCrea) fechaCrea = new Date(fechaCrea).toLocaleDateString('es-CO');

        // 2. Quitamos la variable de fecha de cierre de esta lista
        let rowString = [
            cleanText(row.ID), 
            cleanText(fechaCrea), 
            cleanText(row.Email), 
            cleanText(row.NombreReal || ""), 
            cleanText(row.Tipo), 
            cleanText(row.subTipo || row['Sub tipo']), 
            cleanText(row.Descripcion),
            cleanText(row.Estado || row.estado), 
            cleanText(row.Respuesta)
        ].join(",");
        
        csvContent += rowString + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_PQRs_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// =====================================================================
// --- NUEVO: FUNCIÓN PARA FILTRAR LA TABLA (ADMINISTRADOR) ---
// =====================================================================
function filtrarTabla() {
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const filtroEstado = document.getElementById('filtro-estado').value;

    // Empezamos con todos los datos
    let datosFiltrados = datosGlobales;

    // Filtramos por Tipo si no es "Todos"
    if (filtroTipo !== "Todos") {
        datosFiltrados = datosFiltrados.filter(item => item.Tipo === filtroTipo);
    }

    // Filtramos por Estado si no es "Todos"
    if (filtroEstado !== "Todos") {
        datosFiltrados = datosFiltrados.filter(item => (item.Estado || item.estado) === filtroEstado);
    }

    // Dibujamos la tabla solo con los que pasaron el filtro
    renderizarTabla(datosFiltrados);
}

// =====================================================================
// --- LÓGICA DE DIRECTORIO Y CONFIGURACIÓN ---
// =====================================================================
window.abrirModalDirectorio = async () => {
    document.getElementById('modal-directorio').classList.remove('hidden');
    try {
        const resp = await fetch(`${URL_API}?action=get_config`);
        const data = await resp.json();
        document.getElementById('dir-admin').innerText = data.TelAdmin || "No registrado";
        document.getElementById('dir-porteria').innerText = data.TelPorteria || "No registrado";
        document.getElementById('dir-emergencia').innerText = data.TelEmergencia || "No registrado";
    } catch(e) {}
};

window.cerrarModalGeneral = (id) => document.getElementById(id).classList.add('hidden');

window.abrirModalConfig = async () => {
    document.getElementById('modal-admin-config').classList.remove('hidden');
    mostrarLoader("Cargando", "Configuración", "Recuperando datos...");
    try {
        const resp = await fetch(`${URL_API}?action=get_config`);
        const data = await resp.json();
        document.getElementById('conf-f1-t').value = data.Form1_Titulo || ""; document.getElementById('conf-f1-u').value = data.Form1_URL || "";
        document.getElementById('conf-f2-t').value = data.Form2_Titulo || ""; document.getElementById('conf-f2-u').value = data.Form2_URL || "";
        document.getElementById('conf-f3-t').value = data.Form3_Titulo || ""; document.getElementById('conf-f3-u').value = data.Form3_URL || "";
        document.getElementById('conf-f4-t').value = data.Form4_Titulo || ""; document.getElementById('conf-f4-u').value = data.Form4_URL || "";
        document.getElementById('conf-tel-admin').value = data.TelAdmin || "";
        document.getElementById('conf-tel-porteria').value = data.TelPorteria || "";
        document.getElementById('conf-tel-emergencia').value = data.TelEmergencia || "";
    } catch(e) {}
    ocultarLoader();
};

window.guardarConfiguracionPro = async () => {
    const payload = {
        action: "save_config",
        f1t: document.getElementById('conf-f1-t').value, f1u: document.getElementById('conf-f1-u').value,
        f2t: document.getElementById('conf-f2-t').value, f2u: document.getElementById('conf-f2-u').value,
        f3t: document.getElementById('conf-f3-t').value, f3u: document.getElementById('conf-f3-u').value,
        f4t: document.getElementById('conf-f4-t').value, f4u: document.getElementById('conf-f4-u').value,
        telAdmin: document.getElementById('conf-tel-admin').value,
        telPorteria: document.getElementById('conf-tel-porteria').value,
        telEmergencia: document.getElementById('conf-tel-emergencia').value
    };

    mostrarLoader("Guardando", "Ajustes", "Actualizando portal público...");
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(payload) });
        mostrarMensaje("¡Éxito!", "Configuración guardada correctamente.", "success");
        cerrarModalGeneral('modal-admin-config');
    } catch(e) { mostrarMensaje("Error", "Fallo al guardar.", "error"); }
    ocultarLoader();
};

// =====================================================================
// --- LÓGICA DE NOTICIAS (MÁXIMO 8, CON URL, EDITAR Y BORRAR) ---
// =====================================================================
let noticiasAdminGlobal = [];

window.abrirModalNoticias = async () => {
    document.getElementById('modal-admin-noticias').classList.remove('hidden');
    volverListaNoticias();
    await cargarNoticiasAdmin();
};

window.volverListaNoticias = () => {
    document.getElementById('vista-form-noticia').classList.add('hidden');
    document.getElementById('vista-lista-noticias').classList.remove('hidden');
};

window.cargarNoticiasAdmin = async () => {
    mostrarLoader("Cargando", "Noticias", "Buscando comunicados...");
    try {
        const resp = await fetch(`${URL_API}?action=get_news`);
        const data = await resp.json();
        noticiasAdminGlobal = data.filter(n => n.Titulo); // Limpiamos vacíos
        
        document.getElementById('contador-noticias').innerText = noticiasAdminGlobal.length;
        document.getElementById('btn-nueva-noticia').classList.toggle('hidden', noticiasAdminGlobal.length >= 8); // Límite de 8

        const tbody = document.getElementById('tabla-admin-noticias');
        if (noticiasAdminGlobal.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No hay noticias.</td></tr>';
            return;
        }

        tbody.innerHTML = noticiasAdminGlobal.map(noti => {
            const f = noti.Fecha ? new Date(noti.Fecha).toLocaleDateString() : '--';
            return `
                <tr class="border-b hover:bg-gray-50 text-sm">
                    <td class="p-3">${f}</td>
                    <td class="p-3 font-bold">${noti.Titulo}</td>
                    <td class="p-3">${noti.Nivel || noti.Categoria || 'Info'}</td>
                    <td class="p-3 text-center">
                        <button onclick="editarNoticiaPro('${noti.ID || noti.id}')" class="text-blue-500 mr-2"><i class="fas fa-edit"></i></button>
                        <button onclick="borrarNoticiaPro('${noti.ID || noti.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        }).join('');
    } catch (e) { console.log(e); }
    ocultarLoader();
};

// --- ABRIR FORMULARIO LIMPIO (A prueba de balas) ---
window.mostrarFormularioNoticia = () => {
    document.getElementById('vista-lista-noticias').classList.add('hidden');
    document.getElementById('vista-form-noticia').classList.remove('hidden');
    
    document.getElementById('noti-id').value = "";
    document.getElementById('noti-titulo').value = "";
    document.getElementById('noti-contenido').value = "";
    document.getElementById('noti-imagen').value = "";
    document.getElementById('noti-categoria').value = "Informativo";
    
    // Asignación de fecha segura que no bloquea el navegador
    document.getElementById('noti-fecha').value = new Date().toISOString().split('T')[0]; 
    
    document.getElementById('btn-guardar-noti').innerText = "Publicar Noticia";
};

// --- EDITAR NOTICIA (Buscador implacable) ---
window.editarNoticiaPro = (id) => {
    // 1. Buscamos el ID quitándole cualquier espacio fantasma
    const noti = noticiasAdminGlobal.find(n => String(n.ID || n.id).trim() === String(id).trim());
    
    if(!noti) {
        Swal.fire("Error", "No se encontró el ID de la noticia.", "error");
        return;
    }

    // 2. Abrimos el formulario
    mostrarFormularioNoticia();

    // 3. Llenamos los datos sin importar si vienen vacíos
    document.getElementById('noti-id').value = noti.ID || noti.id;
    document.getElementById('noti-titulo').value = noti.Titulo || '';
    document.getElementById('noti-contenido').value = noti.Mensaje || noti.Contenido || '';
    document.getElementById('noti-imagen').value = noti.Imagen || noti.ImagenUrl || '';

    // Arreglar la categoría (por si vienen espacios del Excel)
    const nivel = (noti.Nivel || noti.Categoria || 'Informativo').trim();
    const selectCat = document.getElementById('noti-categoria');
    // Verificamos que la categoría exista en las opciones
    if([...selectCat.options].some(o => o.value === nivel)) {
        selectCat.value = nivel;
    }

    // 4. Fechas a prueba de balas (Detecta formato texto o fecha real)
    if(noti.Fecha) {
        try {
            let fechaString = String(noti.Fecha);
            let d;
            
            if(fechaString.includes('/')) {
                // Si el Excel lo mandó como 24/02/2026
                let partes = fechaString.split('/');
                d = new Date(`${partes[2]}-${partes[1]}-${partes[0]}T12:00:00`);
            } else {
                d = new Date(noti.Fecha);
            }

            if (!isNaN(d.getTime())) {
                const mes = String(d.getMonth() + 1).padStart(2, '0');
                const dia = String(d.getDate()).padStart(2, '0');
                document.getElementById('noti-fecha').value = `${d.getFullYear()}-${mes}-${dia}`;
            }
        } catch(e) { console.log("Error de fecha", e); }
    }

    // 5. Cambiamos el texto del botón
    document.getElementById('btn-guardar-noti').innerText = "Actualizar Noticia";
};

window.guardarNoticiaPro = async () => {
    // 1. Capturamos el ID y lo limpiamos de espacios fantasma
    const idRaw = document.getElementById('noti-id').value;
    const idLimpio = idRaw ? String(idRaw).trim() : "";

    const payload = {
        action: idLimpio ? "edit_news" : "save_news", 
        id: idLimpio,
        titulo: document.getElementById('noti-titulo').value.trim(),
        mensaje: document.getElementById('noti-contenido').value.trim(),
        nivel: document.getElementById('noti-categoria').value,
        fecha: document.getElementById('noti-fecha').value,
        imagenUrl: document.getElementById('noti-imagen').value.trim(),
        autor: "Administración" // Fijo por ahora
    };

    if (!payload.titulo || !payload.mensaje) {
        return Swal.fire("Atención", "El título y el mensaje son obligatorios.", "warning");
    }

    mostrarLoader("Guardando", "Noticia", "Sincronizando con la cartelera...");
    
    try {
        console.log("Enviando orden a Google:", payload);
        const resp = await fetch(URL_API, { method: 'POST', body: JSON.stringify(payload) });
        const textoServidor = await resp.text();
        console.log("Google Respondió:", textoServidor);
        
        if(textoServidor.includes('"error"')) {
            ocultarLoader();
            return Swal.fire("Error del Servidor", "Google rechazó la actualización. Revisa la consola.", "error");
        }
        
        Swal.fire("¡Listo!", idLimpio ? "Noticia actualizada correctamente." : "Noticia publicada con éxito.", "success");
        volverListaNoticias();
        
        // Freno de 1.5 segundos para que Google alcance a escribir en el Excel
        setTimeout(async () => {
            await cargarNoticiasAdmin(); 
            ocultarLoader();
        }, 1500);

    } catch(e) {
        ocultarLoader();
        Swal.fire("Error de conexión", "Fallo al comunicarse con el servidor de Google.", "error");
    }
};

// --- 2. BORRAR NOTICIA (Con ventana hermosa SweetAlert) ---
window.borrarNoticiaPro = async (id) => {
    // Adiós recuadro feo, hola alerta divina
    const result = await Swal.fire({
        title: '¿Eliminar Noticia?',
        text: "Esta acción la borrará de la cartelera para siempre.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return; // Si cancela, no hacemos nada

    mostrarLoader("Borrando", "Noticia", "Eliminando de la base de datos...");
    try {
        await fetch(URL_API, { method: 'POST', body: JSON.stringify({ action: "delete_news", id: id }) });
        Swal.fire('¡Borrada!', 'La noticia fue eliminada correctamente.', 'success');
        await cargarNoticiasAdmin(); // Recarga la tabla de fondo
    } catch(e) {
        Swal.fire('Error', 'Fallo al intentar borrar.', 'error');
    }
    ocultarLoader();
};
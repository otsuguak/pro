// 1. CONFIGURACIÓN GLOBAL
const URL_API = "https://script.google.com/macros/s/AKfycbylbsekE_KPfJpGXkBT5xte1e-yRCrSBXX6PgCvsvoAJxecPgrVSgHGwOzTcVkUGp1Zuw/exec"; 

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
                document.getElementById('admin-filters').classList.add('hidden'); // Oculta filtros al residente
                document.getElementById('admin-filters').classList.remove('flex');
            } else {
                document.getElementById('menu-crear').classList.add('hidden');
                document.getElementById('menu-descargar').classList.remove('hidden'); 
                document.getElementById('admin-filters').classList.remove('hidden'); // Muestra filtros al agente
                document.getElementById('admin-filters').classList.add('flex');
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

    const subTipo = caso['Sub Tipo'] || caso.subTipo || '';
    document.getElementById('det-desc').innerHTML = `<span class="block font-bold text-xs text-blue-600 mb-1">${subTipo}</span>${caso.Descripcion || "Sin descripción"}`;

    const linkAdjunto = caso.Adjunto || "";
    const divAdjunto = document.getElementById('det-adjunto-container'); 
    
    if (divAdjunto) {
        if (linkAdjunto && linkAdjunto.startsWith("http")) {
            divAdjunto.innerHTML = `<a href="${linkAdjunto}" target="_blank" class="text-blue-600 underline text-sm flex items-center mt-2">📎 Ver archivo adjunto</a>`;
        } else {
            divAdjunto.innerHTML = "";
        }
    }
    
    document.getElementById('det-email').innerText = caso.Email || "Desconocido";
    document.getElementById('det-estado').innerText = caso.Estado || "Abierto";
    const respuestaActual = caso.Respuesta || "";

    if (rolActual === 'usuario') {
        document.getElementById('seccion-respuesta').classList.add('hidden');
        document.getElementById('vista-respuesta-usuario').classList.remove('hidden');
        document.getElementById('det-respuesta-texto').innerText = respuestaActual || "Aún no hay una respuesta oficial.";
        toggleBtnGuardar(false); // <--- Oculta el botón de guardar al residente
    } else {
        document.getElementById('seccion-respuesta').classList.remove('hidden');
        document.getElementById('vista-respuesta-usuario').classList.add('hidden');
        document.getElementById('input-respuesta').value = ""; 
        
        const estadoActual = caso.Estado || "Abierto";
        const selector = document.getElementById('input-estado');
        if (selector) selector.value = (estadoActual === 'Cerrado') ? 'Cerrado' : 'En Proceso';
        toggleBtnGuardar(true); // <--- Muestra el botón de guardar al Administrador
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

    const btn = document.querySelector("#seccion-respuesta button");
    const textoOriginal = btn.innerText;
    btn.innerText = "Guardando...";
    btn.disabled = true;

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
        btn.innerText = textoOriginal;
        btn.disabled = false;
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
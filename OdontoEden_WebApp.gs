/**
 * OdontoEden — Google Apps Script Web App
 * ─────────────────────────────────────────────────────────────────────────────
 * Crea citas en el Google Calendar del consultorio y envía al paciente
 * la confirmación automática de Google Calendar por correo.
 *
 * REQUISITO DE DESPLIEGUE:
 *   Implementar → Nueva implementación → Tipo: Aplicación web
 *   · Ejecutar como : Yo (la cuenta Google dueña del calendario)
 *   · Acceso        : Cualquier usuario   ← OBLIGATORIO para que fetch() funcione
 *
 * REQUISITO DE TIMEZONE:
 *   En el editor de Apps Script: Configuración del proyecto → Zona horaria
 *   Seleccionar: (GMT-5:00) América/Guayaquil
 *   Si no lo haces, new Date(año, mes, día, hora, min) quedará en la hora equivocada.
 *
 * DATO FALTANTE — debes reemplazar antes de desplegar:
 *   CALENDAR_ID → ID del calendario del consultorio.
 *   Lo encuentras en: Google Calendar → ⚙ Configuración → nombre del calendario
 *   → "ID del calendario" (ej: abc123@group.calendar.google.com)
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/** ID del Google Calendar del consultorio (cuenta principal del consultorio). */
var CALENDAR_ID = 'odontoeden.uio@gmail.com';

/**
 * Zona horaria del consultorio.
 * Usada en Utilities.formatDate() para construir la fecha local correcta
 * independientemente de la configuración del proyecto de Apps Script.
 * Ecuador continental opera en UTC-5 todo el año (no usa horario de verano).
 */
var TIMEZONE = 'America/Guayaquil';

/** Duración de cada cita en milisegundos. Ajustar si el consultorio usa otro tiempo. */
var DURATION_MS = 60 * 60 * 1000; // 60 minutos

/** Datos del consultorio incluidos en la descripción del evento. */
var CONSULTORIO = {
  nombre:    'OdontoEden',
  eslogan:   'Tu sonrisa es nuestra pasión',
  direccion: 'Alemania N29-41, 170102 Quito, Edificio Piramide 1',
  telefono:  '0958882566'
};

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER HTTP — POST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recibe el POST del formulario web, valida los campos y crea la cita.
 *
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}  JSON con { success, message, eventId }
 *                                                  o    { success: false, error }
 */
function doPost(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);

  try {
    // ── 1. Parseo seguro ──────────────────────────────────────────────────────
    if (!e || !e.postData || !e.postData.contents) {
      return json(out, { success: false, error: 'No se recibieron datos en el cuerpo del request.' });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      return json(out, { success: false, error: 'El cuerpo no es JSON válido.' });
    }

    // ── 2. Validación de campos requeridos ────────────────────────────────────
    var requeridos = ['fullName', 'email', 'phone', 'service', 'preferredDate', 'preferredTime'];
    for (var i = 0; i < requeridos.length; i++) {
      var campo = requeridos[i];
      if (!data[campo] || String(data[campo]).trim() === '') {
        return json(out, { success: false, error: 'Campo requerido faltante: ' + campo });
      }
    }

    // ── 3. Crear la cita ──────────────────────────────────────────────────────
    var eventId = crearCita(data);

    return json(out, {
      success: true,
      message: 'Cita agendada correctamente.',
      eventId: eventId
    });

  } catch (err) {
    Logger.log('doPost error: ' + err.message + '\n' + err.stack);
    return json(out, { success: false, error: 'Error interno: ' + err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER HTTP — GET  (solo para verificar que el Web App está activo)
// ─────────────────────────────────────────────────────────────────────────────

function doGet() {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  return json(out, { status: 'OdontoEden Web App activo.', timezone: TIMEZONE });
}

// ─────────────────────────────────────────────────────────────────────────────
// LÓGICA DE CREACIÓN DE CITA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye start/end date en America/Guayaquil y crea el evento en el calendario.
 *
 * ¿Por qué este enfoque de fecha?
 *   new Date(año, mes, día, hora, min) depende de la TZ del proyecto de Apps Script.
 *   Para ser independientes de esa configuración, construimos un string ISO con
 *   el offset fijo de Ecuador (-05:00) y dejamos que Date lo parsee correctamente.
 *   Ecuador continental no aplica horario de verano, así que -05:00 es sempre fijo.
 *
 * @param {Object} data  Datos validados del formulario.
 * @returns {string}     ID del evento creado en Google Calendar.
 */
function crearCita(data) {
  Logger.log(JSON.stringify(data));

  var fullName      = String(data.fullName).trim();
  var email         = String(data.email).trim();
  var phone         = String(data.phone).trim();
  var service       = String(data.service).trim();
  var preferredDate = String(data.preferredDate).trim(); // "YYYY-MM-DD"
  var preferredTime = String(data.preferredTime).trim(); // "HH:MM"
  var comments      = data.comments ? String(data.comments).trim() : '';

  // ── Construir start/end con offset fijo -05:00 (America/Guayaquil, sin DST) ──
  // Formato: "2026-04-25T10:00:00-05:00"  → Date lo interpreta como hora local EC.
  var startDate = new Date(preferredDate + 'T' + preferredTime + ':00-05:00');
  if (isNaN(startDate.getTime())) {
    throw new Error(
      'Fecha/hora inválida recibida: ' + preferredDate + ' ' + preferredTime +
      '. Formato esperado: YYYY-MM-DD y HH:MM.'
    );
  }
  var endDate = new Date(startDate.getTime() + DURATION_MS);

  // ── Verificar que el calendar existe y es accesible ───────────────────────
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    throw new Error(
      'Calendario no encontrado: "' + CALENDAR_ID + '". ' +
      'Verifica que la cuenta que ejecuta el script tenga acceso a ese calendario.'
    );
  }

  // ── Título ────────────────────────────────────────────────────────────────
  var title = CONSULTORIO.nombre + ' - ' + service;

  // ── Descripción ───────────────────────────────────────────────────────────
  var lines = [
    '👤 Paciente   : ' + fullName,
    '📞 Teléfono   : ' + phone,
    '📧 Email      : ' + email,
    '🦷 Servicio   : ' + service
  ];
  if (comments) {
    lines.push('📝 Comentarios: ' + comments);
  }
  lines = lines.concat([
    '',
    '─────────────────────────────────',
    CONSULTORIO.nombre + ' — ' + CONSULTORIO.eslogan,
    '📍 ' + CONSULTORIO.direccion,
    '☎️  Tel: ' + CONSULTORIO.telefono
  ]);
  var description = lines.join('\n');

  // ── Ubicación ─────────────────────────────────────────────────────────────
  var location = CONSULTORIO.nombre + ' — ' + CONSULTORIO.direccion;

  // ── Crear evento ──────────────────────────────────────────────────────────
  // La opción sendInvites: true hace que Google Calendar envíe automáticamente
  // el correo de confirmación al paciente (email agregado como guest).
  var evento = calendar.createEvent(title, startDate, endDate, {
    description: description,
    location:    location,
    guests:      email,    // paciente agregado como invitado
    sendInvites: true      // Google Calendar envía el correo de confirmación
  });

  Logger.log(
    'Evento creado | id=' + evento.getId() +
    ' | paciente=' + fullName +
    ' | email=' + email +
    ' | inicio=' + Utilities.formatDate(startDate, TIMEZONE, 'yyyy-MM-dd HH:mm') +
    ' | servicio=' + service
  );

  // Envío del correo personalizado en try/catch independiente.
  // Si falla, se registra en logs pero NO interrumpe ni revierte la cita ya creada.
  try {
    Logger.log('Intentando enviar correo personalizado a: ' + email);
    enviarCorreoConfirmacion({
      fullName: fullName,
      email:    email,
      service:  service,
      phone:    phone,
      comments: comments
    }, startDate);
    Logger.log('Correo personalizado enviado correctamente a: ' + email);
  } catch (mailErr) {
    Logger.log('Error enviando correo personalizado a ' + email + ': ' + mailErr.message);
  }

  return evento.getId();
}

// ─────────────────────────────────────────────────────────────────────────────
// CORREO PERSONALIZADO DE CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envía un correo de confirmación personalizado al paciente con MailApp.
 * Se llama después de crear el evento en Calendar.
 * Los errores que genere NO deben propagarse al caller — usar try/catch externo.
 *
 * @param {Object} data       Datos del paciente (fullName, email, service, phone, comments).
 * @param {Date}   startDate  Fecha/hora de inicio del evento ya creado.
 */
function enviarCorreoConfirmacion(data, startDate) {
  // Nombres de días y meses en español para America/Guayaquil
  var DIAS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var MESES  = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];

  var diaSemana = Utilities.formatDate(startDate, TIMEZONE, 'EEEE'); // inglés nativo de Apps Script
  var diaNombre = DIAS[parseInt(Utilities.formatDate(startDate, TIMEZONE, 'u'), 10) % 7];
  var diaNum    = Utilities.formatDate(startDate, TIMEZONE, 'd');
  var mesNombre = MESES[parseInt(Utilities.formatDate(startDate, TIMEZONE, 'M'), 10) - 1];
  var anio      = Utilities.formatDate(startDate, TIMEZONE, 'yyyy');
  var hora      = Utilities.formatDate(startDate, TIMEZONE, 'HH:mm');

  var fechaLegible = diaNombre + ', ' + diaNum + ' de ' + mesNombre + ' de ' + anio;

  var asunto = 'Confirmación de cita - OdontoEden';

  // ── Versión texto plano ───────────────────────────────────────────────────
  var body = [
    'Hola ' + data.fullName + ',',
    '',
    'Tu cita ha sido confirmada correctamente en OdontoEden.',
    '',
    'Detalle de tu cita:',
    '  - Tipo de cita : ' + data.service,
    '  - Día          : ' + diaNombre,
    '  - Fecha        : ' + fechaLegible,
    '  - Hora         : ' + hora,
    '',
    'Dirección:',
    '  ' + CONSULTORIO.direccion,
    '',
    'Gracias por escoger a OdontoEden.',
    'Será un placer atenderte.',
    '',
    'Equipo OdontoEden',
    CONSULTORIO.telefono
  ].join('\n');

  // ── Versión HTML ──────────────────────────────────────────────────────────
  var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">'
    + '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">'
    +   '<h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:.5px">🦷 OdontoEden</h1>'
    +   '<p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:14px">' + CONSULTORIO.eslogan + '</p>'
    + '</div>'
    + '<div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none">'
    +   '<p style="font-size:16px;margin:0 0 16px">Hola, <strong>' + data.fullName + '</strong></p>'
    +   '<p style="margin:0 0 20px;color:#374151">Tu cita ha sido <strong>confirmada correctamente</strong>. Aquí tienes el resumen:</p>'
    +   '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    +     '<tr style="background:#f9fafb"><td style="padding:10px 14px;color:#6b7280;width:40%">🦷 Tipo de cita</td><td style="padding:10px 14px;font-weight:600">' + data.service + '</td></tr>'
    +     '<tr><td style="padding:10px 14px;color:#6b7280">📅 Día</td><td style="padding:10px 14px;font-weight:600">' + diaNombre + '</td></tr>'
    +     '<tr style="background:#f9fafb"><td style="padding:10px 14px;color:#6b7280">🗓️ Fecha</td><td style="padding:10px 14px;font-weight:600">' + fechaLegible + '</td></tr>'
    +     '<tr><td style="padding:10px 14px;color:#6b7280">⏰ Hora</td><td style="padding:10px 14px;font-weight:600">' + hora + '</td></tr>'
    +   '</table>'
    +   '<div style="margin:20px 0;padding:14px 16px;background:#f3f4f6;border-radius:8px;font-size:13px;color:#374151">'
    +     '<strong>📍 Dirección</strong><br>' + CONSULTORIO.direccion
    +   '</div>'
    +   '<p style="margin:20px 0 8px;color:#374151">Gracias por escoger a <strong>OdontoEden</strong>.<br>Será un placer atenderte.</p>'
    + '</div>'
    + '<div style="background:#f9fafb;padding:16px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center">'
    +   '<p style="margin:0;font-size:12px;color:#9ca3af">Equipo OdontoEden &nbsp;·&nbsp; ' + CONSULTORIO.telefono + '</p>'
    + '</div>'
    + '</div>';

  MailApp.sendEmail({
    to:       data.email,
    subject:  asunto,
    body:     body,
    htmlBody: htmlBody,
    name:     'OdontoEden'
  });

  Logger.log('Correo personalizado enviado a: ' + data.email);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asigna el contenido JSON al output y lo devuelve.
 * @param {GoogleAppsScript.Content.TextOutput} out
 * @param {Object} obj
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function json(out, obj) {
  out.setContent(JSON.stringify(obj));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST — Ejecutar manualmente desde el IDE para autorizar MailApp
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prueba de correo de confirmación.
 * Selecciona esta función en el menú del IDE y haz clic en ▶ Ejecutar.
 * La primera vez pedirá autorización para enviar correo — acéptala.
 * Luego crea un nuevo deployment para que el Web App use los nuevos permisos.
 *
 * IMPORTANTE: Cambia TEST_EMAIL por tu email real antes de ejecutar.
 */
function testEnviarCorreo() {
  var TEST_EMAIL = 'odontoeden.uio@gmail.com'; // ← cambia por tu email para la prueba
  var startDate  = new Date('2026-04-25T10:00:00-05:00');
  enviarCorreoConfirmacion({
    fullName: 'Paciente Prueba',
    email:    TEST_EMAIL,
    service:  'Limpieza dental',
    phone:    '0999999999',
    comments: ''
  }, startDate);
  Logger.log('testEnviarCorreo: finalizado — revisa ' + TEST_EMAIL);
}


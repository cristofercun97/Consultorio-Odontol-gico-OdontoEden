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

  return evento.getId();
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


/**
 * Netlify Function — agendar-cita.js
 * OdontoEden · Proxy server-side al Google Apps Script Web App
 *
 * Por qué existe este archivo:
 *   Google Apps Script Web Apps no responden cabeceras CORS para peticiones
 *   con Content-Type: application/json (disparan preflight OPTIONS que Apps
 *   Script no maneja). Este proxy recibe el POST del frontend en same-origin
 *   y lo reenvía server-side a Apps Script, donde CORS no aplica.
 *
 * Endpoint disponible en producción:
 *   POST /.netlify/functions/agendar-cita
 *
 * Node 18+ incluye fetch global — sin dependencias externas.
 */

// URL interna del Web App de Apps Script.
// Vive aquí, server-side. El frontend nunca la ve.
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzuYQqAXu0BcTzywd9Yivsg9EwaQxdEW_ivIbMsJ7xc03nzsFLlL7ZtPwp1hEHEm1nn/exec';

// Campos que el frontend debe enviar
const CAMPOS_REQUERIDOS = [
  'fullName',
  'email',
  'phone',
  'service',
  'preferredDate',
  'preferredTime'
];

exports.handler = async function (event) {
  // ── Solo aceptar POST ────────────────────────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return respuesta(405, { success: false, error: 'Método no permitido.' });
  }

  // ── Parseo seguro del body ───────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return respuesta(400, { success: false, error: 'El cuerpo de la petición no es JSON válido.' });
  }

  // ── Validación mínima en el proxy (segunda capa, la principal está en AS) ─
  for (const campo of CAMPOS_REQUERIDOS) {
    if (!payload[campo] || !String(payload[campo]).trim()) {
      return respuesta(400, { success: false, error: 'Campo requerido faltante: ' + campo });
    }
  }

  // ── Llamada server-side a Apps Script (sin restricción CORS) ────────────
  // Usamos Content-Type: text/plain para evitar que Apps Script necesite
  // manejo especial. e.postData.contents sigue siendo el JSON completo.
  let appsScriptResponse;
  try {
    appsScriptResponse = await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body:    JSON.stringify(payload),
      redirect: 'follow'    // sigue redirects; Apps Script /exec no redirige en POST normal
    });
  } catch (networkErr) {
    return respuesta(502, {
      success: false,
      error:   'No se pudo conectar con el servicio de calendario: ' + networkErr.message
    });
  }

  // ── Parseo de la respuesta de Apps Script ────────────────────────────────
  const rawText = await appsScriptResponse.text();

  let result;
  try {
    result = JSON.parse(rawText);
  } catch (_) {
    // Apps Script devolvió algo que no es JSON (HTML de error, redirect a login, etc.)
    console.error('[agendar-cita] Respuesta no-JSON de Apps Script:', rawText.slice(0, 200));
    return respuesta(502, {
      success: false,
      error:   'El servicio de calendario devolvió una respuesta inesperada. Verifica el despliegue del Web App.'
    });
  }

  // Devolver la respuesta de Apps Script tal cual al frontend
  return respuesta(200, result);
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad: construye el objeto de respuesta de Netlify Function
// ─────────────────────────────────────────────────────────────────────────────
function respuesta(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  };
}

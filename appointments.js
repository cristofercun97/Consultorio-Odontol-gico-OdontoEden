// Sistema de Agendamiento de Citas - OdontoEden
// Integración real con Google Calendar vía Google Apps Script Web App.
// El frontend NO abre ninguna URL de Google Calendar manualmente.
// La cita se crea en el calendario del consultorio server-side.

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURACIÓN — endpoint same-origin servido por Netlify Function.
    // El proxy server-side (netlify/functions/agendar-cita.js) llama a
    // Google Apps Script sin restricciones CORS.
    // ─────────────────────────────────────────────────────────────────────────
    const APPOINTMENTS_WEBHOOK_URL = '/.netlify/functions/agendar-cita';

    // ─────────────────────────────────────────────────────────────────────────
    // UTILS UI
    // ─────────────────────────────────────────────────────────────────────────

    function setupDateInputs() {
        const today = new Date().toISOString().split('T')[0];
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.setAttribute('min', today);
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-EC', {
            weekday: 'long',
            year:    'numeric',
            month:   'long',
            day:     'numeric'
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CAMBIO DE MÉTODO (botones del selector de agendamiento)
    // ─────────────────────────────────────────────────────────────────────────

    window.showGoogleCalendar    = () => switchMethod('google-calendar');
    window.showWhatsAppAppointment = () => switchMethod('whatsapp');
    window.showFormAppointment   = () => switchMethod('form');

    function switchMethod(method) {
        document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${method}-btn`)?.classList.add('active');

        document.querySelectorAll('.appointment-method-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${method}-section`)?.classList.add('active');

        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                event:         'appointment_method_change',
                eventCategory: 'Citas',
                eventAction:   'Cambio de Método',
                eventLabel:    method
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORMULARIO PRINCIPAL DE CITAS
    // Envía los datos al Web App de Google Apps Script.
    // NO abre ninguna pestaña de Google Calendar.
    // ─────────────────────────────────────────────────────────────────────────

    const googleForm = document.getElementById('appointment-form-google');
    if (googleForm) {
        googleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitAppointment(this);
        });
    }

    async function submitAppointment(form) {
        const submitBtn      = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn ? submitBtn.innerHTML : null;

        // Mostrar estado de carga en el botón
        if (submitBtn) {
            submitBtn.disabled  = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
        }

        // Construir payload con los nombres de campo reales del formulario HTML
        const fd = new FormData(form);
        const payload = {
            fullName:      (fd.get('name')    || '').trim(),
            email:         (fd.get('email')   || '').trim(),
            phone:         (fd.get('phone')   || '').trim(),
            service:       (fd.get('service') || '').trim(),
            preferredDate: (fd.get('date')    || '').trim(),  // "YYYY-MM-DD"
            preferredTime: (fd.get('time')    || '').trim(),  // "HH:MM"
            comments:      (fd.get('notes')   || '').trim()
        };

        // ── Validación frontend antes de llamar al servidor ───────────────────
        if (!payload.fullName || !payload.email || !payload.phone || !payload.service || !payload.preferredDate || !payload.preferredTime) {
            if (typeof showNotification === 'function') {
                showNotification('❌ Por favor completa todos los campos obligatorios.', 'error');
            }
            if (submitBtn && originalBtnHTML) {
                submitBtn.disabled  = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
            return;
        }

        // ── fetch al Web App ──────────────────────────────────────────────────
        try {
            const response = await fetch(APPOINTMENTS_WEBHOOK_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            let result = null;
            try {
                result = await response.json();
            } catch (e) {
                throw new Error('Respuesta inválida del servidor (no es JSON).');
            }

            if (!response.ok) {
                throw new Error('Error HTTP: ' + response.status);
            }

            // Forma del response exitoso:
            //   { "success": true,  "message": "Cita agendada correctamente.", "eventId": "abc123" }
            // Forma del response con error:
            //   { "success": false, "error": "Campo requerido faltante: email" }

            if (result.success) {
                if (typeof showNotification === 'function') {
                    showNotification(
                        '✅ ¡Cita agendada! Revisa tu correo — recibirás la confirmación con los detalles.',
                        'success'
                    );
                }
                console.log('✅ Evento creado en Google Calendar:', result.eventId);
                if (typeof window.dataLayer !== 'undefined') {
                    window.dataLayer.push({
                        event:           'appointment_created',
                        eventCategory:   'Citas',
                        eventAction:     'Cita Creada - Google Calendar Real',
                        eventLabel:      payload.service,
                        appointmentDate: payload.preferredDate
                    });
                }
                form.reset();
            } else {
                const msg = result.error || result.message || 'Ocurrió un error al agendar la cita.';
                if (typeof showNotification === 'function') {
                    showNotification(
                        `❌ ${msg} Por favor intenta de nuevo o contáctanos por WhatsApp.`,
                        'error'
                    );
                }
                console.error('Error del Web App:', result);
            }

        } catch (err) {
            // Falla de red o el Web App no está disponible
            console.error('Error de red al agendar cita:', err);
            if (typeof showNotification === 'function') {
                showNotification(
                    '❌ No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
                    'error'
                );
            }
        } finally {
            if (submitBtn && originalBtnHTML) {
                submitBtn.disabled  = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORMULARIO SIMPLE (método "Formulario")
    // Canal secundario de contacto; no requiere hora exacta.
    // Sigue siendo un formulario local + opción WhatsApp.
    // ─────────────────────────────────────────────────────────────────────────

    const simpleForm = document.getElementById('appointment-form-simple');
    if (simpleForm) {
        simpleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const fd = new FormData(this);
            const data = {
                name:    fd.get('name')    || '',
                email:   fd.get('email')   || '',
                phone:   fd.get('phone')   || '',
                service: fd.get('service') || '',
                date:    fd.get('date')    || '',
                message: fd.get('message') || ''
            };

            if (typeof window.dataLayer !== 'undefined') {
                window.dataLayer.push({
                    event:         'appointment_request',
                    eventCategory: 'Citas',
                    eventAction:   'Solicitud de Cita - Formulario',
                    eventLabel:    data.service
                });
            }

            if (typeof showNotification === 'function') {
                showNotification(
                    '✅ ¡Solicitud enviada! Te contactaremos pronto para confirmar tu cita.',
                    'success'
                );
            }

            this.reset();

            // Ofrecer confirmación por WhatsApp (canal secundario, no Google Calendar)
            setTimeout(() => {
                const msg = `Hola OdontoEden, soy ${data.name}. Me gustaría agendar una cita para ${data.service} el día ${formatDate(data.date)}. Mi teléfono es ${data.phone}.`;
                if (confirm('¿Deseas enviar esta solicitud también por WhatsApp?')) {
                    window.open(`https://wa.me/+593958882566?text=${encodeURIComponent(msg)}`, '_blank');
                }
            }, 1500);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        setupDateInputs();
        console.log('✅ Sistema de citas inicializado — Google Apps Script backend');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TEST INTERNO — solo para validar el flujo en producción desde DevTools.
    // Uso: abrir DevTools (F12) → Console → ejecutar: testAppointmentFlow()
    // NO hay botón en UI. No afecta el formulario real.
    // ─────────────────────────────────────────────────────────────────────────

    window.testAppointmentFlow = async function () {
        console.log('🧪 Iniciando test interno de citas...');

        const payload = {
            fullName:      'Test Usuario',
            email:         'cristofercun.webdev@gmail.com',
            phone:         '613681611',
            service:       'Limpieza Dental',
            preferredDate: '2026-04-18',
            preferredTime: '10:00',
            comments:      'Test automático desde frontend'
        };

        try {
            const response = await fetch(APPOINTMENTS_WEBHOOK_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            console.log('📡 Response status:', response.status);

            let result;
            try {
                result = await response.json();
            } catch (err) {
                throw new Error('❌ La respuesta no es JSON válido');
            }

            console.log('📦 Response body:', result);

            if (result.success) {
                console.log('✅ TEST OK - Evento creado:', result.eventId);
                if (typeof showNotification === 'function') {
                    showNotification(
                        '🧪 Test exitoso: cita creada correctamente en Google Calendar',
                        'success'
                    );
                }
            } else {
                console.error('❌ TEST FALLÓ:', result);
                if (typeof showNotification === 'function') {
                    showNotification(
                        '❌ Test fallido: ' + (result.error || result.message),
                        'error'
                    );
                }
            }

        } catch (error) {
            console.error('🚨 ERROR EN TEST:', error);
            if (typeof showNotification === 'function') {
                showNotification('🚨 Error en test: ' + error.message, 'error');
            }
        }
    };

}());

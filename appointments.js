// Sistema de Agendamiento de Citas - OdontoEden
// Integración real con Google Calendar vía Google Apps Script Web App.
// El frontend NO abre ninguna URL de Google Calendar manualmente.
// La cita se crea en el calendario del consultorio server-side.

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURACIÓN — URL del Web App de Google Apps Script.
    // El fetch usa Content-Type: text/plain para evitar el preflight CORS
    // (simple request). Apps Script parsea el body como JSON igualmente.
    // ─────────────────────────────────────────────────────────────────────────
    const APPOINTMENTS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxw7MelUvMzocCgxyD8RWiH0pyAFCKWt2MRLd2t_CZh0Esctk0uSAawV9TDz85bTqBf/exec';

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
        // Content-Type: text/plain convierte esto en una "simple request" CORS.
        // El navegador NO lanza preflight OPTIONS. Apps Script recibe el body
        // en e.postData.contents y lo parsea con JSON.parse() normalmente.
        try {
            const response = await fetch(APPOINTMENTS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body:   JSON.stringify(payload)
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
                showAppointmentToast(payload);
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

    // ─────────────────────────────────────────────────────────────────────────
    // TOAST DE CONFIRMACIÓN DE CITA
    // Aparece cuando el Web App confirma éxito. Muestra los detalles
    // del turno reservado y se cierra solo a los 8 segundos.
    // ─────────────────────────────────────────────────────────────────────────

    function showAppointmentToast(data) {
        // Eliminar toast anterior si existe
        const prev = document.getElementById('appointment-toast');
        if (prev) prev.remove();

        // Formatear fecha legible
        const dateLabel = data.preferredDate
            ? new Date(data.preferredDate + 'T00:00:00').toLocaleDateString('es-EC', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })
            : data.preferredDate;

        const toast = document.createElement('div');
        toast.id = 'appointment-toast';
        toast.innerHTML = `
            <div class="apt-toast-header">
                <span class="apt-toast-icon">&#x1F9B7;</span>
                <span class="apt-toast-title">¡Cita confirmada!</span>
                <button class="apt-toast-close" aria-label="Cerrar">&times;</button>
            </div>
            <div class="apt-toast-body">
                <p class="apt-toast-greeting">Hola, <strong>${data.fullName}</strong></p>
                <ul class="apt-toast-details">
                    <li><span class="apt-td-label">&#x1F9B7; Servicio</span><span class="apt-td-value">${data.service}</span></li>
                    <li><span class="apt-td-label">&#x1F4C5; Fecha</span><span class="apt-td-value">${dateLabel}</span></li>
                    <li><span class="apt-td-label">&#x23F0; Hora</span><span class="apt-td-value">${data.preferredTime} (Ecuador)</span></li>
                    <li><span class="apt-td-label">&#x1F4E7; Correo</span><span class="apt-td-value">${data.email}</span></li>
                </ul>
                <p class="apt-toast-note">Revisa tu correo — recibirás la invitación de Google Calendar.</p>
            </div>
            <div class="apt-toast-bar"></div>
        `;

        // Inyectar estilos una sola vez
        if (!document.getElementById('apt-toast-styles')) {
            const s = document.createElement('style');
            s.id = 'apt-toast-styles';
            s.textContent = `
                #appointment-toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 340px;
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 12px 48px rgba(0,0,0,.18);
                    overflow: hidden;
                    z-index: 99999;
                    font-family: inherit;
                    transform: translateY(120%);
                    opacity: 0;
                    transition: transform .45s cubic-bezier(.34,1.56,.64,1), opacity .35s ease;
                }
                #appointment-toast.apt-show {
                    transform: translateY(0);
                    opacity: 1;
                }
                .apt-toast-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    padding: 14px 16px;
                }
                .apt-toast-icon { font-size: 22px; }
                .apt-toast-title {
                    flex: 1;
                    font-weight: 700;
                    font-size: 16px;
                    letter-spacing: .3px;
                }
                .apt-toast-close {
                    background: rgba(255,255,255,.2);
                    border: none;
                    color: #fff;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background .2s;
                }
                .apt-toast-close:hover { background: rgba(255,255,255,.35); }
                .apt-toast-body {
                    padding: 16px 18px 12px;
                }
                .apt-toast-greeting {
                    margin: 0 0 12px;
                    font-size: 14px;
                    color: #374151;
                }
                .apt-toast-details {
                    list-style: none;
                    margin: 0 0 12px;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }
                .apt-toast-details li {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    border-bottom: 1px solid #f3f4f6;
                    padding-bottom: 6px;
                }
                .apt-toast-details li:last-child { border-bottom: none; padding-bottom: 0; }
                .apt-td-label { color: #6b7280; font-weight: 500; }
                .apt-td-value { color: #111827; font-weight: 600; text-align: right; max-width: 180px; }
                .apt-toast-note {
                    margin: 0;
                    font-size: 12px;
                    color: #6b7280;
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 8px 10px;
                }
                .apt-toast-bar {
                    height: 4px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transform-origin: left;
                    animation: aptProgress 8s linear forwards;
                }
                @keyframes aptProgress {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0); }
                }
                @media (max-width: 480px) {
                    #appointment-toast {
                        right: 12px;
                        left: 12px;
                        width: auto;
                        bottom: 16px;
                    }
                }
            `;
            document.head.appendChild(s);
        }

        document.body.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('apt-show'));
        });

        // Cerrar al pulsar X
        toast.querySelector('.apt-toast-close').addEventListener('click', () => closeToast(toast));

        // Cerrar automático a los 8 segundos
        const timer = setTimeout(() => closeToast(toast), 8000);

        function closeToast(el) {
            clearTimeout(timer);
            el.classList.remove('apt-show');
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
        }
    }

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
                headers: { 'Content-Type': 'text/plain' },
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

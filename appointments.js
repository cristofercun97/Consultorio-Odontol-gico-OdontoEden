// Sistema de Agendamiento de Citas - OdontoEden
// Google Calendar Integration & Appointment Management

(function() {
    'use strict';

    // Configurar fecha mínima (hoy)
    function setupDateInputs() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const today = new Date().toISOString().split('T')[0];
        
        dateInputs.forEach(input => {
            input.setAttribute('min', today);
        });
    }

    // Cambiar entre métodos de agendamiento
    window.showGoogleCalendar = function() {
        switchMethod('google-calendar');
    };

    window.showWhatsAppAppointment = function() {
        switchMethod('whatsapp');
    };

    window.showFormAppointment = function() {
        switchMethod('form');
    };

    function switchMethod(method) {
        // Actualizar botones
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${method}-btn`)?.classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.appointment-method-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${method}-section`)?.classList.add('active');

        // GTM Event
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                'event': 'appointment_method_change',
                'eventCategory': 'Citas',
                'eventAction': 'Cambio de Método',
                'eventLabel': method
            });
        }
    }

    // Formulario de Google Calendar
    const googleForm = document.getElementById('appointment-form-google');
    if (googleForm) {
        googleForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                date: formData.get('date'),
                time: formData.get('time'),
                notes: formData.get('notes') || ''
            };

            // Crear evento de Google Calendar
            createGoogleCalendarEvent(data);
        });
    }

    // Crear evento en Google Calendar
    function createGoogleCalendarEvent(data) {
        // Combinar fecha y hora
        const dateTime = `${data.date}T${data.time}:00`;
        const startDate = new Date(dateTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora después

        // Formatear fechas para Google Calendar
        const startISO = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
        const endISO = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

        // Crear título y descripción
        const title = `OdontoEden - ${data.service}`;
        const description = `
Paciente: ${data.name}
Teléfono: ${data.phone}
Email: ${data.email}
Servicio: ${data.service}
${data.notes ? `\nNotas: ${data.notes}` : ''}

---
OdontoEden - Tu sonrisa es nuestra pasión
Av. Eloy Alfaro y Alemania, Edf. Pirámide 1
Teléfono: 0958882566
        `.trim();

        const location = 'OdontoEden - Av. Eloy Alfaro y Alemania, Edf. Pirámide 1, Quito';

        // Crear URL de Google Calendar
        const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
        googleCalendarUrl.searchParams.append('action', 'TEMPLATE');
        googleCalendarUrl.searchParams.append('text', title);
        googleCalendarUrl.searchParams.append('dates', `${startISO}/${endISO}`);
        googleCalendarUrl.searchParams.append('details', description);
        googleCalendarUrl.searchParams.append('location', location);
        googleCalendarUrl.searchParams.append('ctz', 'America/Guayaquil');

        // Guardar cita localmente
        saveAppointment({
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            status: 'pending',
            method: 'google_calendar'
        });

        // Enviar evento GTM
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                'event': 'appointment_created',
                'eventCategory': 'Citas',
                'eventAction': 'Cita Creada - Google Calendar',
                'eventLabel': data.service,
                'appointmentDate': data.date
            });
        }

        // Mostrar notificación y abrir Google Calendar
        if (typeof showNotification === 'function') {
            showNotification('✅ Abriendo Google Calendar. Guarda el evento para confirmar tu cita.', 'success');
        }

        // Abrir en nueva pestaña
        window.open(googleCalendarUrl.toString(), '_blank');

        // Limpiar formulario
        googleForm.reset();

        // Enviar notificación por WhatsApp (opcional)
        setTimeout(() => {
            const confirmWhatsApp = confirm('¿Deseas confirmar tu cita también por WhatsApp?');
            if (confirmWhatsApp) {
                sendWhatsAppAppointment(data);
            }
        }, 2000);
    }

    // Formulario simple de citas
    const simpleForm = document.getElementById('appointment-form-simple');
    if (simpleForm) {
        simpleForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                date: formData.get('date'),
                message: formData.get('message') || ''
            };

            // Guardar cita
            saveAppointment({
                ...data,
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: 'pending',
                method: 'form'
            });

            // Enviar evento GTM
            if (typeof window.dataLayer !== 'undefined') {
                window.dataLayer.push({
                    'event': 'appointment_request',
                    'eventCategory': 'Citas',
                    'eventAction': 'Solicitud de Cita - Formulario',
                    'eventLabel': data.service
                });
            }

            // Mostrar notificación
            if (typeof showNotification === 'function') {
                showNotification('✅ ¡Solicitud enviada! Te contactaremos pronto para confirmar tu cita.', 'success');
            }

            // Limpiar formulario
            this.reset();

            // Opcional: Enviar por WhatsApp
            setTimeout(() => {
                const whatsappMessage = `Hola OdontoEden, soy ${data.name}. Me gustaría agendar una cita para ${data.service} el día ${formatDate(data.date)}. Mi teléfono es ${data.phone}.`;
                const whatsappURL = `https://wa.me/+593958882566?text=${encodeURIComponent(whatsappMessage)}`;
                
                const sendWhatsApp = confirm('¿Deseas enviar esta solicitud también por WhatsApp?');
                if (sendWhatsApp) {
                    window.open(whatsappURL, '_blank');
                }
            }, 1500);
        });
    }

    // Enviar cita por WhatsApp
    function sendWhatsAppAppointment(data) {
        const message = `Hola OdontoEden, soy ${data.name}.

📅 Quiero confirmar mi cita:
- Servicio: ${data.service}
- Fecha: ${formatDate(data.date)}
- Hora: ${data.time}
- Teléfono: ${data.phone}
- Email: ${data.email}
${data.notes ? `\nNotas: ${data.notes}` : ''}

¡Gracias!`;

        const whatsappURL = `https://wa.me/+593958882566?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }

    // Guardar cita en LocalStorage
    function saveAppointment(appointment) {
        try {
            const appointments = JSON.parse(localStorage.getItem('odontoeden_appointments') || '[]');
            appointments.push(appointment);
            localStorage.setItem('odontoeden_appointments', JSON.stringify(appointments));
            console.log('✅ Cita guardada:', appointment);
        } catch (error) {
            console.error('Error guardando cita:', error);
        }
    }

    // Formatear fecha
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-EC', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', function() {
        setupDateInputs();
        console.log('✅ Sistema de citas inicializado');
    });

})();

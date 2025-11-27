// Google Tag Manager - Event Tracking
// OdontoEden - Configuración de eventos personalizados

(function() {
    'use strict';

    // Función principal para enviar eventos a GTM
    function sendGTMEvent(eventData) {
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push(eventData);
            console.log('GTM Event:', eventData);
        }
    }

    // 1. TRACKING DE CLICKS EN ELEMENTOS CON DATA-GTM
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-gtm-event="click"]');
        
        if (target) {
            const eventData = {
                'event': 'custom_click',
                'eventCategory': target.getAttribute('data-gtm-category') || 'General',
                'eventAction': target.getAttribute('data-gtm-action') || 'Click',
                'eventLabel': target.getAttribute('data-gtm-label') || 'Unknown',
                'eventValue': target.getAttribute('data-gtm-value') || undefined
            };
            
            sendGTMEvent(eventData);
        }
    });

    // 2. TRACKING DE ENVÍO DE FORMULARIOS
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const eventData = {
                'event': 'form_submit',
                'eventCategory': 'Formulario',
                'eventAction': 'Envío Formulario Contacto',
                'eventLabel': 'Formulario de contacto',
                'formName': 'contact-form'
            };
            
            sendGTMEvent(eventData);
        });
    }

    // 3. SCROLL DEPTH TRACKING
    let scrollDepthTracked = {
        '25': false,
        '50': false,
        '75': false,
        '100': false
    };

    function trackScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercentage = Math.round((scrollTop + windowHeight) / documentHeight * 100);

        // Trackear en intervalos de 25%, 50%, 75%, 100%
        ['25', '50', '75', '100'].forEach(function(depth) {
            const depthNum = parseInt(depth);
            if (scrollPercentage >= depthNum && !scrollDepthTracked[depth]) {
                scrollDepthTracked[depth] = true;
                
                sendGTMEvent({
                    'event': 'scroll_depth',
                    'eventCategory': 'Engagement',
                    'eventAction': 'Scroll Depth',
                    'eventLabel': depth + '%',
                    'scrollDepth': depthNum
                });
            }
        });
    }

    // Throttle para mejorar el rendimiento
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(trackScrollDepth, 100);
    });

    // 4. TRACKING DE CLICKS EN SERVICIOS (adicional personalizado)
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(function(card, index) {
        card.addEventListener('click', function() {
            const serviceName = this.querySelector('h3')?.textContent || 'Servicio ' + (index + 1);
            
            sendGTMEvent({
                'event': 'service_click',
                'eventCategory': 'Servicios',
                'eventAction': 'Click en Tarjeta de Servicio',
                'eventLabel': serviceName,
                'servicePosition': index + 1
            });
        });
    });

    // 5. TRACKING DE CLICKS EN BOTONES WHATSAPP (adicional)
    const whatsappButtons = document.querySelectorAll('[href*="wa.me"], [href*="whatsapp"], .whatsapp-float');
    whatsappButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const buttonLocation = this.classList.contains('whatsapp-float') ? 'Flotante' : 'Hero/CTA';
            
            sendGTMEvent({
                'event': 'whatsapp_click',
                'eventCategory': 'WhatsApp',
                'eventAction': 'Click WhatsApp',
                'eventLabel': buttonLocation,
                'contactMethod': 'WhatsApp'
            });
        });
    });

    // 6. TRACKING DE NAVEGACIÓN (clicks en menú)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const sectionName = this.textContent.trim();
            const sectionHref = this.getAttribute('href');
            
            sendGTMEvent({
                'event': 'navigation_click',
                'eventCategory': 'Navegación',
                'eventAction': 'Click Menú',
                'eventLabel': sectionName,
                'destination': sectionHref
            });
        });
    });

    // 7. TRACKING DE TIEMPO EN PÁGINA
    let pageLoadTime = new Date().getTime();
    
    // Enviar evento después de 30 segundos
    setTimeout(function() {
        sendGTMEvent({
            'event': 'time_on_page',
            'eventCategory': 'Engagement',
            'eventAction': 'Tiempo en página',
            'eventLabel': '30 segundos',
            'timeValue': 30
        });
    }, 30000);

    // Enviar evento después de 60 segundos
    setTimeout(function() {
        sendGTMEvent({
            'event': 'time_on_page',
            'eventCategory': 'Engagement',
            'eventAction': 'Tiempo en página',
            'eventLabel': '60 segundos',
            'timeValue': 60
        });
    }, 60000);

    // 8. TRACKING DE CLICKS EN GALERÍA
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(function(item, index) {
        item.addEventListener('click', function() {
            const imageTitle = this.querySelector('.gallery-content h3')?.textContent || 'Imagen ' + (index + 1);
            
            sendGTMEvent({
                'event': 'gallery_click',
                'eventCategory': 'Galería',
                'eventAction': 'Click Imagen',
                'eventLabel': imageTitle,
                'imagePosition': index + 1
            });
        });
    });

    // 9. TRACKING DE CLICKS EN TELÉFONO Y EMAIL
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            sendGTMEvent({
                'event': 'contact_click',
                'eventCategory': 'Contacto',
                'eventAction': 'Click Teléfono',
                'eventLabel': this.getAttribute('href'),
                'contactMethod': 'Teléfono'
            });
        });
    });

    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            sendGTMEvent({
                'event': 'contact_click',
                'eventCategory': 'Contacto',
                'eventAction': 'Click Email',
                'eventLabel': this.getAttribute('href'),
                'contactMethod': 'Email'
            });
        });
    });

    // 10. TRACKING DE SALIDA (Outbound links)
    const outboundLinks = document.querySelectorAll('a[target="_blank"]:not([href*="wa.me"])');
    outboundLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            sendGTMEvent({
                'event': 'outbound_link',
                'eventCategory': 'Outbound Links',
                'eventAction': 'Click Link Externo',
                'eventLabel': this.getAttribute('href'),
                'linkDestination': this.hostname
            });
        });
    });

    // Mensaje de inicialización
    console.log('✅ GTM Event Tracking iniciado correctamente');
    
    // Enviar evento de página vista
    sendGTMEvent({
        'event': 'page_view',
        'pageTitle': document.title,
        'pageUrl': window.location.href,
        'pagePath': window.location.pathname
    });

})();

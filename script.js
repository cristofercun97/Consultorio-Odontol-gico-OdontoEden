// Navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.getElementById('header');
    const body = document.body;
    
    // Toggle del menú móvil mejorado
    navToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Función para abrir el menú
    function openMenu() {
        navMenu.classList.add('active');
        navToggle.classList.add('active');
        body.classList.add('menu-open');
    }
    
    // Función para cerrar el menú
    function closeMenu() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        body.classList.remove('menu-open');
    }
    
    // Cerrar menú al hacer click en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            closeMenu();
        });
    });
    
    // Cerrar menú al hacer click fuera (solo en móvil)
    document.addEventListener('click', function(e) {
        const isMenuOpen = navMenu.classList.contains('active');
        const clickedInsideMenu = navMenu.contains(e.target);
        const clickedToggle = navToggle.contains(e.target);
        
        if (isMenuOpen && !clickedInsideMenu && !clickedToggle) {
            closeMenu();
        }
    });
    
    // Cerrar menú con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Cerrar menú al cambiar de orientación o redimensionar
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Navegación activa según la sección
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    // Header con efecto de scroll
    function handleHeaderScroll() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#ffffff';
            header.style.backdropFilter = 'none';
        }
    }
    
    // Event listeners para scroll
    window.addEventListener('scroll', function() {
        updateActiveNavLink();
        handleHeaderScroll();
    });
    
    // Animaciones al hacer scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.service-card, .gallery-item, .contact-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Inicializar animaciones
    function initAnimations() {
        const elements = document.querySelectorAll('.service-card, .gallery-item, .contact-item');
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease';
        });
    }
    
    // Smooth scroll para navegación
    function initSmoothScroll() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Manejo del formulario de contacto con EmailJS
    function handleContactForm() {
        const contactForm = document.querySelector('.contact-form');
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        const formMessage = document.getElementById('form-message');
        
        // Inicializar EmailJS
        // IMPORTANTE: Reemplaza estos valores con los tuyos de EmailJS
        const EMAILJS_CONFIG = {
            publicKey: 'TU_PUBLIC_KEY',  // Obtener de EmailJS Dashboard
            serviceID: 'TU_SERVICE_ID',   // Ej: 'service_abc123'
            templateID: 'TU_TEMPLATE_ID'  // Ej: 'template_xyz789'
        };
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Deshabilitar botón
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
            formMessage.style.display = 'none';
            
            // Obtener datos del formulario
            const formData = {
                user_name: contactForm.querySelector('[name="user_name"]').value,
                user_email: contactForm.querySelector('[name="user_email"]').value,
                user_phone: contactForm.querySelector('[name="user_phone"]').value,
                message: contactForm.querySelector('[name="message"]').value,
                date: new Date().toLocaleString('es-EC', { 
                    timeZone: 'America/Guayaquil',
                    dateStyle: 'full',
                    timeStyle: 'short'
                })
            };
            
            // MÉTODO 1: EmailJS (Recomendado - Requiere configuración)
            if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== 'TU_PUBLIC_KEY') {
                emailjs.init(EMAILJS_CONFIG.publicKey);
                
                emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, formData)
                    .then(function(response) {
                        console.log('SUCCESS!', response.status, response.text);
                        showSuccess();
                        saveToLocalStorage(formData);
                        contactForm.reset();
                    }, function(error) {
                        console.log('FAILED...', error);
                        showError('Hubo un error al enviar el mensaje. Por favor, intenta nuevamente o contáctanos por WhatsApp.');
                    })
                    .finally(function() {
                        resetButton();
                    });
            } 
            // MÉTODO 2: Guardar localmente (Temporal - No requiere configuración)
            else {
                // Simular envío
                setTimeout(function() {
                    saveToLocalStorage(formData);
                    showSuccess();
                    contactForm.reset();
                    resetButton();
                    
                    // Opcional: Redirigir a WhatsApp
                    setTimeout(function() {
                        const whatsappMessage = `Hola OdontoEden, mi nombre es ${formData.user_name}. ${formData.message}`;
                        const whatsappURL = `https://wa.me/+593958882566?text=${encodeURIComponent(whatsappMessage)}`;
                        window.open(whatsappURL, '_blank');
                    }, 2000);
                }, 1000);
            }
        });
        
        function showSuccess() {
            formMessage.textContent = '✅ ¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.';
            formMessage.className = 'form-message success';
            formMessage.style.display = 'block';
            
            // Mostrar notificación flotante
            showNotification('¡Formulario enviado correctamente! Gracias por contactarnos. Te responderemos pronto. 📧', 'success');
        }
        
        function showError(message) {
            formMessage.textContent = '❌ ' + message;
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
        }
        
        function resetButton() {
            submitBtn.disabled = false;
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
        }
        
        // Guardar en LocalStorage para respaldo
        function saveToLocalStorage(data) {
            try {
                const contacts = JSON.parse(localStorage.getItem('odontoeden_contacts') || '[]');
                contacts.push({
                    ...data,
                    id: Date.now(),
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('odontoeden_contacts', JSON.stringify(contacts));
                console.log('✅ Contacto guardado localmente:', data);
            } catch (error) {
                console.error('Error guardando en localStorage:', error);
            }
        }
    }
    
    // Función para mostrar notificaciones mejorada
    function showNotification(message, type = 'info') {
        // Remover notificación anterior si existe
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Iconos según el tipo
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icons[type] || icons.info}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            min-width: 320px;
            max-width: 450px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            transform: translateX(500px);
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            overflow: hidden;
            animation: slideInRight 0.4s ease forwards;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Barra de progreso
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            background: rgba(255, 255, 255, 0.5);
            width: 100%;
            transform-origin: left;
            animation: progressBar 5s linear forwards;
        `;
        
        // Ocultar notificación después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(500px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }, 5000);
        
        // Agregar estilos CSS dinámicos si no existen
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(500px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes progressBar {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    gap: 15px;
                }
                
                .notification-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .notification-message {
                    flex: 1;
                    font-weight: 500;
                    line-height: 1.5;
                }
                
                .notification-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }
                
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                @media (max-width: 768px) {
                    .notification {
                        right: 10px;
                        left: 10px;
                        min-width: auto !important;
                        max-width: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Animación de contadores en la sección "Sobre Nosotros"
    function animateCounters() {
        const counters = document.querySelectorAll('.stat h3');
        let animated = false;
        
        function startCounting() {
            if (animated) return;
            
            counters.forEach(counter => {
                const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
                const duration = 2000; // 2 segundos
                const step = target / (duration / 16); // 60 FPS
                let current = 0;
                
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    
                    const suffix = counter.textContent.includes('+') ? '+' : '';
                    counter.textContent = Math.floor(current) + suffix;
                }, 16);
            });
            
            animated = true;
        }
        
        // Detectar cuando la sección está visible
        const aboutSection = document.getElementById('nosotros');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startCounting();
                }
            });
        }, { threshold: 0.5 });
        
        if (aboutSection) {
            observer.observe(aboutSection);
        }
    }
    
    // Efecto parallax sutil para el hero
    function initParallax() {
        const heroIcon = document.querySelector('.hero-icon');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (heroIcon) {
                heroIcon.style.transform = `translateY(${rate}px)`;
            }
        });
    }
    
    // WhatsApp Button Animation
    function initWhatsAppButton() {
        const whatsappButton = document.getElementById('whatsapp-button');
        
        if (!whatsappButton) return;
        
        // Mostrar el botón con animación después de 2 segundos
        setTimeout(() => {
            whatsappButton.style.opacity = '0';
            whatsappButton.style.display = 'flex';
            
            // Animación de entrada
            setTimeout(() => {
                whatsappButton.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                whatsappButton.style.opacity = '1';
                whatsappButton.style.transform = 'scale(1)';
            }, 100);
        }, 2000);
        
        // Efecto de bounce al hacer hover
        whatsappButton.addEventListener('mouseenter', function() {
            this.style.animation = 'whatsapp-bounce 0.6s ease';
        });
        
        whatsappButton.addEventListener('animationend', function() {
            this.style.animation = '';
        });
        
        // Analytics tracking (opcional)
        whatsappButton.addEventListener('click', function() {
            console.log('WhatsApp button clicked');
            // Aquí puedes agregar tracking de Google Analytics si lo necesitas
            // gtag('event', 'click', { 'event_category': 'WhatsApp', 'event_label': 'Contact Button' });
        });
    }
    
    // Gallery functionality
    function initGallery() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('.gallery-image');
                const title = this.querySelector('.gallery-content h3').textContent;
                const description = this.querySelector('.gallery-content p').textContent;
                
                // Crear modal para mostrar imagen en grande
                createImageModal(img.src, title, description);
            });
            
            // Agregar efecto de entrada animada
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });
            
            // Inicializar elementos ocultos
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = 'all 0.6s ease';
            
            observer.observe(item);
        });
    }
    
    // Crear modal para imágenes
    function createImageModal(imageSrc, title, description) {
        // Evitar múltiples modales
        const existingModal = document.querySelector('.image-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <img src="${imageSrc}" alt="${title}" class="modal-image">
                    <div class="modal-info">
                        <h3>${title}</h3>
                        <p>${description}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar modal
        const closeBtn = modal.querySelector('.modal-close');
        const backdrop = modal.querySelector('.modal-backdrop');
        
        closeBtn.addEventListener('click', () => modal.remove());
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) modal.remove();
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    
    // Inicializar todas las funciones
    initAnimations();
    initSmoothScroll();
    handleContactForm();
    animateCounters();
    initParallax();
    initWhatsAppButton();
    initGallery();
    
    // Listener para animaciones en scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Ejecutar animaciones una vez al cargar
    animateOnScroll();
    
    // Mensaje de bienvenida en consola
    console.log('🦷 OdontoEden - Landing Page cargada correctamente');
    console.log('💻 Sitio web responsive desarrollado con HTML, CSS y JavaScript');
    console.log('📱 Botón de WhatsApp integrado exitosamente');
});

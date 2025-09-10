// Navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.getElementById('header');
    
    // Toggle del menú móvil
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Cerrar menú al hacer click en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
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
    
    // Manejo del formulario de contacto
    function handleContactForm() {
        const contactForm = document.querySelector('.contact-form');
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aquí puedes agregar la lógica para enviar el formulario
            // Por ejemplo, usando fetch() para enviar a un servidor
            
            // Simulación de envío exitoso
            showNotification('¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.', 'success');
            
            // Limpiar formulario
            contactForm.reset();
        });
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Ocultar notificación después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
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

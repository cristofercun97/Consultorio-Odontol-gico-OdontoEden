// Integración con Google Reviews para OdontoEden

// Configuración para Google Reviews
const GOOGLE_PLACES_CONFIG = {
    // Datos reales del negocio OdontoEden
    BUSINESS_URL: 'https://share.google/1Z2exGsjDHP1JIvTL', // URL directa del negocio
    PLACE_ID: 'TU_PLACE_ID_DE_GOOGLE', // Obtener de Google My Business si necesitas API
    API_KEY: 'TU_API_KEY_DE_GOOGLE', // Clave API de Google Places
    BUSINESS_NAME: 'OdontoEden'
};

// Función para cargar reseñas de Google (Método 1: API oficial)
async function loadGoogleReviews() {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACES_CONFIG.PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${GOOGLE_PLACES_CONFIG.API_KEY}`);
        const data = await response.json();
        
        if (data.result) {
            displayGoogleReviews(data.result);
        }
    } catch (error) {
        console.error('Error cargando reseñas de Google:', error);
        fallbackToStaticReviews();
    }
}

// Función para mostrar las reseñas cargadas
function displayGoogleReviews(placeData) {
    const reviewsContainer = document.querySelector('.testimonials-grid');
    const overallRating = document.querySelector('.rating-text');
    const reviewCount = document.querySelector('.review-count');
    
    // Actualizar estadísticas generales
    if (overallRating) {
        overallRating.textContent = `${placeData.rating} de 5 estrellas`;
    }
    
    if (reviewCount) {
        reviewCount.textContent = `(${placeData.user_ratings_total} reseñas)`;
    }
    
    // Limpiar testimonios existentes si queremos usar solo los de Google
    // reviewsContainer.innerHTML = '';
    
    // Agregar reseñas de Google
    if (placeData.reviews) {
        placeData.reviews.slice(0, 3).forEach(review => {
            const testimonialCard = createTestimonialCard(review);
            reviewsContainer.appendChild(testimonialCard);
        });
    }
}

// Función para crear una tarjeta de testimonio desde datos de Google
function createTestimonialCard(review) {
    const card = document.createElement('div');
    card.className = 'testimonial-card google-review';
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    card.innerHTML = `
        <div class="testimonial-content">
            <div class="stars google-stars">
                ${Array.from({length: review.rating}, () => '<i class="fas fa-star"></i>').join('')}
                ${Array.from({length: 5 - review.rating}, () => '<i class="far fa-star"></i>').join('')}
            </div>
            <p>"${review.text}"</p>
            <div class="testimonial-author">
                <div class="author-info">
                    <h4>${review.author_name}</h4>
                    <span>Google Reviews • ${formatReviewDate(review.time)}</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Función para formatear fecha de reseña
function formatReviewDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
    });
}

// Función de respaldo con reseñas estáticas
function fallbackToStaticReviews() {
    console.log('Usando reseñas estáticas como respaldo');
    // Las reseñas estáticas ya están en el HTML
}

// Método alternativo: Iframe de Google Reviews (más simple)
function loadGoogleReviewsIframe() {
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'google-reviews-iframe';
    iframeContainer.innerHTML = `
        <iframe 
            src="https://www.google.com/maps/embed/v1/place?key=${GOOGLE_PLACES_CONFIG.API_KEY}&q=${encodeURIComponent(GOOGLE_PLACES_CONFIG.BUSINESS_NAME)}&zoom=15"
            width="100%" 
            height="300" 
            style="border:0; border-radius: 15px; margin-top: 1rem;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>
    `;
    
    document.querySelector('.google-reviews').appendChild(iframeContainer);
}

// Widget de Google Reviews (Método 3: Más visual)
function initGoogleReviewsWidget() {
    // Script para widget de reseñas de Google
    const script = document.createElement('script');
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.setAttribute('data-use-service-core', '');
    script.defer = true;
    
    const widget = document.createElement('div');
    widget.className = 'elfsight-app-google-reviews';
    widget.setAttribute('data-elfsight-app-google-reviews-id', 'TU_WIDGET_ID');
    
    document.querySelector('.google-reviews').appendChild(widget);
    document.head.appendChild(script);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botón para cargar reseñas de Google
    const loadReviewsBtn = document.getElementById('load-google-reviews');
    if (loadReviewsBtn) {
        loadReviewsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Abrir directamente el enlace de tu negocio en Google
            window.open(GOOGLE_PLACES_CONFIG.BUSINESS_URL, '_blank');
        });
    }
    
    // Botón para escribir reseña
    const writeReviewBtn = document.querySelector('.btn-outline');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Abrir el enlace para escribir una reseña
            window.open(GOOGLE_PLACES_CONFIG.BUSINESS_URL, '_blank');
        });
    }
    
    // Intentar cargar reseñas automáticamente (comentado por defecto)
    // loadGoogleReviews();
});

/* 
INSTRUCCIONES PARA INTEGRAR TUS RESEÑAS REALES DE GOOGLE:

OPCIÓN 1: API de Google Places (Más completa)
1. Ve a Google Cloud Console (console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google Places
4. Crea una clave API y restrígela a tu dominio
5. Obtén tu Place ID desde Google My Business
6. Reemplaza PLACE_ID y API_KEY en la configuración
7. Descomenta la línea loadGoogleReviews() al final

OPCIÓN 2: Iframe de Google Maps (Más simple)
1. Llama a loadGoogleReviewsIframe() 
2. Solo necesitas el nombre de tu negocio exacto
3. Se mostrará un mapa con reseñas integradas

OPCIÓN 3: Widget de terceros (Más visual)
1. Regístrate en Elfsight.com o similar
2. Configura un widget de Google Reviews
3. Reemplaza el ID del widget
4. Llama a initGoogleReviewsWidget()

OPCIÓN 4: Botón a Google (Actual - más segura)
- El botón "Ver todas las reseñas" abre tu perfil de Google
- Funciona inmediatamente sin configuración adicional
- Los usuarios pueden ver y escribir reseñas directamente en Google

RECOMENDACIÓN:
Para empezar, usa la Opción 4 (actual) y considera implementar 
la Opción 1 o 3 cuando tengas más tiempo para configurar APIs.
*/

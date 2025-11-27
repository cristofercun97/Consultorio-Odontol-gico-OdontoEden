# 📊 Configuración de Google Tag Manager - OdontoEden

## 🎯 Eventos Implementados

### 1. **Click en Botón WhatsApp** ✅
- **Evento**: `whatsapp_click`
- **Categoría**: WhatsApp
- **Acción**: Click WhatsApp
- **Etiqueta**: Flotante / Hero/CTA
- **Ubicaciones**:
  - Botón flotante (esquina inferior derecha)
  - Botón CTA en Hero section

### 2. **Envío de Formulario de Contacto** ✅
- **Evento**: `form_submit`
- **Categoría**: Formulario
- **Acción**: Envío Formulario Contacto
- **Etiqueta**: Formulario de contacto
- **Datos adicionales**: formName

### 3. **Clicks en Servicios** ✅
- **Evento**: `service_click`
- **Categoría**: Servicios
- **Acción**: Click en Tarjeta de Servicio
- **Etiqueta**: Nombre del servicio
- **Servicios rastreados**:
  - Odontología General
  - Estética Dental
  - Ortodoncia
  - Implantes
  - Odontopediatría
  - Cirugía Oral

### 4. **Scroll Depth (Profundidad de Scroll)** ✅
- **Evento**: `scroll_depth`
- **Categoría**: Engagement
- **Acción**: Scroll Depth
- **Etiquetas**:
  - 25%
  - 50%
  - 75%
  - 100%

### 5. **Eventos Adicionales Implementados** 🎁

#### Navegación
- **Evento**: `navigation_click`
- **Categoría**: Navegación
- **Acción**: Click Menú
- **Etiqueta**: Nombre de la sección

#### Galería
- **Evento**: `gallery_click`
- **Categoría**: Galería
- **Acción**: Click Imagen
- **Etiqueta**: Título de la imagen

#### Tiempo en Página
- **Evento**: `time_on_page`
- **Categoría**: Engagement
- **Acción**: Tiempo en página
- **Etiquetas**: 30 segundos, 60 segundos

#### Contacto Directo
- **Evento**: `contact_click`
- **Categoría**: Contacto
- **Acción**: Click Teléfono / Click Email
- **Método de contacto**: Teléfono o Email

#### Enlaces Externos
- **Evento**: `outbound_link`
- **Categoría**: Outbound Links
- **Acción**: Click Link Externo
- **Etiqueta**: URL del destino

---

## 🔧 Configuración en Google Tag Manager

### Paso 1: Crear Variables Personalizadas

Ve a **Variables** > **Variables definidas por el usuario** > **Nueva**

1. **Event Category**
   - Tipo: Variable de capa de datos
   - Nombre: `eventCategory`

2. **Event Action**
   - Tipo: Variable de capa de datos
   - Nombre: `eventAction`

3. **Event Label**
   - Tipo: Variable de capa de datos
   - Nombre: `eventLabel`

4. **Event Value**
   - Tipo: Variable de capa de datos
   - Nombre: `eventValue`

### Paso 2: Crear Activadores (Triggers)

#### Activador 1: Custom Click Event
- **Nombre**: Custom Click Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `custom_click`

#### Activador 2: Form Submit
- **Nombre**: Form Submit Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `form_submit`

#### Activador 3: Scroll Depth
- **Nombre**: Scroll Depth Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `scroll_depth`

#### Activador 4: WhatsApp Click
- **Nombre**: WhatsApp Click Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `whatsapp_click`

#### Activador 5: Service Click
- **Nombre**: Service Click Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `service_click`

#### Activador 6: Navigation Click
- **Nombre**: Navigation Click Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `navigation_click`

#### Activador 7: Gallery Click
- **Nombre**: Gallery Click Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `gallery_click`

#### Activador 8: Time on Page
- **Nombre**: Time on Page Event
- **Tipo**: Evento personalizado
- **Nombre del evento**: `time_on_page`

### Paso 3: Crear Etiquetas (Tags) - Google Analytics 4

#### Etiqueta 1: GA4 - Click Events
- **Tipo**: Evento de Google Analytics: GA4
- **ID de medición**: TU_GA4_MEASUREMENT_ID
- **Nombre del evento**: `{{eventAction}}`
- **Parámetros del evento**:
  - `event_category`: `{{eventCategory}}`
  - `event_label`: `{{eventLabel}}`
- **Activador**: Custom Click Event

#### Etiqueta 2: GA4 - Form Submit
- **Tipo**: Evento de Google Analytics: GA4
- **ID de medición**: TU_GA4_MEASUREMENT_ID
- **Nombre del evento**: `form_submit`
- **Parámetros del evento**:
  - `event_category`: `{{eventCategory}}`
  - `form_name`: `contact-form`
- **Activador**: Form Submit Event

#### Etiqueta 3: GA4 - Scroll Depth
- **Tipo**: Evento de Google Analytics: GA4
- **ID de medición**: TU_GA4_MEASUREMENT_ID
- **Nombre del evento**: `scroll`
- **Parámetros del evento**:
  - `percent_scrolled`: `{{eventLabel}}`
- **Activador**: Scroll Depth Event

#### Etiqueta 4: GA4 - WhatsApp Click
- **Tipo**: Evento de Google Analytics: GA4
- **ID de medición**: TU_GA4_MEASUREMENT_ID
- **Nombre del evento**: `whatsapp_click`
- **Parámetros del evento**:
  - `location`: `{{eventLabel}}`
  - `method`: `WhatsApp`
- **Activador**: WhatsApp Click Event

---

## 🧪 Cómo Probar los Eventos

### Método 1: Preview Mode en GTM
1. En GTM, haz click en **Vista previa**
2. Ingresa la URL de tu sitio web
3. Interactúa con la página:
   - Haz click en servicios
   - Desplázate por la página
   - Haz click en WhatsApp
   - Envía el formulario
4. Verifica que los eventos aparezcan en el panel de depuración

### Método 2: Consola del Navegador
1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Verás mensajes como: `GTM Event: {...}`
4. Cada interacción mostrará el evento enviado

### Método 3: Google Analytics 4 DebugView
1. En GA4, ve a **Configuración** > **DebugView**
2. Activa el modo debug en GTM Preview
3. Los eventos aparecerán en tiempo real

---

## 📈 Eventos Personalizados Enviados

```javascript
// Ejemplo de evento de WhatsApp
{
  'event': 'whatsapp_click',
  'eventCategory': 'WhatsApp',
  'eventAction': 'Click WhatsApp',
  'eventLabel': 'Flotante',
  'contactMethod': 'WhatsApp'
}

// Ejemplo de evento de Scroll Depth
{
  'event': 'scroll_depth',
  'eventCategory': 'Engagement',
  'eventAction': 'Scroll Depth',
  'eventLabel': '50%',
  'scrollDepth': 50
}

// Ejemplo de evento de Formulario
{
  'event': 'form_submit',
  'eventCategory': 'Formulario',
  'eventAction': 'Envío Formulario Contacto',
  'eventLabel': 'Formulario de contacto',
  'formName': 'contact-form'
}
```

---

## 🎯 Métricas Importantes a Monitorear

### Conversiones
- Clicks en WhatsApp (principal CTA)
- Envíos de formulario
- Clicks en teléfono/email

### Engagement
- Scroll depth (% de usuarios que leen contenido completo)
- Tiempo en página
- Clicks en servicios (interés en servicios específicos)

### Navegación
- Secciones más visitadas
- Flujo de navegación
- Imágenes de galería más vistas

---

## 🚀 Próximos Pasos

1. **Conectar Google Analytics 4**
   - Crear propiedad en GA4
   - Obtener Measurement ID
   - Crear etiqueta de configuración en GTM

2. **Configurar Conversiones**
   - Definir eventos de conversión en GA4
   - Configurar objetivos
   - Crear embudos de conversión

3. **Crear Audiencias**
   - Usuarios que vieron 75%+ de la página
   - Usuarios que hicieron click en WhatsApp pero no enviaron mensaje
   - Usuarios interesados en servicios específicos

4. **Configurar Remarketing**
   - Pixel de Facebook
   - Google Ads Remarketing
   - Audiencias personalizadas

---

## 📝 Notas Importantes

- Todos los eventos se registran automáticamente
- Los datos se envían a `window.dataLayer`
- Compatible con GA4 y Universal Analytics
- Optimizado para rendimiento (throttling en scroll)
- Sin dependencias externas

---

## 🐛 Troubleshooting

**Problema**: Los eventos no aparecen en GTM Preview
- **Solución**: Verifica que `gtm-events.js` se carga correctamente
- Revisa la consola del navegador por errores

**Problema**: dataLayer no está definido
- **Solución**: Asegúrate que GTM se carga antes que gtm-events.js
- Verifica que el contenedor GTM está publicado

**Problema**: Eventos duplicados
- **Solución**: No agregues listeners adicionales en script.js
- El archivo gtm-events.js maneja todo automáticamente

---

## ✅ Checklist de Implementación

- [x] Google Tag Manager instalado
- [x] Script gtm-events.js agregado
- [x] Atributos data-gtm en elementos HTML
- [x] Eventos de click configurados
- [x] Eventos de formulario configurados
- [x] Scroll depth implementado
- [ ] Variables creadas en GTM
- [ ] Activadores creados en GTM
- [ ] Etiquetas de GA4 creadas
- [ ] Eventos probados en Preview Mode
- [ ] Contenedor GTM publicado

---

**Desarrollado para OdontoEden** 🦷
**Fecha**: Noviembre 2025

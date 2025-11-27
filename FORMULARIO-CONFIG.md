# 📧 Guía de Configuración - Sistema de Contactos OdontoEden

## 🎯 Sistema Implementado

Se han implementado **2 métodos** para gestionar los contactos del formulario:

### ✅ Método 1: EmailJS (Recomendado)
- Envía emails automáticos
- Sin necesidad de backend
- Gratuito hasta 200 emails/mes
- Fácil de configurar

### ✅ Método 2: LocalStorage + Panel Admin (Ya Funcionando)
- Guarda contactos en el navegador
- Panel de administración incluido
- Exportación a CSV
- WhatsApp integrado

---

## 🚀 Configuración de EmailJS (5 minutos)

### Paso 1: Crear Cuenta en EmailJS

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click en **Sign Up** (Registrarse)
3. Usa tu email **odontoedenuio@gmail.com**
4. Verifica tu email

### Paso 2: Configurar Servicio de Email

1. En el Dashboard, ve a **Email Services**
2. Click en **Add New Service**
3. Selecciona **Gmail**
4. Click en **Connect Account**
5. Autoriza con tu cuenta de Gmail
6. Copia el **Service ID** (ejemplo: `service_abc123`)

### Paso 3: Crear Template (Plantilla)

1. Ve a **Email Templates**
2. Click en **Create New Template**
3. Usa esta configuración:

**Template Name:** `odontoeden_contacto`

**Subject:** `Nuevo contacto desde OdontoEden - {{user_name}}`

**Content (HTML):**
```html
<h2>Nuevo Contacto Recibido</h2>

<p><strong>Nombre:</strong> {{user_name}}</p>
<p><strong>Email:</strong> {{user_email}}</p>
<p><strong>Teléfono:</strong> {{user_phone}}</p>
<p><strong>Mensaje:</strong></p>
<p>{{message}}</p>

<hr>
<p><small>Recibido el: {{date}}</small></p>
```

4. En **To Email**, pon: `odontoedenuio@gmail.com`
5. Click en **Save**
6. Copia el **Template ID** (ejemplo: `template_xyz789`)

### Paso 4: Obtener Public Key

1. Ve a **Account** > **General**
2. Encuentra tu **Public Key**
3. Cópiala (ejemplo: `abcdefGHIJKLMN`)

### Paso 5: Configurar en el Código

Abre el archivo `script.js` y busca estas líneas (aproximadamente línea 102):

```javascript
const EMAILJS_CONFIG = {
    publicKey: 'TU_PUBLIC_KEY',  // ← Pega tu Public Key aquí
    serviceID: 'TU_SERVICE_ID',   // ← Pega tu Service ID aquí
    templateID: 'TU_TEMPLATE_ID'  // ← Pega tu Template ID aquí
};
```

**Reemplaza con tus valores:**

```javascript
const EMAILJS_CONFIG = {
    publicKey: 'abcdefGHIJKLMN',      // Tu Public Key real
    serviceID: 'service_abc123',      // Tu Service ID real
    templateID: 'template_xyz789'     // Tu Template ID real
};
```

### ✅ ¡Listo! El formulario ya enviará emails

---

## 📱 Panel de Administración (Ya Funcionando)

### Acceder al Panel

Abre en tu navegador:
```
file:///Users/mac/Desktop/odontoeden2/admin-contactos.html
```

O simplemente haz doble clic en: **`admin-contactos.html`**

### Características del Panel

#### 📊 Estadísticas en Tiempo Real
- Total de contactos
- Contactos de hoy
- Contactos de esta semana

#### 🔍 Búsqueda Avanzada
- Busca por nombre, email o teléfono
- Filtrado en tiempo real

#### 📥 Exportación
- Exporta todos los contactos a CSV
- Compatible con Excel y Google Sheets

#### 💬 WhatsApp Directo
- Click en botón verde para contactar por WhatsApp
- Mensaje personalizado automático

#### 🗑️ Gestión
- Elimina contactos individuales
- Limpia todos los contactos
- Vista de detalles completa

---

## 🔄 Cómo Funciona (Sistema Dual)

### Cuando un usuario envía el formulario:

1. **Si EmailJS está configurado:**
   - ✅ Envía email a odontoedenuio@gmail.com
   - ✅ Guarda en LocalStorage (respaldo)
   - ✅ Muestra mensaje de éxito
   - ✅ Limpia el formulario

2. **Si EmailJS NO está configurado:**
   - ✅ Guarda en LocalStorage
   - ✅ Muestra mensaje de éxito
   - ✅ Abre WhatsApp automáticamente (opcional)
   - ✅ Limpia el formulario

### Datos Guardados

Cada contacto incluye:
```javascript
{
  id: 1732745123456,
  user_name: "Juan Pérez",
  user_email: "juan@email.com",
  user_phone: "0958882566",
  message: "Necesito información sobre implantes",
  date: "miércoles, 27 de noviembre de 2024, 15:30",
  timestamp: "2024-11-27T15:30:45.123Z"
}
```

---

## 📋 Alternativas a EmailJS (Si prefieres otras)

### Opción 1: Formspree
```html
<!-- Cambiar en index.html -->
<form action="https://formspree.io/f/TU_FORM_ID" method="POST">
```

### Opción 2: Google Sheets (Con Google Apps Script)
- Requiere más configuración
- Guarda directamente en hoja de cálculo

### Opción 3: Web3Forms
```html
<input type="hidden" name="access_key" value="TU_ACCESS_KEY">
<form action="https://api.web3forms.com/submit" method="POST">
```

---

## 🎨 Personalización del Email

### Cambiar el diseño del email:

En EmailJS Template, puedes usar HTML/CSS:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #2c5aa0; color: white; padding: 20px; }
        .content { padding: 20px; }
        .info { background: #f8f9fa; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦷 OdontoEden - Nuevo Contacto</h1>
    </div>
    <div class="content">
        <div class="info">
            <strong>Nombre:</strong> {{user_name}}
        </div>
        <div class="info">
            <strong>Email:</strong> {{user_email}}
        </div>
        <div class="info">
            <strong>Teléfono:</strong> {{user_phone}}
        </div>
        <div class="info">
            <strong>Mensaje:</strong><br>
            {{message}}
        </div>
        <p><small>Recibido: {{date}}</small></p>
    </div>
</body>
</html>
```

---

## 📊 Exportar Contactos a Google Sheets

### Opción Manual:
1. Abre el panel: `admin-contactos.html`
2. Click en **Exportar CSV**
3. Abre Google Sheets
4. **Archivo** > **Importar** > Selecciona el CSV

### Opción Automática (Avanzada):
Puedes configurar Zapier o Make (Integromat) para enviar automáticamente a Google Sheets.

---

## 🔒 Seguridad y Privacidad

### LocalStorage
- Los datos se guardan solo en TU navegador
- No son accesibles desde otros dispositivos
- Se pierden si se limpian datos del navegador

### Recomendaciones:
1. **Haz backup regular** (exporta a CSV semanalmente)
2. **Configura EmailJS** para tener respaldo en email
3. **No compartas** el link de admin-contactos.html públicamente

---

## 🐛 Troubleshooting

### Problema: No llegan emails
**Solución:**
- Verifica que los IDs de EmailJS sean correctos
- Revisa la carpeta de SPAM
- Verifica que el servicio de Gmail esté conectado

### Problema: Formulario no envía
**Solución:**
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que script.js se carga correctamente

### Problema: Panel no muestra contactos
**Solución:**
- Los contactos se guardan por dominio/archivo
- Asegúrate de abrir desde la misma ubicación
- Verifica en DevTools > Application > LocalStorage

---

## ✅ Checklist de Implementación

- [x] Formulario con nombres en inputs
- [x] EmailJS CDN agregado
- [x] Script de manejo de formulario
- [x] LocalStorage como respaldo
- [x] Panel de administración
- [x] Exportación a CSV
- [x] Integración con WhatsApp
- [x] Mensajes de éxito/error
- [x] Animaciones de loading
- [ ] Configurar EmailJS (5 min)
- [ ] Probar envío de formulario
- [ ] Verificar recepción de email

---

## 🎯 Próximos Pasos Recomendados

1. **Hoy:**
   - Configura EmailJS (5 minutos)
   - Prueba el formulario
   - Verifica que lleguen los emails

2. **Esta Semana:**
   - Revisa contactos en el panel diariamente
   - Exporta backup a CSV
   - Responde a los contactos

3. **Próximo Mes:**
   - Considera migrar a una base de datos real
   - Integra con CRM (HubSpot, Zoho)
   - Configura respuestas automáticas

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que todos los archivos estén en la carpeta
3. Consulta la documentación de EmailJS

**Archivos Importantes:**
- `index.html` - Formulario principal
- `script.js` - Lógica del formulario
- `admin-contactos.html` - Panel de administración
- `FORMULARIO-CONFIG.md` - Esta guía

---

**Desarrollado para OdontoEden** 🦷
**Sistema de Contactos v1.0**
**Fecha: Noviembre 2025**
